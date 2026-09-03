import React, { useCallback, useEffect, useState } from 'react';
import { SplashScreen } from './components/SplashScreen.js';
import { App } from './App.js';
import { detectRepository, getRepoStatus } from '../git/repository.js';
import type { RepoInfo } from '../git/types.js';

interface BootstrapProps {
  cwd: string;
  termWidth: number;
  termHeight: number;
}

export function Bootstrap({ cwd, termWidth, termHeight }: BootstrapProps): React.ReactElement {
  const [showSplash, setShowSplash] = useState(true);
  const [isRepo, setIsRepo] = useState(false);
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);

  const minimumSplashDuration = 1000; // ms

  const handleSplashComplete = useCallback((): void => {
    setShowSplash(false);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const detection = await detectRepository(cwd);
        setIsRepo(detection.isRepo);
        if (detection.isRepo) {
          const info = await getRepoStatus(cwd);
          setRepoInfo(info);
        }
      } catch {
        setIsRepo(false);
      } finally {
        // Always wait minimum splash duration before hiding splash
        setTimeout(() => setShowSplash(false), minimumSplashDuration);
      }
    })();
  }, [cwd, minimumSplashDuration]);

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} termWidth={termWidth} termHeight={termHeight} />;
  }

  return <App cwd={cwd} isRepo={isRepo} repoInfo={repoInfo} termWidth={termWidth} termHeight={termHeight} />;
}