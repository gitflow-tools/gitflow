import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../../theme/colors.js';

interface CommandPreviewBarProps {
  command: string;
}

export function CommandPreviewBar({ command }: CommandPreviewBarProps): React.ReactElement {
  return (
    <Box flexDirection="row" paddingX={1} width="100%" flexShrink={0}>
      <Text color={colors.grey}>$ </Text>
      <Text color={colors.orange}>{command}</Text>
    </Box>
  );
}
