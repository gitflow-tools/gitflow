import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { Panel } from '../../components/layout/Panel.js';
import { Menu } from '../../components/Menu.js';
import { ErrorDisplay } from '../../components/ErrorDisplay.js';
import { ScreenHeader } from '../../components/ScreenHeader.js';
import { CommandPanel } from '../../components/CommandPanel.js';
import { InfoRow } from '../../components/Section.js';
import { colors } from '../../theme/colors.js';
import { push, addRemote } from '../../../git/client.js';
import { toGitflowError, type GitflowError } from '../../../utils/errors.js';
import { validateRemoteName, validateRemoteUrl } from '../../../git/remote.js';
import type { RepoInfo } from '../../../git/types.js';
import type { MenuItem } from '../../components/Menu.js';

interface PushScreenProps {
  cwd: string;
  repoInfo: RepoInfo;
  onRefresh: () => Promise<void>;
  onBack: () => void;
  onGoToPull?: () => void;
}

type PushView = 'overview' | 'selectRemote' | 'addRemote' | 'pushing' | 'success' | 'error' | 'confirmForce';

function PushShell({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <Panel title="push" flexGrow={1} width="100%">
      {children}
    </Panel>
  );
}

export function PushScreen({
  cwd,
  repoInfo,
  onRefresh,
  onBack,
  onGoToPull,
}: PushScreenProps): React.ReactElement {
  const { branch, remotes, upstream, aheadBehind } = repoInfo;
  const [selectedRemote, setSelectedRemote] = useState<string>(
    upstream?.remote ?? remotes[0] ?? 'origin',
  );
  const [view, setView] = useState<PushView>('overview');
  const [error, setError] = useState<GitflowError | null>(null);
  const [newRemoteName, setNewRemoteName] = useState('origin');
  const [newRemoteUrl, setNewRemoteUrl] = useState('');
  const [addRemoteStep, setAddRemoteStep] = useState<'name' | 'url'>('url');
  const [addRemoteError, setAddRemoteError] = useState<string | null>(null);

  const hasRemotes = remotes.length > 0;
  const hasUpstream = upstream != null;
  const targetBranch = branch;
  const buildCommandString = (force: boolean): string => {
    const parts = ['git push'];
    if (force) parts.push('--force-with-lease');
    else if (!hasUpstream) parts.push('-u');
    parts.push(selectedRemote, targetBranch);
    return parts.join(' ');
  };
  const commandString = buildCommandString(false);
  const forceCommandString = buildCommandString(true);

  const handleExecutePush = async (force = false): Promise<void> => {
    setView('pushing');
    try {
      await push(cwd, { remote: selectedRemote, branch: targetBranch, setUpstream: !hasUpstream, force });
      await onRefresh();
      setView('success');
    } catch (err) {
      const parsed = toGitflowError(err, 'Push Failed');
      setError(parsed);
      setView('error');
    }
  };

  const handleAddRemoteSubmit = async (): Promise<void> => {
    if (addRemoteStep === 'name') {
      const nameVal = validateRemoteName(newRemoteName);
      if (!nameVal.valid) {
        setAddRemoteError(nameVal.error ?? 'Invalid name');
        return;
      }
      setAddRemoteError(null);
      setAddRemoteStep('url');
      return;
    }
    const urlVal = validateRemoteUrl(newRemoteUrl);
    if (!urlVal.valid) {
      setAddRemoteError(urlVal.error ?? 'Invalid URL');
      return;
    }
    try {
      await addRemote(cwd, newRemoteName.trim(), newRemoteUrl.trim());
      setSelectedRemote(newRemoteName.trim());
      await onRefresh();
      setView('overview');
    } catch (err) {
      setError(toGitflowError(err, 'Add Remote Failed'));
      setView('error');
    }
  };

  if (!hasRemotes && view !== 'addRemote' && view !== 'error') {
    return (
      <PushShell>
        <Text color={colors.yellow} bold>
          No remote configured.
        </Text>
        <Text>Add a remote repository before pushing changes.</Text>
        <Box marginTop={1}>
          <Menu
            items={[
              { label: 'Configure remote', value: 'addRemote' },
            ]}
            onSelect={item => {
              if (item.value === 'addRemote') setView('addRemote');
            }}
          />
        </Box>
      </PushShell>
    );
  }

  if (view === 'addRemote') {
    return (
      <PushShell>
        <ScreenHeader title="Configure Remote" />
        {addRemoteStep === 'name' ? (
          <Box flexDirection="column" gap={1}>
            <Text color={colors.grey}>Remote name (default: origin):</Text>
            <TextInput
              value={newRemoteName}
              onChange={setNewRemoteName}
              onSubmit={handleAddRemoteSubmit}
            />
          </Box>
        ) : (
          <Box flexDirection="column" gap={1}>
            <Text color={colors.grey}>Remote URL (e.g. https://github.com/user/repo.git):</Text>
            <TextInput
              value={newRemoteUrl}
              onChange={setNewRemoteUrl}
              onSubmit={handleAddRemoteSubmit}
            />
          </Box>
        )}
        {addRemoteError && <Text color={colors.red}>⚠ {addRemoteError}</Text>}
        <Text color={colors.grey}>Enter submit · Esc cancel</Text>
        <Menu items={[{ label: 'Cancel', value: 'cancel' }]} onSelect={() => setView('overview')} />
      </PushShell>
    );
  }

  if (view === 'selectRemote') {
    const remoteItems: MenuItem[] = remotes.map(r => ({ label: r, value: r }));
    remoteItems.push({ label: 'Cancel', value: '__cancel__' });
    return (
      <PushShell>
        <ScreenHeader title="Select Remote" />
        <Menu
          items={remoteItems}
          onSelect={item => {
            if (item.value !== '__cancel__') setSelectedRemote(item.value);
            setView('overview');
          }}
        />
      </PushShell>
    );
  }

  if (view === 'confirmForce') {
    return (
      <PushShell>
        <ScreenHeader title="Confirm Force Push" />
        <Text color={colors.yellow} bold>
          ⚠ Force push will overwrite remote history.
        </Text>
        <Box marginY={1}>
          <Text>This will use --force-with-lease which is safer than --force, but will still reject if the remote branch has been updated by someone else.</Text>
        </Box>
        <Box marginBottom={1}>
          <CommandPanel command={forceCommandString} />
        </Box>
        <Menu
          items={[
            { label: 'Force push', value: 'force' },
          ]}
          onSelect={item => {
            if (item.value === 'force') void handleExecutePush(true);
          }}
          onCancel={() => setView('overview')}
        />
      </PushShell>
    );
  }

  if (view === 'pushing') {
    return (
      <PushShell>
        <ScreenHeader title="Pushing changes…" />
        <Box flexDirection="column">
          <InfoRow label="remote">
            <Text>{selectedRemote}</Text>
          </InfoRow>
          <InfoRow label="branch">
            <Text>{targetBranch}</Text>
          </InfoRow>
        </Box>
        <Box marginTop={1}>
          <Text color={colors.yellow}>Please wait…</Text>
        </Box>
      </PushShell>
    );
  }

  if (view === 'success') {
    return (
      <PushShell>
        <Text color={colors.green} bold>
          ✓ Push completed successfully.
        </Text>
        <Text>
          {targetBranch} -&gt; {selectedRemote}/{targetBranch}
        </Text>
      </PushShell>
    );
  }

  if (view === 'error' && error) {
    const isRejected = error.title === 'Rejected Push';
    const errorItems: MenuItem[] = [
      ...(isRejected && onGoToPull ? [{ label: 'Pull latest changes', value: 'pull' }] : []),
      { label: 'Try again', value: 'retry' },
    ];
    return (
      <PushShell>
        <ErrorDisplay title={error.title} message={error.message} hint={error.suggestion} />
        <Box marginTop={1}>
          <Menu
            items={errorItems}
            onSelect={item => {
              if (item.value === 'pull' && onGoToPull) onGoToPull();
              else if (item.value === 'retry') setView('overview');
            }}
            onCancel={onBack}
          />
        </Box>
      </PushShell>
    );
  }

  const aheadText = aheadBehind
    ? aheadBehind.ahead > 0
      ? `${aheadBehind.ahead} commit${aheadBehind.ahead > 1 ? 's' : ''} ahead of ${upstream?.remote}/${upstream?.branch}`
      : `Up to date with ${upstream?.remote}/${upstream?.branch}`
    : 'No upstream tracking branch';

  const menuOptions: MenuItem[] = [
    {
      label: hasUpstream
        ? `Push to ${selectedRemote}`
        : `Push ${targetBranch} to ${selectedRemote}/${targetBranch}`,
      value: 'push',
    },
    {
      label: 'Force push',
      value: 'force',
    },
    ...(remotes.length > 1 ? [{ label: 'Select remote', value: 'selectRemote' }] : []),
  ];

  return (
    <PushShell>
      <ScreenHeader title="Push Changes" />
      <Box flexDirection="column" gap={1} marginBottom={1}>
        <InfoRow label="branch">
          <Text color={colors.pink}>{targetBranch}</Text>
        </InfoRow>
        <InfoRow label="remote">
          <Text>{selectedRemote}</Text>
        </InfoRow>
        <InfoRow label="status">
          <Text color={aheadBehind && aheadBehind.ahead > 0 ? colors.green : undefined}>
            {aheadText}
          </Text>
        </InfoRow>
      </Box>
      <Box marginBottom={1}>
        <CommandPanel command={commandString} />
      </Box>
      <Menu
        items={menuOptions}
        onSelect={item => {
          if (item.value === 'push') void handleExecutePush();
          else if (item.value === 'force') setView('confirmForce');
          else if (item.value === 'selectRemote') setView('selectRemote');
        }}
        onCancel={onBack}
      />
    </PushShell>
  );
}
