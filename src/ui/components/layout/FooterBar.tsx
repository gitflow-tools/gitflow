import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../../theme/colors.js';

interface Shortcut {
  readonly key: string;
  readonly label: string;
}

interface FooterBarProps {
  shortcuts: ReadonlyArray<Shortcut>;
}

export function FooterBar({ shortcuts }: FooterBarProps): React.ReactElement {
  return (
    <Box flexDirection="row" paddingX={1} width="100%" flexShrink={0}>
      <Text color={colors.grey}>
        {shortcuts.map((s, i) => (
          <Text key={s.key}>
            {i > 0 && <Text> </Text>}
            <Text color={colors.pink}>{s.key}</Text>
            <Text> {s.label}</Text>
          </Text>
        ))}
      </Text>
    </Box>
  );
}
