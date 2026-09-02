import React from 'react';
import { Box, Text } from 'ink';
import { Panel } from './layout/Panel.js';
import { colors } from '../theme/colors.js';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  hint?: string;
}

export function ErrorDisplay({
  title = 'Error',
  message,
  hint,
}: ErrorDisplayProps): React.ReactElement {
  return (
    <Panel title={title} borderColor={colors.red}>
      <Box flexDirection="column" gap={1}>
        <Text color={colors.red}>✗ {message}</Text>
        {hint != null && (
          <Box flexDirection="column" marginTop={1}>
            <Text color={colors.grey}>{hint}</Text>
          </Box>
        )}
      </Box>
    </Panel>
  );
}
