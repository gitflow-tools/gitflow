import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';

interface CommandPanelProps {
  command: string;
  label?: string;
}

export function CommandPanel({
  command,
  label = 'command',
}: CommandPanelProps): React.ReactElement {
  return (
    <Box
      flexDirection="row"
      borderStyle="round"
      borderColor={colors.border}
      paddingX={1}
      paddingY={0}
      alignSelf="flex-start"
    >
      <Text color={colors.grey}>{label}: </Text>
      <Text color={colors.orange}>$ {command}</Text>
    </Box>
  );
}
