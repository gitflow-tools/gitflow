import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { Panel } from '../../components/layout/Panel.js';
import { Menu } from '../../components/Menu.js';
import { ConfirmDialog } from '../../components/ConfirmDialog.js';
import { ErrorDisplay } from '../../components/ErrorDisplay.js';
import { FileSelector } from './FileSelector.js';
import { DiffViewer } from './DiffViewer.js';
import { ScreenHeader } from '../../components/ScreenHeader.js';
import { CommandPanel } from '../../components/CommandPanel.js';
import { colors } from '../../theme/colors.js';
import {
  stageFiles,
  unstageFiles,
  stageAll,
  unstageAll,
  getFileDiff,
  type DiffResult,
} from '../../../git/client.js';
import { toGitflowError, type GitflowError } from '../../../utils/errors.js';
import type { RepoInfo, FileChange } from '../../../git/types.js';
import type { MenuItem } from '../../components/Menu.js';

interface StagingScreenProps {
  cwd: string;
  repoInfo: RepoInfo;
  onRefresh: () => Promise<void>;
  onBack: () => void;
}

type StagingView =
  | 'menu'
  | 'stageSelect'
  | 'unstageSelect'
  | 'confirmStageAll'
  | 'confirmUnstageAll'
  | 'selectDiffFile'
  | 'viewDiff'
  | 'error';

export function StagingScreen({
  cwd,
  repoInfo,
  onRefresh,
  onBack,
}: StagingScreenProps): React.ReactElement {
  const [view, setView] = useState<StagingView>('menu');
  const [error, setError] = useState<GitflowError | null>(null);
  const [selectedFileForDiff, setSelectedFileForDiff] = useState<FileChange | null>(null);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { workingTree } = repoInfo;
  const unstagedCount = workingTree.unstagedFiles.length;
  const stagedCount = workingTree.stagedFiles.length;
  const allChangedFiles = workingTree.files;

  const menuItems: ReadonlyArray<MenuItem> = [
    {
      label: `Stage files (${unstagedCount} unstaged)`,
      value: 'stage',
      disabled: unstagedCount === 0,
    },
    {
      label: `Unstage files (${stagedCount} staged)`,
      value: 'unstage',
      disabled: stagedCount === 0,
    },
    {
      label: 'Stage all changes',
      value: 'stageAll',
      disabled: unstagedCount === 0,
    },
    {
      label: 'Unstage all changes',
      value: 'unstageAll',
      disabled: stagedCount === 0,
    },
    {
      label: `Inspect changes (${allChangedFiles.length} files)`,
      value: 'diff',
      disabled: allChangedFiles.length === 0,
    },
    { label: 'Back', value: 'back' },
  ];

  const handleMenuSelect = (item: MenuItem): void => {
    switch (item.value) {
      case 'stage':
        setView('stageSelect');
        break;
      case 'unstage':
        setView('unstageSelect');
        break;
      case 'stageAll':
        setView('confirmStageAll');
        break;
      case 'unstageAll':
        setView('confirmUnstageAll');
        break;
      case 'diff':
        setView('selectDiffFile');
        break;
      case 'back':
        onBack();
        break;
    }
  };

  const handleStageFiles = async (paths: string[]): Promise<void> => {
    if (paths.length === 0) {
      setView('menu');
      return;
    }
    setIsLoading(true);
    try {
      await stageFiles(cwd, paths);
      await onRefresh();
      setView('menu');
    } catch (err) {
      setError(toGitflowError(err, 'Staging Failed'));
      setView('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnstageFiles = async (paths: string[]): Promise<void> => {
    if (paths.length === 0) {
      setView('menu');
      return;
    }
    setIsLoading(true);
    try {
      await unstageFiles(cwd, paths);
      await onRefresh();
      setView('menu');
    } catch (err) {
      setError(toGitflowError(err, 'Unstaging Failed'));
      setView('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStageAllConfirm = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await stageAll(cwd);
      await onRefresh();
      setView('menu');
    } catch (err) {
      setError(toGitflowError(err, 'Stage All Failed'));
      setView('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnstageAllConfirm = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await unstageAll(cwd);
      await onRefresh();
      setView('menu');
    } catch (err) {
      setError(toGitflowError(err, 'Unstage All Failed'));
      setView('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInspectDiff = async (file: FileChange): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await getFileDiff(cwd, file.path, file.isStaged);
      setSelectedFileForDiff(file);
      setDiffResult(res);
      setView('viewDiff');
    } catch (err) {
      setError(toGitflowError(err, 'Diff Inspection Failed'));
      setView('error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Panel title="stage files" flexGrow={1} width="100%">
        <Text color={colors.grey}>Updating repository state…</Text>
      </Panel>
    );
  }

  if (view === 'error' && error) {
    return (
      <Panel title="stage files" flexGrow={1} width="100%">
        <ErrorDisplay title={error.title} message={error.message} hint={error.suggestion} />
        <Box marginTop={1}>
          <Menu
            items={[{ label: 'Return to staging menu', value: 'retry' }]}
            onSelect={() => setView('menu')}
            onCancel={() => setView('menu')}
          />
        </Box>
      </Panel>
    );
  }

  if (view === 'stageSelect') {
    return (
      <Panel title="stage files" flexGrow={1} width="100%">
        <FileSelector
          title="Select files to stage"
          files={workingTree.unstagedFiles}
          onSubmit={paths => void handleStageFiles(paths)}
          onCancel={() => setView('menu')}
        />
      </Panel>
    );
  }

  if (view === 'unstageSelect') {
    return (
      <Panel title="stage files" flexGrow={1} width="100%">
        <FileSelector
          title="Select files to unstage"
          files={workingTree.stagedFiles}
          onSubmit={paths => void handleUnstageFiles(paths)}
          onCancel={() => setView('menu')}
        />
      </Panel>
    );
  }

  if (view === 'confirmStageAll') {
    return (
      <Panel title="stage all" flexGrow={1} width="100%">
        <ScreenHeader title="Stage All Changes" />
        <Text>
          This will stage all modified, deleted, and untracked files ({unstagedCount} files).
        </Text>
        <Box marginY={1}>
          <CommandPanel command="git add -A" />
        </Box>
        <ConfirmDialog
          message="Are you sure you want to stage all changes?"
          onConfirm={() => void handleStageAllConfirm()}
          onCancel={() => setView('menu')}
        />
      </Panel>
    );
  }

  if (view === 'confirmUnstageAll') {
    return (
      <Panel title="unstage all" flexGrow={1} width="100%">
        <ScreenHeader title="Unstage All Changes" />
        <Text>This will remove all files from staging ({stagedCount} files).</Text>
        <Box marginY={1}>
          <CommandPanel command="git restore --staged ." />
        </Box>
        <ConfirmDialog
          message="Are you sure you want to unstage all changes?"
          onConfirm={() => void handleUnstageAllConfirm()}
          onCancel={() => setView('menu')}
        />
      </Panel>
    );
  }

  if (view === 'selectDiffFile') {
    const diffMenuItems: MenuItem[] = allChangedFiles.map(f => ({
      label: `[${f.category}] ${f.path}`,
      value: f.path,
    }));
    diffMenuItems.push({ label: 'Back', value: '__back__' });

    return (
      <Panel title="inspect diff" flexGrow={1} width="100%">
        <ScreenHeader
          title="Select a file to inspect"
          subtitle={`${allChangedFiles.length} files`}
        />
        <Menu
          items={diffMenuItems}
          onSelect={item => {
            if (item.value === '__back__') {
              setView('menu');
              return;
            }
            const found = allChangedFiles.find(f => f.path === item.value);
            if (found) void handleInspectDiff(found);
          }}
          onCancel={() => setView('menu')}
        />
      </Panel>
    );
  }

  if (view === 'viewDiff' && selectedFileForDiff && diffResult) {
    return (
      <Panel title="diff" flexGrow={1} width="100%">
        <DiffViewer
          filePath={selectedFileForDiff.path}
          category={selectedFileForDiff.category}
          diff={diffResult.diff}
          truncated={diffResult.truncated}
          isUntracked={diffResult.isUntracked}
          totalLines={diffResult.totalLines}
          onBack={() => setView('selectDiffFile')}
        />
      </Panel>
    );
  }

  return (
    <Panel
      title="stage files"
      flexGrow={1}
      width="100%"
      titleRight={`${stagedCount} staged · ${unstagedCount} unstaged`}
    >
      <ScreenHeader title="File Staging" />
      <Menu items={menuItems} onSelect={handleMenuSelect} onCancel={onBack} />
    </Panel>
  );
}
