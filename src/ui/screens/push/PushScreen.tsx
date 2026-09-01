import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { Menu } from '../../components/Menu.js';
import { ErrorDisplay } from '../../components/ErrorDisplay.js';
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

type PushView = 'overview' | 'selectRemote' | 'addRemote' | 'pushing' | 'success' | 'error';

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
  const commandString = hasUpstream
    ? `git push ${selectedRemote} ${targetBranch}`
    : `git push -u ${selectedRemote} ${targetBranch}`;

  const handleExecutePush = async (): Promise<void> => {
    setView('pushing');
    try {
      await push(cwd, {
        remote: selectedRemote,
        branch: targetBranch,
        setUpstream: !hasUpstream,
      });
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

  // 1. If No Remote configured
  if (!hasRemotes && view !== 'addRemote' && view !== 'error') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="yellow">
          No remote configured.
        </Text>
        <Text>Add a remote repository before pushing changes.</Text>
        <Menu
          items={[
            { label: 'Configure remote', value: 'addRemote' },
            { label: 'Back', value: 'back' },
          ]}
          onSelect={item => {
            if (item.value === 'addRemote') {
              setView('addRemote');
            } else {
              onBack();
            }
          }}
        />
      </Box>
    );
  }

  // Add Remote View
  if (view === 'addRemote') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="cyan">
          Configure Remote
        </Text>
        {addRemoteStep === 'name' ? (
          <Box flexDirection="column" gap={1}>
            <Text dimColor>Remote name (default: origin):</Text>
            <TextInput
              value={newRemoteName}
              onChange={setNewRemoteName}
              onSubmit={handleAddRemoteSubmit}
            />
          </Box>
        ) : (
          <Box flexDirection="column" gap={1}>
            <Text dimColor>
              Remote URL (e.g. https://github.com/user/repo.git or git@github.com:user/repo.git):
            </Text>
            <TextInput
              value={newRemoteUrl}
              onChange={setNewRemoteUrl}
              onSubmit={handleAddRemoteSubmit}
            />
          </Box>
        )}
        {addRemoteError && <Text color="red">⚠ {addRemoteError}</Text>}
        <Box marginTop={1}>
          <Text dimColor>Enter Submit · Esc Cancel</Text>
        </Box>
        <Menu items={[{ label: 'Cancel', value: 'cancel' }]} onSelect={() => setView('overview')} />
      </Box>
    );
  }

  // Select Remote View
  if (view === 'selectRemote') {
    const remoteItems: MenuItem[] = remotes.map(r => ({
      label: r,
      value: r,
    }));
    remoteItems.push({ label: 'Cancel', value: '__cancel__' });

    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="cyan">
          Select Remote
        </Text>
        <Menu
          items={remoteItems}
          onSelect={item => {
            if (item.value !== '__cancel__') {
              setSelectedRemote(item.value);
            }
            setView('overview');
          }}
        />
      </Box>
    );
  }

  // Pushing View
  if (view === 'pushing') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="cyan">
          Pushing changes...
        </Text>
        <Text dimColor>Remote: {selectedRemote}</Text>
        <Text dimColor>Branch: {targetBranch}</Text>
        <Box marginTop={1}>
          <Text color="yellow">Please wait...</Text>
        </Box>
      </Box>
    );
  }

  // Success View
  if (view === 'success') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="green">
          ✓ Push completed successfully.
        </Text>
        <Text>
          {targetBranch} -&gt; {selectedRemote}/{targetBranch}
        </Text>
        <Box marginTop={1}>
          <Menu
            items={[{ label: 'Return to menu', value: 'back' }]}
            onSelect={() => onBack()}
            onCancel={onBack}
          />
        </Box>
      </Box>
    );
  }

  // Error View
  if (view === 'error' && error) {
    const isRejected = error.title === 'Rejected Push';
    const errorItems: MenuItem[] = [
      ...(isRejected && onGoToPull ? [{ label: 'Pull latest changes', value: 'pull' }] : []),
      { label: 'Try again', value: 'retry' },
      { label: 'Return to repository', value: 'back' },
    ];

    return (
      <Box flexDirection="column" gap={1}>
        <ErrorDisplay title={error.title} message={error.message} hint={error.suggestion} />
        <Box marginTop={1}>
          <Menu
            items={errorItems}
            onSelect={item => {
              if (item.value === 'pull' && onGoToPull) {
                onGoToPull();
              } else if (item.value === 'retry') {
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

  // Overview / Confirmation View
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
    ...(remotes.length > 1 ? [{ label: 'Select remote', value: 'selectRemote' }] : []),
    { label: 'Cancel', value: 'cancel' },
  ];

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">
        Push Changes
      </Text>

      <Box flexDirection="column">
        <Text dimColor>Branch:</Text>
        <Text color="cyan">{targetBranch}</Text>
      </Box>

      <Box flexDirection="column">
        <Text dimColor>Remote:</Text>
        <Text>{selectedRemote}</Text>
      </Box>

      <Box flexDirection="column">
        <Text dimColor>Status:</Text>
        <Text color={aheadBehind && aheadBehind.ahead > 0 ? 'green' : undefined}>{aheadText}</Text>
      </Box>

      <Box flexDirection="column">
        <Text dimColor>Command:</Text>
        <Text color="cyan">{commandString}</Text>
      </Box>

      <Menu
        items={menuOptions}
        onSelect={item => {
          if (item.value === 'push') {
            void handleExecutePush();
          } else if (item.value === 'selectRemote') {
            setView('selectRemote');
          } else {
            onBack();
          }
        }}
        onCancel={onBack}
      />
    </Box>
  );
}
