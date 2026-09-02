import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { Menu } from '../../components/Menu.js';
import type { MenuItem } from '../../components/Menu.js';
import { colors } from '../../theme/colors.js';
import { validateCommitMessage } from '../../../setup/validation.js';

export interface CommitStepData {
  createInitialCommit: boolean;
  commitMessage?: string;
}

interface CommitStepProps {
  initialData?: CommitStepData;
  onNext: (data: CommitStepData) => void;
  onBack: () => void;
}

type CommitPhase = 'choice' | 'message';

export function CommitStep({ initialData, onNext, onBack }: CommitStepProps): React.ReactElement {
  const [phase, setPhase] = useState<CommitPhase>(
    initialData?.createInitialCommit && initialData.commitMessage ? 'message' : 'choice',
  );
  const [commitMessage, setCommitMessage] = useState(
    initialData?.commitMessage ?? 'Initial commit',
  );
  const [error, setError] = useState<string | null>(null);

  useInput((_input, key) => {
    if (key.escape) {
      if (phase === 'message') {
        setPhase('choice');
        setError(null);
      } else {
        onBack();
      }
    }
  });

  const handleChoiceSelect = (item: MenuItem): void => {
    if (item.value === 'no') {
      onNext({ createInitialCommit: false });
    } else {
      setPhase('message');
    }
  };

  const handleMessageSubmit = (value: string): void => {
    const trimmed = value.trim();
    const validation = validateCommitMessage(trimmed);
    if (!validation.valid) {
      setError(validation.error || 'Commit message cannot be empty');
      return;
    }
    onNext({ createInitialCommit: true, commitMessage: trimmed });
  };

  return (
    <Box flexDirection="column" gap={1}>
      <Text color={colors.pink} bold>
        Step 5/7 — Initial Commit
      </Text>

      {phase === 'choice' && (
        <Box flexDirection="column" gap={1}>
          <Text dimColor>Create an initial commit?</Text>
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

      {phase === 'message' && (
        <Box flexDirection="column" gap={1}>
          <Text dimColor>Commit message:</Text>
          <TextInput
            value={commitMessage}
            onChange={val => {
              setCommitMessage(val);
              setError(null);
            }}
            onSubmit={handleMessageSubmit}
            placeholder="Initial commit"
          />
          {error && <Text color="red">✗ {error}</Text>}
          <Text dimColor>Press Enter to confirm · Escape to go back</Text>
        </Box>
      )}
    </Box>
  );
}
