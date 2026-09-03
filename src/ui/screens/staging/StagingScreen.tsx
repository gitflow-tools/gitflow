import React, { useState, useCallback } from 'react';
import { Box, Text } from 'ink';
import { Panel } from '../../components/layout/Panel.js';
import { ConfirmDialog } from '../../components/ConfirmDialog.js';
import { ErrorDisplay } from '../../components/ErrorDisplay.js';
import { FileSelector } from './FileSelector.js';
import { ScreenHeader } from '../../components/ScreenHeader.js';
import { CommandPanel } from '../../components/CommandPanel.js';
import { colors } from '../../theme/colors.js';
import { stageFiles } from '../../../git/client.js';
import { toGitflowError, type GitflowError } from '../../../utils/errors.js';
import type { RepoInfo } from '../../../git/types.js';

interface StagingScreenProps {
  cwd: string;
  repoInfo: RepoInfo;
  onRefresh: () => Promise<void>;
  onBack: () => void;
}

type StagingView =
  | 'stageSelect'
  | 'confirmStage'
  | 'error';

export function StagingScreen({
  cwd,
  repoInfo,
  onRefresh,
  onBack,
}: StagingScreenProps): React.ReactElement {
  const [view, setView] = useState<StagingView>('stageSelect');
  const [error, setError] = useState<GitflowError | null>(null);
  const [pendingPaths, setPendingPaths] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { workingTree } = repoInfo;
  const unstagedFiles = workingTree.unstagedFiles;
  const stagedCount = workingTree.stagedFiles.length;
  const unstagedCount = unstagedFiles.length;

  const handleStageSubmit = useCallback((paths: string[]): void => {
    if (paths.length === 0) {
      return;
    }
    setPendingPaths(paths);
    setView('confirmStage');
  }, []);

  const handleConfirmStage = useCallback(async (): Promise<void> => {
    if (pendingPaths.length === 0) {
      setView('stageSelect');
      return;
    }
    setIsLoading(true);
    try {
      await stageFiles(cwd, pendingPaths);
      await onRefresh();
      setPendingPaths([]);
      setView('stageSelect');
    } catch (err) {
      setError(toGitflowError(err, 'Staging Failed'));
      setView('error');
    } finally {
      setIsLoading(false);
    }
  }, [cwd, pendingPaths, onRefresh]);

  if (isLoading) {
    return (
      <Panel title="stage changes" flexGrow={1} width="100%">
        <Text color={colors.grey}>Staging files…</Text>
      </Panel>
    );
  }

  if (view === 'error' && error) {
    return (
      <Panel title="stage changes" flexGrow={1} width="100%">
        <ErrorDisplay title={error.title} message={error.message} hint={error.suggestion} />
        <Box marginTop={1}>
          <Text color={colors.grey}>Esc close</Text>
        </Box>
      </Panel>
    );
  }

  if (view === 'confirmStage') {
    const command = `git add -- ${pendingPaths.map(p => `"${p.replace(/"/g, '\\"')}"`).join(' ')}`;
    return (
      <Panel title="stage changes" flexGrow={1} width="100%">
        <ScreenHeader title="Stage Files" />
        <Text>
          Stage {pendingPaths.length} selected file{pendingPaths.length === 1 ? '' : 's'}?
        </Text>
        <Box marginY={1}>
          <CommandPanel command={command} />
        </Box>
        <ConfirmDialog
          message="Confirm staging?"
          onConfirm={() => void handleConfirmStage()}
          onCancel={() => {
            setPendingPaths([]);
            setView('stageSelect');
          }}
        />
      </Panel>
    );
  }

  if (unstagedCount === 0) {
    return (
      <Panel
        title="stage changes"
        flexGrow={1}
        width="100%"
        titleRight={`${stagedCount} staged · 0 unstaged`}
      >
        <ScreenHeader title="Stage Changes" />
        <Box flexDirection="column" gap={1} marginTop={1}>
          <Text color={colors.green}>Working tree is clean.</Text>
          <Text dimColor>No unstaged or untracked files to stage.</Text>
        </Box>
        <Box marginTop={1}>
          <Text color={colors.grey}>Esc close</Text>
        </Box>
      </Panel>
    );
  }

  return (
    <Panel
      title="stage changes"
      flexGrow={1}
      width="100%"
      titleRight={`${stagedCount} staged · ${unstagedCount} unstaged`}
    >
      <FileSelector
        title="Select files to stage"
        files={unstagedFiles}
        onSubmit={handleStageSubmit}
        onCancel={onBack}
      />
    </Panel>
  );
}
