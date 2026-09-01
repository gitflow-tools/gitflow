import React from 'react';
import { Box, Text, useInput } from 'ink';

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
      key.delete ||
      input === ' '
    ) {
      onBack();
    }
  });

  const lines = diff ? diff.split('\n') : [];

  return (
    <Box flexDirection="column" gap={1}>
      <Box flexDirection="column">
        <Text bold color="cyan">
          {filePath}
        </Text>
        <Text dimColor>Status: {category}</Text>
      </Box>

      <Text dimColor>────────────────────────────────────────────</Text>

      {isUntracked ? (
        <Box flexDirection="column" marginY={1}>
          <Text color="yellow">
            This file is currently untracked and has not been added to Git.
          </Text>
          <Text dimColor>Stage this file to start tracking its changes.</Text>
        </Box>
      ) : lines.length === 0 ? (
        <Box marginY={1}>
          <Text dimColor>No changes detected or binary file.</Text>
        </Box>
      ) : (
        <Box flexDirection="column">
          {lines.map((line, idx) => {
            let color: string | undefined;
            if (line.startsWith('+') && !line.startsWith('+++')) {
              color = 'green';
            } else if (line.startsWith('-') && !line.startsWith('---')) {
              color = 'red';
            } else if (line.startsWith('@@')) {
              color = 'cyan';
            } else if (line.startsWith('diff ') || line.startsWith('index ')) {
              color = 'gray';
            }

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
          <Text color="yellow">
            ⚠ Diff truncated ({lines.length} of {totalLines} lines shown).
          </Text>
        </Box>
      )}

      <Text dimColor>────────────────────────────────────────────</Text>

      <Box>
        <Text dimColor>Press Escape, Enter, or Q to return</Text>
      </Box>
    </Box>
  );
}
