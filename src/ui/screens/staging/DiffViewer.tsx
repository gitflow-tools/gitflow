import React from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from '../../theme/colors.js';

interface DiffViewerProps {
  filePath: string;
  category: string;
  diff: string;
  truncated: boolean;
  isUntracked: boolean;
  totalLines?: number;
  onBack: () => void;
}

export function DiffViewer({
  filePath,
  category,
  diff,
  truncated,
  isUntracked,
  totalLines,
  onBack,
}: DiffViewerProps): React.ReactElement {
  useInput((input, key) => {
    if (
      key.escape ||
      input === 'q' ||
      input === 'Q' ||
      input === '\u001b' ||
      input === '\x1b' ||
      (input != null && input.charCodeAt(0) === 27) ||
      key.return ||
      key.backspace ||
      input === ' '
    ) {
      onBack();
    }
  });

  const lines = diff ? diff.split('\n') : [];

  return (
    <Box flexDirection="column" gap={1}>
      <Box flexDirection="row">
        <Text color={colors.pink} bold>
          {filePath}
        </Text>
        <Text color={colors.grey}> ({category})</Text>
      </Box>

      <Box flexDirection="row">
        <Text color={colors.grey}>{'─'.repeat(48)}</Text>
      </Box>

      {isUntracked ? (
        <Box flexDirection="column" marginY={1}>
          <Text color={colors.yellow}>
            This file is currently untracked and has not been added to Git.
          </Text>
          <Text color={colors.grey}>Stage this file to start tracking its changes.</Text>
        </Box>
      ) : lines.length === 0 ? (
        <Box marginY={1}>
          <Text color={colors.grey}>No changes detected or binary file.</Text>
        </Box>
      ) : (
        <Box flexDirection="column" overflow="hidden">
          {lines.map((line, idx) => {
            let color: string | undefined;
            if (line.startsWith('+') && !line.startsWith('+++')) color = colors.green;
            else if (line.startsWith('-') && !line.startsWith('---')) color = colors.red;
            else if (line.startsWith('@@')) color = colors.pink;
            else if (line.startsWith('diff ') || line.startsWith('index ')) color = colors.grey;
            return (
              <Text key={idx} color={color}>
                {line}
              </Text>
            );
          })}
        </Box>
      )}

      {truncated && (
        <Box marginY={1}>
          <Text color={colors.yellow}>
            ⚠ Diff truncated ({lines.length} of {totalLines} lines shown).
          </Text>
        </Box>
      )}

      <Box flexDirection="row">
        <Text color={colors.grey}>{'─'.repeat(48)}</Text>
      </Box>

      <Text color={colors.grey}>Press Escape, Enter, or Q to return</Text>
    </Box>
  );
}
