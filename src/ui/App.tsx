import React, { useCallback, useState } from 'react';
import { Box, Text } from 'ink';
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

type AppScreen = 'menu' | 'status' | 'staging' | 'commit' | 'push' | 'pull' | 'initWizard';

interface AppProps {
  cwd: string;
  isRepo: boolean;
  repoInfo: RepoInfo | null;
}

export function App({
  cwd,
  isRepo: initialIsRepo,
  repoInfo: initialRepoInfo,
}: AppProps): React.ReactElement {
  const [screen, setScreen] = useState<AppScreen>('menu');
  const [isRepo, setIsRepo] = useState(initialIsRepo);
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(initialRepoInfo);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshRepoState = useCallback(async (): Promise<void> => {
    setIsRefreshing(true);
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
    } finally {
      setIsRefreshing(false);
    }
  }, [cwd]);

  const handleNavigate = useCallback((action: MenuAction): void => {
    if (action === 'status') setScreen('status');
    if (action === 'staging') setScreen('staging');
    if (action === 'commit') setScreen('commit');
    if (action === 'push') setScreen('push');
    if (action === 'pull') setScreen('pull');
    if (action === 'init') setScreen('initWizard');
  }, []);

  const handleBack = useCallback((): void => {
    setScreen('menu');
  }, []);

  const handleInitComplete = useCallback((): void => {
    void refreshRepoState().then(() => {
      setScreen('menu');
    });
  }, [refreshRepoState]);

  if (isRefreshing && screen === 'menu') {
    return (
      <Box paddingX={1}>
        <Text dimColor>Refreshing repository state...</Text>
      </Box>
    );
  }

  if (screen === 'status') {
    if (repoInfo == null) {
      return (
        <Box paddingX={1}>
          <Text color="red">Repository information unavailable.</Text>
        </Box>
      );
    }
    return <RepositoryStatus repoInfo={repoInfo} onBack={handleBack} />;
  }

  if (screen === 'staging') {
    if (repoInfo == null) {
      return (
        <Box paddingX={1}>
          <Text color="red">Repository information unavailable.</Text>
        </Box>
      );
    }
    return (
      <StagingScreen
        cwd={cwd}
        repoInfo={repoInfo}
        onRefresh={refreshRepoState}
        onBack={handleBack}
      />
    );
  }

  if (screen === 'commit') {
    if (repoInfo == null) {
      return (
        <Box paddingX={1}>
          <Text color="red">Repository information unavailable.</Text>
        </Box>
      );
    }
    return (
      <CommitScreen
        cwd={cwd}
        repoInfo={repoInfo}
        onRefresh={refreshRepoState}
        onBack={handleBack}
        onGoToStaging={() => setScreen('staging')}
        onViewStatus={() => setScreen('status')}
        onPushChanges={() => setScreen('push')}
      />
    );
  }

  if (screen === 'push') {
    if (repoInfo == null) {
      return (
        <Box paddingX={1}>
          <Text color="red">Repository information unavailable.</Text>
        </Box>
      );
    }
    return (
      <PushScreen
        cwd={cwd}
        repoInfo={repoInfo}
        onRefresh={refreshRepoState}
        onBack={handleBack}
        onGoToPull={() => setScreen('pull')}
      />
    );
  }

  if (screen === 'pull') {
    if (repoInfo == null) {
      return (
        <Box paddingX={1}>
          <Text color="red">Repository information unavailable.</Text>
        </Box>
      );
    }
    return (
      <PullScreen
        cwd={cwd}
        repoInfo={repoInfo}
        onRefresh={refreshRepoState}
        onBack={handleBack}
        onGoToStaging={() => setScreen('staging')}
      />
    );
  }

  if (screen === 'initWizard') {
    return <InitWizard cwd={cwd} onComplete={handleInitComplete} onCancel={handleBack} />;
  }

  return <MainMenu cwd={cwd} isRepo={isRepo} repoInfo={repoInfo} onNavigate={handleNavigate} />;
}
