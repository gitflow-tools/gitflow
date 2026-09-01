import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { Menu } from '../../components/Menu.js';
import { ErrorDisplay } from '../../components/ErrorDisplay.js';
import { pull } from '../../../git/client.js';
import { toGitflowError, type GitflowError } from '../../../utils/errors.js';
import type { RepoInfo, PullResult } from '../../../git/types.js';
import type { MenuItem } from '../../components/Menu.js';

interface PullScreenProps {
  cwd: string;
  repoInfo: RepoInfo;
  onRefresh: () => Promise<void>;
  onBack: () => void;
  onGoToStaging?: () => void;
}

type PullView = 'overview' | 'dirtyWarning' | 'pulling' | 'result' | 'error';

export function PullScreen({
  cwd,
  repoInfo,
  onRefresh,
  onBack,
  onGoToStaging,
}: PullScreenProps): React.ReactElement {
  const { branch, remotes, upstream, fileStatus } = repoInfo;
  const isDirty = !fileStatus.isClean;

  const [view, setView] = useState<PullView>(isDirty ? 'dirtyWarning' : 'overview');
  const [error, setError] = useState<GitflowError | null>(null);
  const [pullResult, setPullResult] = useState<PullResult | null>(null);

  const hasRemotes = remotes.length > 0;
  const upstreamDisplay = upstream ? `${upstream.remote}/${upstream.branch}` : 'origin/' + branch;
  const commandString = upstream ? 'git pull' : `git pull ${remotes[0] ?? 'origin'} ${branch}`;

  const handleExecutePull = async (): Promise<void> => {
    setView('pulling');
    try {
      const res = await pull(
        cwd,
        upstream ? undefined : { remote: remotes[0] ?? 'origin', branch },
      );
      setPullResult(res);
      await onRefresh();
      setView('result');
    } catch (err) {
      const parsed = toGitflowError(err, 'Pull Failed');
      setError(parsed);
      setView('error');
    }
  };

  // No remotes configured
  if (!hasRemotes && view !== 'error') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="yellow">
          No remote configured.
        </Text>
        <Text>Add a remote repository before pulling changes.</Text>
        <Menu items={[{ label: 'Back', value: 'back' }]} onSelect={() => onBack()} />
      </Box>
    );
  }

  // Dirty Working Tree Warning View
  if (view === 'dirtyWarning') {
    const dirtyItems: MenuItem[] = [
      ...(onGoToStaging ? [{ label: 'View local changes', value: 'staging' }] : []),
      { label: 'Continue anyway', value: 'continue' },
      { label: 'Cancel', value: 'cancel' },
    ];

    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="yellow">
          ⚠ You have local changes.
        </Text>
        <Text>Pulling from remote may cause merge conflicts or overwrite uncommitted work.</Text>
        <Box flexDirection="column" marginY={1}>
          <Text dimColor>
            Local modifications: {fileStatus.modified} modified · {fileStatus.staged} staged ·{' '}
            {fileStatus.untracked} untracked
          </Text>
        </Box>
        <Menu
          items={dirtyItems}
          onSelect={item => {
            if (item.value === 'staging' && onGoToStaging) {
              onGoToStaging();
            } else if (item.value === 'continue') {
              setView('overview');
            } else {
              onBack();
            }
          }}
        />
      </Box>
    );
  }

  // Pulling View
  if (view === 'pulling') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="cyan">
          Pulling latest changes...
        </Text>
        <Text dimColor>Branch: {branch}</Text>
        <Text dimColor>Upstream: {upstreamDisplay}</Text>
        <Box marginTop={1}>
          <Text color="yellow">Please wait...</Text>
        </Box>
      </Box>
    );
  }

  // Pull Result View
  if (view === 'result' && pullResult) {
    if (pullResult.hasConflict) {
      return (
        <Box flexDirection="column" gap={1}>
          <Text bold color="red">
            ✗ Merge conflict detected.
          </Text>
          <Text>Git was unable to automatically merge some changes.</Text>

          {pullResult.conflictedFiles && pullResult.conflictedFiles.length > 0 && (
            <Box flexDirection="column" marginY={1}>
              <Text bold dimColor>
                Affected files:
              </Text>
              {pullResult.conflictedFiles.map(file => (
                <Text key={file} color="red">
                  {'  • ' + file}
                </Text>
              ))}
            </Box>
          )}

          <Box flexDirection="column" marginY={1}>
            <Text dimColor>Suggested steps:</Text>
            <Text>1. Resolve the conflicts manually in the affected files.</Text>
            <Text>2. Stage the resolved files:</Text>
            <Text color="cyan"> git add &lt;file&gt;</Text>
            <Text>3. Complete the merge:</Text>
            <Text color="cyan"> git commit</Text>
          </Box>

          <Menu
            items={[{ label: 'Return to repository', value: 'back' }]}
            onSelect={() => onBack()}
          />
        </Box>
      );
    }

    if (pullResult.alreadyUpToDate) {
      return (
        <Box flexDirection="column" gap={1}>
          <Text bold color="green">
            ✓ Already up to date.
          </Text>
          <Text dimColor>
            Branch {branch} is synchronized with {upstreamDisplay}.
          </Text>
          <Box marginTop={1}>
            <Menu
              items={[{ label: 'Return to repository', value: 'back' }]}
              onSelect={() => onBack()}
            />
          </Box>
        </Box>
      );
    }

    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="green">
          ✓ Pull completed successfully.
        </Text>

        <Box flexDirection="column" marginY={1}>
          <Text bold dimColor>
            Changes received:
          </Text>
          <Text color="cyan"> • {pullResult.filesChanged} files changed</Text>
          <Text color="green"> • +{pullResult.insertions} insertions</Text>
          <Text color="red"> • -{pullResult.deletions} deletions</Text>
        </Box>

        <Menu
          items={[{ label: 'Return to repository', value: 'back' }]}
          onSelect={() => onBack()}
          onCancel={onBack}
        />
      </Box>
    );
  }

  // Error View
  if (view === 'error' && error) {
    return (
      <Box flexDirection="column" gap={1}>
        <ErrorDisplay title={error.title} message={error.message} hint={error.suggestion} />
        <Box marginTop={1}>
          <Menu
            items={[
              { label: 'Try again', value: 'retry' },
              { label: 'Return to repository', value: 'back' },
            ]}
            onSelect={item => {
              if (item.value === 'retry') {
                setView('overview');
              } else {
                onBack();
              }
            }}
            onCancel={onBack}
          />
        </Box>
      </Box>
    );
  }

  // Overview View
  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">
        Pull Changes
      </Text>

      <Box flexDirection="column">
        <Text dimColor>Branch:</Text>
        <Text color="cyan">{branch}</Text>
      </Box>

      <Box flexDirection="column">
        <Text dimColor>Upstream:</Text>
        <Text>{upstreamDisplay}</Text>
      </Box>

      <Box flexDirection="column">
        <Text dimColor>Command:</Text>
        <Text color="cyan">{commandString}</Text>
      </Box>

      <Menu
        items={[
          { label: 'Pull latest changes', value: 'pull' },
          { label: 'Cancel', value: 'cancel' },
        ]}
        onSelect={item => {
          if (item.value === 'pull') {
            void handleExecutePull();
          } else {
            onBack();
          }
        }}
        onCancel={onBack}
      />
    </Box>
  );
}
