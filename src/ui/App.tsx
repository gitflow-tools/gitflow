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

export type AppScreen = 'menu' | 'status' | 'staging' | 'commit' | 'push' | 'pull' | 'initWizard';

interface AppProps {
  cwd: string;
  isRepo: boolean;
  repoInfo: RepoInfo | null;
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
}: AppProps): React.ReactElement {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [screen, setScreen] = useState<AppScreen>('menu');
  const [isRepo, setIsRepo] = useState(initialIsRepo);
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(initialRepoInfo);
  const [sidebarIndex, setSidebarIndex] = useState(() =>
    SIDEBAR_ITEMS.findIndex(i => i.value === 'menu'),
  );

  const termWidth = stdout?.columns ?? 0;
  const termHeight = stdout?.rows ?? 0;

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

  const screenToSidebarIndex = (s: AppScreen): number => {
    const map: Record<AppScreen, number> = {
      menu: 0,
      status: 1,
      staging: 2,
      commit: 3,
      pull: 4,
      push: 5,
      initWizard: 6,
    };
    return map[s] ?? 0;
  };

  const navigateTo = useCallback((s: AppScreen): void => {
    setScreen(s);
    setSidebarIndex(screenToSidebarIndex(s));
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
    navigateTo('menu');
  }, [navigateTo]);

  if (isTooSmall) {
    return <MinimumSize columns={termWidth} rows={termHeight} />;
  }

  useInput((input, key) => {
    const isMenuScreen = screen === 'menu';
    const isStatusScreen = screen === 'status';
    const isStagingScreen = screen === 'staging';
    const isPullScreen = screen === "pull";
    const _isPushScreen = screen === "push";
    const isCommitScreen = screen === 'commit';

    // q: quit only from main menu screen
    if (input === 'q' && !isStatusScreen && !isStagingScreen && !isCommitScreen && !isPullScreen && isMenuScreen) {
      exit();
      return;
    }

    // Escape: context-aware back/cancel
    if (key.escape) {
      if (isStatusScreen) {
        navigateTo('menu');
      } else if (isMenuScreen) {
        // no-op on main menu
      } else if (isCommitScreen) {
        navigateTo('status');
      } else {
        navigateTo('menu');
      }
      return;
    }

    // Help: open help from main menu
    if (input === '?' && isMenuScreen) {
      navigateTo('initWizard');
      return;
    }

    // j / k: move sidebar selection (only when not on menu screen)
    if (!isMenuScreen) {
      if (key.downArrow || input === 'j' || input === 'J') {
        const next = sidebarIndex < SIDEBAR_ITEMS.length - 1 ? sidebarIndex + 1 : 0;
        const item = SIDEBAR_ITEMS[next];
        if (item) navigateTo(item.value as AppScreen);
      } else if (key.upArrow || input === 'k' || input === 'K') {
        const next = sidebarIndex > 0 ? sidebarIndex - 1 : SIDEBAR_ITEMS.length - 1;
        const item = SIDEBAR_ITEMS[next];
        if (item) navigateTo(item.value as AppScreen);
      }
    }

    // Enter: select (handled by respective screens via their own mechanisms)
    if (key.return && isMenuScreen) {
      // Enter on menu is handled by MainMenu's useInput
    }
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
        onExit={exit}
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
        <Sidebar items={navItems} selectedIndex={sidebarIndex} width={sidebarWidth} />
      }
      sidebarWidth={sidebarWidth}
      footerShortcuts={footerShortcuts}
    >
      <Box flexDirection="column" flexGrow={1} paddingX={1} paddingTop={1} overflow="hidden">
        {navByScreen[screen]}
      </Box>
    </FullscreenLayout>
  );
}
