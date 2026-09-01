import React from 'react';
import { Box, Text } from 'ink';

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
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="red"
      paddingX={2}
      paddingY={1}
      gap={1}
    >
      <Text color="red" bold>
        ✗ {title}
      </Text>
      <Text>{message}</Text>
      {hint != null && (
        <Box flexDirection="column" marginTop={1}>
          <Text dimColor>{hint}</Text>
        </Box>
      )}
    </Box>
  );
}
