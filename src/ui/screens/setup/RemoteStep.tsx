import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { Menu } from '../../components/Menu.js';
import type { MenuItem } from '../../components/Menu.js';
import { validateRemoteName, validateRemoteUrl } from '../../../setup/validation.js';
import type { RemoteConfig } from '../../../git/remote.js';

export interface RemoteStepData {
  addRemote: boolean;
  remote?: RemoteConfig;
  pushAfterSetup: boolean;
}

interface RemoteStepProps {
  initialData?: RemoteStepData;
  onNext: (data: RemoteStepData) => void;
  onBack: () => void;
}

type RemotePhase = 'choice' | 'name' | 'url' | 'pushChoice';

export function RemoteStep({ initialData, onNext, onBack }: RemoteStepProps): React.ReactElement {
  const [phase, setPhase] = useState<RemotePhase>(
    initialData?.addRemote && initialData.remote ? 'pushChoice' : 'choice',
  );
  const [remoteName, setRemoteName] = useState(initialData?.remote?.name ?? 'origin');
  const [remoteUrl, setRemoteUrl] = useState(initialData?.remote?.url ?? '');
  const [error, setError] = useState<string | null>(null);

  useInput((_input, key) => {
    if (key.escape) {
      if (phase === 'pushChoice') {
        setPhase('url');
        setError(null);
      } else if (phase === 'url') {
        setPhase('name');
        setError(null);
      } else if (phase === 'name') {
        setPhase('choice');
        setError(null);
      } else {
        onBack();
      }
    }
  });

  const handleChoiceSelect = (item: MenuItem): void => {
    if (item.value === 'no') {
      onNext({ addRemote: false, pushAfterSetup: false });
    } else {
      setPhase('name');
    }
  };

  const handleNameSubmit = (value: string): void => {
    const trimmed = value.trim();
    const validation = validateRemoteName(trimmed);
    if (!validation.valid) {
      setError(validation.error || 'Invalid remote name');
      return;
    }
    setRemoteName(trimmed);
    setPhase('url');
  };

  const handleUrlSubmit = (value: string): void => {
    const trimmed = value.trim();
    const validation = validateRemoteUrl(trimmed);
    if (!validation.valid) {
      setError(validation.error || 'Invalid remote URL');
      return;
    }
    setRemoteUrl(trimmed);
    setPhase('pushChoice');
  };

  const handlePushSelect = (item: MenuItem): void => {
    const pushAfterSetup = item.value === 'yes';
    onNext({
      addRemote: true,
      remote: { name: remoteName, url: remoteUrl },
      pushAfterSetup,
    });
  };

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">
        Step 6/7 — Remote Repository
      </Text>

      {phase === 'choice' && (
        <Box flexDirection="column" gap={1}>
          <Text dimColor>Would you like to add a remote?</Text>
          <Menu
            items={[
              { label: 'Yes', value: 'yes' },
              { label: 'No', value: 'no' },
            ]}
            onSelect={handleChoiceSelect}
          />
          <Text dimColor>Press Escape to go back</Text>
        </Box>
      )}

      {phase === 'name' && (
        <Box flexDirection="column" gap={1}>
          <Text dimColor>Remote name:</Text>
          <TextInput
            value={remoteName}
            onChange={val => {
              setRemoteName(val);
              setError(null);
            }}
            onSubmit={handleNameSubmit}
            placeholder="origin"
          />
          {error && <Text color="red">✗ {error}</Text>}
          <Text dimColor>Press Enter to confirm · Escape to go back</Text>
        </Box>
      )}

      {phase === 'url' && (
        <Box flexDirection="column" gap={1}>
          <Text dimColor>Remote URL:</Text>
          <TextInput
            value={remoteUrl}
            onChange={val => {
              setRemoteUrl(val);
              setError(null);
            }}
            onSubmit={handleUrlSubmit}
            placeholder="https://github.com/username/my-project.git"
          />
          {error && <Text color="red">✗ {error}</Text>}
          <Text dimColor>Press Enter to confirm · Escape to go back</Text>
        </Box>
      )}

      {phase === 'pushChoice' && (
        <Box flexDirection="column" gap={1}>
          <Text dimColor>Push after setup?</Text>
          <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1}>
            <Text dimColor>
              Note: Pushing requires the remote repository to already exist and be accessible with
              your credentials.
            </Text>
          </Box>
          <Menu
            items={[
              { label: 'No', value: 'no' },
              { label: 'Yes', value: 'yes' },
            ]}
            onSelect={handlePushSelect}
          />
          <Text dimColor>Press Escape to go back</Text>
        </Box>
      )}
    </Box>
  );
}
