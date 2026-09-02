import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  right?: string;
}

export function ScreenHeader({ title, subtitle, right }: ScreenHeaderProps): React.ReactElement {
  return (
    <Box flexDirection="row" marginBottom={1} width="100%">
      <Text>
        <Text color={colors.pink} bold>
          {title}
        </Text>
        {subtitle != null && <Text color={colors.grey}> — {subtitle}</Text>}
      </Text>
      <Box flexGrow={1} />
      {right != null && <Text color={colors.grey}>{right}</Text>}
    </Box>
  );
}

interface HintProps {
  text: string;
}

export function Hint({ text }: HintProps): React.ReactElement {
  return <Text color={colors.grey}>{text}</Text>;
}
