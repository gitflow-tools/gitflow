import React, { useCallback, useState } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import { FullscreenLayout } from './components/layout/FullscreenLayout.js';
import { Sidebar, type NavItem } from './components/layout/Sidebar.js';
import { MainMenu } from './screens/MainMenu.js';
import { RepositoryStatus } from './screens/RepositoryStatus.js';
import { InitWizard } from './screens/InitWizard.js';
import { StagingScreen } from './screens/staging/StagingScreen.js';
import { CommitScreen } from './screens/commit/CommitScreen.js';
import { PushScreen } from './screens/push/PushScreen.js';
import { PullScreen } from './screens/pull/PullScreen.js';
import { detectRepository, getRepoStatus } from '../git/repository.js';
import type { RepoInfo } from '../git/types.js';
import type { MenuAction } from './screens/MainMenu.js';
import { MENU_ACTIONS } from './screens/MainMenu.js';

export type AppScreen = 'menu' | 'status' | 'staging' | 'commit' | 'push' | 'pull' | 'initWizard';

interface AppProps {
  cwd: string;
  isRepo: boolean;
  repoInfo: RepoInfo | null;
  termWidth: number;
  termHeight: number;
}

const SIDEBAR_ITEMS = [
  { label: 'Repository', value: 'menu' },
  { label: 'Status', value: 'status' },
  { label: 'Stage', value: 'staging' },
  { label: 'Commit', value: 'commit' },
  { label: 'Pull', value: 'pull' },
  { label: 'Push', value: 'push' },
  { label: 'Settings', value: 'initWizard' },
] as const;

// Semantic mapping: workspace action value → sidebar item value
const WORKSPACE_TO_SIDEBAR: Record<string, string> = {
  status: 'status',
  staging: 'staging',
  commit: 'commit',
  pull: 'pull',
  push: 'push',
  init: 'initWizard',
};

function MinimumSize({ columns, rows }: { columns: number; rows: number }): React.ReactElement {
  return (
    <Box
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      width="100%"
      height="100%"
    >
      <Text color="#FF6B35" bold>
        gitflow
      </Text>
      <Box marginTop={1} flexDirection="column" alignItems="center">
        <Text>Terminal too small</Text>
        <Text dimColor>
          Needs at least 80 × 24 (currently {columns} × {rows})
        </Text>
      </Box>
    </Box>
  );
}

export function App({
  cwd,
  isRepo: initialIsRepo,
  repoInfo: initialRepoInfo,
  termWidth: propTermWidth,
  termHeight: propTermHeight,
}: AppProps): React.ReactElement {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [screen, setScreen] = useState<AppScreen>('menu');
  const [isRepo, setIsRepo] = useState(initialIsRepo);
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(initialRepoInfo);
  const [workspaceIndex, setWorkspaceIndex] = useState(0);

  const termWidth = propTermWidth || stdout?.columns || 0;
  const termHeight = propTermHeight || stdout?.rows || 0;

  const isTooSmall = termWidth > 0 && termHeight > 0 && (termWidth < 60 || termHeight < 20);

  const refreshRepoState = useCallback(async (): Promise<void> => {
    try {
      const detection = await detectRepository(cwd);
      setIsRepo(detection.isRepo);
      if (detection.isRepo) {
        const info = await getRepoStatus(cwd);
        setRepoInfo(info);
      } else {
        setRepoInfo(null);
      }
    } catch {
      void 0;
    }
  }, [cwd]);

  const navigateTo = useCallback((s: AppScreen): void => {
    setScreen(s);
  }, []);

  const handleNavigate = useCallback(
    (action: MenuAction): void => {
      if (action === 'init') {
        navigateTo('initWizard');
        return;
      }
      navigateTo(action);
    },
    [navigateTo],
  );

  const handleBack = useCallback((): void => {
    setScreen('menu');
  }, []);

  if (isTooSmall) {
    return <MinimumSize columns={termWidth} rows={termHeight} />;
  }

  const isMenuScreen = screen === 'menu';

  // Derive sidebar active index from workspace selection (root) or screen (sub-screens)
  const sidebarActiveIndex = (() => {
    if (isMenuScreen) {
      const action = MENU_ACTIONS[workspaceIndex];
      if (action) {
        const sidebarValue = WORKSPACE_TO_SIDEBAR[action.value];
        if (sidebarValue) {
          const idx = SIDEBAR_ITEMS.findIndex(item => item.value === sidebarValue);
          if (idx !== -1) return idx;
        }
      }
      return 0;
    }
    const idx = SIDEBAR_ITEMS.findIndex(item => item.value === screen);
    return idx !== -1 ? idx : 0;
  })();

  useInput((input, key) => {
    // q: quit only from main menu
    if (input === 'q' && isMenuScreen) {
      exit();
      return;
    }

    // Escape: always goes back to menu from sub-screens
    if (key.escape) {
      if (!isMenuScreen) {
        navigateTo('menu');
      }
      return;
    }

    // ?: help from main menu
    if (input === '?' && isMenuScreen) {
      navigateTo('initWizard');
      return;
    }

    // On main menu: arrows move workspace selection, Enter navigates
    if (isMenuScreen) {
      if (key.downArrow || input === 'j' || input === 'J') {
        setWorkspaceIndex(prev => {
          const next = prev < MENU_ACTIONS.length - 1 ? prev + 1 : 0;
          return next;
        });
      } else if (key.upArrow || input === 'k' || input === 'K') {
        setWorkspaceIndex(prev => {
          const next = prev > 0 ? prev - 1 : MENU_ACTIONS.length - 1;
          return next;
        });
      } else if (key.return) {
        const action = MENU_ACTIONS[workspaceIndex];
        if (action) {
          handleNavigate(action.value);
        }
      }
    }
    // On sub-screens: ↑ / ↓ / Enter / Space are NOT handled here.
    // The sub-screen's own components handle them via their own useInput.
  });

  const navItems: NavItem[] = SIDEBAR_ITEMS.map(item => {
    const disabled = item.value !== 'menu' && item.value !== 'initWizard' && !isRepo;
    const badge =
      item.value === 'status' && repoInfo && !repoInfo.fileStatus.isClean
        ? `${
            repoInfo.fileStatus.modified +
            repoInfo.fileStatus.staged +
            repoInfo.fileStatus.untracked
          }`
        : undefined;
    const badgeColor =
      item.value === 'status' && repoInfo && !repoInfo.fileStatus.isClean ? '#FACC15' : undefined;
    return { ...item, disabled, badge, badgeColor };
  });

  const navByScreen: Record<AppScreen, React.ReactNode> = {
    menu: (
      <MainMenu
        cwd={cwd}
        isRepo={isRepo}
        repoInfo={repoInfo}
        onNavigate={handleNavigate}
        selectedIndex={workspaceIndex}
      />
    ),
    status:
      repoInfo == null ? (
        <Box paddingX={1}>
          <Text color="red">Repository information unavailable.</Text>
        </Box>
      ) : (
        <RepositoryStatus repoInfo={repoInfo} onBack={handleBack} />
      ),
    staging:
      repoInfo == null ? (
        <Box paddingX={1}>
          <Text color="red">Repository information unavailable.</Text>
        </Box>
      ) : (
        <StagingScreen
          cwd={cwd}
          repoInfo={repoInfo}
          onRefresh={refreshRepoState}
          onBack={handleBack}
        />
      ),
    commit:
      repoInfo == null ? (
        <Box paddingX={1}>
          <Text color="red">Repository information unavailable.</Text>
        </Box>
      ) : (
        <CommitScreen
          cwd={cwd}
          repoInfo={repoInfo}
          onRefresh={refreshRepoState}
          onBack={handleBack}
          onGoToStaging={() => navigateTo('staging')}
          onViewStatus={() => navigateTo('status')}
          onPushChanges={() => navigateTo('push')}
        />
      ),
    push:
      repoInfo == null ? (
        <Box paddingX={1}>
          <Text color="red">Repository information unavailable.</Text>
        </Box>
      ) : (
        <PushScreen
          cwd={cwd}
          repoInfo={repoInfo}
          onRefresh={refreshRepoState}
          onBack={handleBack}
          onGoToPull={() => navigateTo('pull')}
        />
      ),
    pull:
      repoInfo == null ? (
        <Box paddingX={1}>
          <Text color="red">Repository information unavailable.</Text>
        </Box>
      ) : (
        <PullScreen
          cwd={cwd}
          repoInfo={repoInfo}
          onRefresh={refreshRepoState}
          onBack={handleBack}
          onGoToStaging={() => navigateTo('staging')}
        />
      ),
    initWizard: <InitWizard cwd={cwd} onComplete={handleBack} onCancel={handleBack} />,
  };

  const footerShortcuts = [
    { key: '↑↓', label: 'navigate' },
    { key: 'Enter', label: 'select' },
    { key: 'Esc', label: 'back' },
    { key: '?', label: 'help' },
    { key: 'q', label: 'quit' },
  ];

  const sidebarWidth = termWidth >= 120 ? 24 : 20;

  return (
    <FullscreenLayout
      cwd={cwd}
      repoInfo={repoInfo}
      isRepo={isRepo}
      sidebar={
        <Sidebar items={navItems} selectedIndex={0} activeIndex={sidebarActiveIndex} width={sidebarWidth} />
      }
      sidebarWidth={sidebarWidth}
      footerShortcuts={footerShortcuts}
      termWidth={termWidth}
      termHeight={termHeight}
    >
      <Box flexDirection="column" flexGrow={1} paddingX={1} paddingTop={1} overflow="hidden">
        {navByScreen[screen]}
      </Box>
    </FullscreenLayout>
  );
}
