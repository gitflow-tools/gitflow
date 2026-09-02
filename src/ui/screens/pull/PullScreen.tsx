import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { Panel } from '../../components/layout/Panel.js';
import { Menu } from '../../components/Menu.js';
import { ErrorDisplay } from '../../components/ErrorDisplay.js';
import { ScreenHeader } from '../../components/ScreenHeader.js';
import { CommandPanel } from '../../components/CommandPanel.js';
import { InfoRow } from '../../components/Section.js';
import { colors } from '../../theme/colors.js';
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

function PullShell({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <Panel title="pull" flexGrow={1} width="100%">
      {children}
    </Panel>
  );
}

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

  if (!hasRemotes && view !== 'error') {
    return (
      <PullShell>
        <Text color={colors.yellow} bold>
          No remote configured.
        </Text>
        <Text>Add a remote repository before pulling changes.</Text>
        <Menu items={[{ label: 'Back', value: 'back' }]} onSelect={() => onBack()} />
      </PullShell>
    );
  }

  if (view === 'dirtyWarning') {
    const dirtyItems: MenuItem[] = [
      ...(onGoToStaging ? [{ label: 'View local changes', value: 'staging' }] : []),
      { label: 'Continue anyway', value: 'continue' },
      { label: 'Cancel', value: 'cancel' },
    ];
    return (
      <PullShell>
        <Text color={colors.yellow} bold>
          ⚠ You have local changes.
        </Text>
        <Text>Pulling from remote may cause merge conflicts or overwrite uncommitted work.</Text>
        <Box marginY={1}>
          <Text color={colors.grey}>
            Local modifications: {fileStatus.modified} modified · {fileStatus.staged} staged ·{' '}
            {fileStatus.untracked} untracked
          </Text>
        </Box>
        <CommandPanel command={commandString} label="will run" />
        <Menu
          items={dirtyItems}
          onSelect={item => {
            if (item.value === 'staging' && onGoToStaging) onGoToStaging();
            else if (item.value === 'continue') setView('overview');
            else onBack();
          }}
        />
      </PullShell>
    );
  }

  if (view === 'pulling') {
    return (
      <PullShell>
        <ScreenHeader title="Pulling latest changes…" />
        <Box flexDirection="column">
          <InfoRow label="branch">
            <Text>{branch}</Text>
          </InfoRow>
          <InfoRow label="upstream">
            <Text>{upstreamDisplay}</Text>
          </InfoRow>
        </Box>
        <Box marginTop={1}>
          <Text color={colors.yellow}>Please wait…</Text>
        </Box>
      </PullShell>
    );
  }

  if (view === 'result' && pullResult) {
    if (pullResult.hasConflict) {
      return (
        <PullShell>
          <Text color={colors.red} bold>
            ✗ Merge conflict detected.
          </Text>
          <Text>Git was unable to automatically merge some changes.</Text>
          {pullResult.conflictedFiles && pullResult.conflictedFiles.length > 0 && (
            <Box flexDirection="column" marginY={1}>
              <Text color={colors.pink} bold>
                Affected files:
              </Text>
              {pullResult.conflictedFiles.map(file => (
                <Text key={file} color={colors.red}>
                  {'  • ' + file}
                </Text>
              ))}
            </Box>
          )}
          <Box flexDirection="column" marginY={1}>
            <Text color={colors.grey}>Suggested steps:</Text>
            <Text>1. Resolve the conflicts manually in the affected files.</Text>
            <Text>2. Stage the resolved files:</Text>
            <Text color={colors.orange}> git add &lt;file&gt;</Text>
            <Text>3. Complete the merge:</Text>
            <Text color={colors.orange}> git commit</Text>
          </Box>
          <Menu
            items={[{ label: 'Return to repository', value: 'back' }]}
            onSelect={() => onBack()}
          />
        </PullShell>
      );
    }

    if (pullResult.alreadyUpToDate) {
      return (
        <PullShell>
          <Text color={colors.green} bold>
            ✓ Already up to date.
          </Text>
          <Text color={colors.grey}>
            Branch {branch} is synchronized with {upstreamDisplay}.
          </Text>
          <Box marginTop={1}>
            <Menu
              items={[{ label: 'Return to repository', value: 'back' }]}
              onSelect={() => onBack()}
            />
          </Box>
        </PullShell>
      );
    }

    return (
      <PullShell>
        <Text color={colors.green} bold>
          ✓ Pull completed successfully.
        </Text>
        <Box flexDirection="column" marginY={1}>
          <Text color={colors.pink} bold>
            Changes received:
          </Text>
          <Text color={colors.orange}> • {pullResult.filesChanged} files changed</Text>
          <Text color={colors.green}> • +{pullResult.insertions} insertions</Text>
          <Text color={colors.red}> • -{pullResult.deletions} deletions</Text>
        </Box>
        <Menu
          items={[{ label: 'Return to repository', value: 'back' }]}
          onSelect={() => onBack()}
          onCancel={onBack}
        />
      </PullShell>
    );
  }

  if (view === 'error' && error) {
    return (
      <PullShell>
        <ErrorDisplay title={error.title} message={error.message} hint={error.suggestion} />
        <Box marginTop={1}>
          <Menu
            items={[
              { label: 'Try again', value: 'retry' },
              { label: 'Return to repository', value: 'back' },
            ]}
            onSelect={item => {
              if (item.value === 'retry') setView('overview');
              else onBack();
            }}
            onCancel={onBack}
          />
        </Box>
      </PullShell>
    );
  }

  return (
    <PullShell>
      <ScreenHeader title="Pull Changes" />
      <Box flexDirection="column" gap={1} marginBottom={1}>
        <InfoRow label="branch">
          <Text color={colors.pink}>{branch}</Text>
        </InfoRow>
        <InfoRow label="upstream">
          <Text>{upstreamDisplay}</Text>
        </InfoRow>
      </Box>
      <Box marginBottom={1}>
        <CommandPanel command={commandString} />
      </Box>
      <Menu
        items={[
          { label: 'Pull latest changes', value: 'pull' },
          { label: 'Cancel', value: 'cancel' },
        ]}
        onSelect={item => {
          if (item.value === 'pull') void handleExecutePull();
          else onBack();
        }}
        onCancel={onBack}
      />
    </PullShell>
  );
}
