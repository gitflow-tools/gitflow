import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { validateRepositoryName } from '../../../setup/validation.js';

interface RepositoryDetailsStepProps {
  initialRepoName: string;
  isAlreadyRepo: boolean;
  onNext: (repoName: string) => void;
  onBack: () => void;
}

export function RepositoryDetailsStep({
  initialRepoName,
  isAlreadyRepo,
  onNext,
  onBack,
}: RepositoryDetailsStepProps): React.ReactElement {
  const [repoName, setRepoName] = useState(initialRepoName);
  const [error, setError] = useState<string | null>(null);

  useInput((_input, key) => {
    if (key.escape) {
      onBack();
    }
  });

  const handleSubmit = (value: string): void => {
    const trimmed = value.trim();
    const validation = validateRepositoryName(trimmed);
    if (!validation.valid) {
      setError(validation.error || 'Invalid repository name');
      return;
    }
    onNext(trimmed);
  };

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">
        Step 2/7 — Repository Details
      </Text>

      {isAlreadyRepo && (
        <Text color="yellow">
          ⚠ This directory already contains a Git repository. Proceeding will reinitialise it.
        </Text>
      )}

      <Box flexDirection="column" gap={1}>
        <Text dimColor>Repository name:</Text>
        <TextInput
          value={repoName}
          onChange={val => {
            setRepoName(val);
            setError(null);
          }}
          onSubmit={handleSubmit}
          placeholder="my-project"
        />
        {error && <Text color="red">✗ {error}</Text>}
        <Text dimColor>Press Enter to confirm · Escape to go back</Text>
      </Box>
    </Box>
  );
}
