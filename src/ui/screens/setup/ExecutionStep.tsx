import React, { useEffect, useRef, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ProgressIndicator } from '../../components/ProgressIndicator.js';
import { Menu } from '../../components/Menu.js';
import { colors } from '../../theme/colors.js';
import { homeDirRelative } from '../../../utils/paths.js';
import { executeSetupPlan, type ExecutionLogEntry } from '../../../setup/executor.js';
import type { SetupPlan } from '../../../setup/types.js';

interface ExecutionStepProps {
  plan: SetupPlan;
  onComplete: () => void;
  onCancel: () => void;
}

type ExecutionPhase = 'executing' | 'success' | 'failed';

export function ExecutionStep({
  plan,
  onComplete,
  onCancel,
}: ExecutionStepProps): React.ReactElement {
  const [phase, setPhase] = useState<ExecutionPhase>('executing');
  const [logs, setLogs] = useState<ExecutionLogEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const executionStarted = useRef(false);

  useInput(
    (_input, key) => {
      if (phase === 'success') {
        if (key.return || key.escape) {
          onComplete();
        }
      }
    },
    { isActive: phase === 'success' },
  );

  useEffect(() => {
    if (executionStarted.current) return;
    executionStarted.current = true;

    void executeSetupPlan(plan, (_entry, allLogs) => {
      setLogs([...allLogs]);
    }).then(result => {
      if (result.success) {
        setPhase('success');
      } else {
        setPhase('failed');
        setErrorMessage(result.error || 'An unexpected error occurred');
      }
    });
  }, [plan]);

  const isIdentityError =
    errorMessage != null &&
    (errorMessage.includes('git config --global') ||
      errorMessage.includes('user.name') ||
      errorMessage.includes('user.email'));

  return (
    <Box flexDirection="column" gap={1}>
      {phase === 'executing' && (
        <Box flexDirection="column" gap={1}>
          <Text color={colors.pink} bold>
            Setting up repository...
          </Text>
          <ProgressIndicator logs={logs} />
        </Box>
      )}

      {phase === 'success' && (
        <Box flexDirection="column" gap={1}>
          <Text color={colors.green} bold>
            ✓ Repository setup complete!
          </Text>

          <Box flexDirection="column">
            <Text dimColor>Created in:</Text>
            <Text>{homeDirRelative(plan.directory)}</Text>
          </Box>

          <ProgressIndicator logs={logs} />

          <Box marginTop={1}>
            <Text dimColor>Press Enter or Escape to return to the main menu</Text>
          </Box>
        </Box>
      )}

      {phase === 'failed' && (
        <Box flexDirection="column" gap={1}>
          <Text color={colors.red} bold>
            ✗ Repository setup failed.
          </Text>

          <ProgressIndicator logs={logs} />

          {isIdentityError ? (
            <Box
              flexDirection="column"
              borderStyle="round"
              borderColor="yellow"
              paddingX={2}
              paddingY={1}
            >
              <Text bold color="yellow">
                Git identity not configured
              </Text>
              <Text>{errorMessage}</Text>
            </Box>
          ) : (
            <Box
              flexDirection="column"
              borderStyle="round"
              borderColor="red"
              paddingX={2}
              paddingY={1}
            >
              <Text color="red">{errorMessage}</Text>
            </Box>
          )}

          <Menu
            items={[
              { label: 'Cancel', value: 'cancel' },
            ]}
            onSelect={item => {
              if (item.value === 'cancel') {
                onCancel();
              }
            }}
          />
        </Box>
      )}
    </Box>
  );
}
