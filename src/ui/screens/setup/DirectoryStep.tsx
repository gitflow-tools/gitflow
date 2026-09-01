import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { Menu } from '../../components/Menu.js';
import type { MenuItem } from '../../components/Menu.js';
import { homeDirRelative } from '../../../utils/paths.js';
import { validateDirectory } from '../../../setup/validation.js';
import { isGitRepository } from '../../../git/client.js';

interface DirectoryStepProps {
  initialDirectory: string;
  onNext: (directory: string, isRepo: boolean) => void;
  onCancel: () => void;
}

type DirectoryMode = 'choice' | 'custom';

export function DirectoryStep({
  initialDirectory,
  onNext,
  onCancel,
}: DirectoryStepProps): React.ReactElement {
  const [mode, setMode] = useState<DirectoryMode>('choice');
  const [customPath, setCustomPath] = useState(initialDirectory);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useInput(
    (_input, key) => {
      if (key.escape) {
        if (mode === 'custom') {
          setMode('choice');
          setError(null);
        } else {
          onCancel();
        }
      }
    },
    { isActive: !isValidating },
  );

  const handleDirectoryChosen = async (dir: string): Promise<void> => {
    setIsValidating(true);
    setError(null);
    try {
      const validation = await validateDirectory(dir);
      if (!validation.valid || !validation.resolvedPath) {
        setError(validation.error || 'Invalid directory path');
        setIsValidating(false);
        return;
      }

      const resolved = validation.resolvedPath;
      const isRepo = await isGitRepository(resolved);
      setIsValidating(false);
      onNext(resolved, isRepo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error validating directory');
      setIsValidating(false);
    }
  };

  const handleChoiceSelect = (item: MenuItem): void => {
    if (item.value === 'current') {
      void handleDirectoryChosen(initialDirectory);
    } else if (item.value === 'custom') {
      setMode('custom');
    }
  };

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">
        Step 1/7 — Select Directory
      </Text>

      <Box flexDirection="column">
        <Text dimColor>Current directory:</Text>
        <Text>{homeDirRelative(initialDirectory)}</Text>
      </Box>

      {mode === 'choice' && (
        <Box flexDirection="column" gap={1}>
          <Text dimColor>Where would you like to initialise the repository?</Text>
          <Menu
            items={[
              { label: 'Use current directory', value: 'current' },
              { label: 'Enter custom path', value: 'custom' },
            ]}
            onSelect={handleChoiceSelect}
          />
          {error && <Text color="red">✗ {error}</Text>}
          <Text dimColor>Press Escape to cancel</Text>
        </Box>
      )}

      {mode === 'custom' && (
        <Box flexDirection="column" gap={1}>
          <Text dimColor>Enter directory path:</Text>
          <TextInput
            value={customPath}
            onChange={val => {
              setCustomPath(val);
              setError(null);
            }}
            onSubmit={val => {
              void handleDirectoryChosen(val);
            }}
            placeholder="~/Projects/my-project"
          />
          {error && <Text color="red">✗ {error}</Text>}
          <Text dimColor>Press Enter to confirm · Escape to go back</Text>
        </Box>
      )}
    </Box>
  );
}
