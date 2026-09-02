import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export function Section({ title, children }: SectionProps): React.ReactElement {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box flexDirection="row">
        <Text color={colors.pink} bold>
          {title}
        </Text>
      </Box>
      <Box flexDirection="column" marginLeft={2}>
        {children}
      </Box>
    </Box>
  );
}

interface InfoRowProps {
  label: string;
  children: React.ReactNode;
}

export function InfoRow({ label, children }: InfoRowProps): React.ReactElement {
  return (
    <Box flexDirection="row">
      <Text color={colors.grey}>{label}: </Text>
      <Text>{children}</Text>
    </Box>
  );
}
