import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import type { FileChange } from '../../../git/types.js';

interface FileSelectorProps {
  title: string;
  files: ReadonlyArray<FileChange>;
  onSubmit: (selectedPaths: string[]) => void;
  onCancel: () => void;
  isFocused?: boolean;
}

export function FileSelector({
  title,
  files,
  onSubmit,
  onCancel,
  isFocused = true,
}: FileSelectorProps): React.ReactElement {
  const [cursorIndex, setCursorIndex] = useState(0);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(() => new Set());

  useInput(
    (input, key) => {
      if (
        key.escape ||
        input === 'q' ||
        input === 'Q' ||
        input === '\u001b' ||
        input === '\x1b' ||
        (input != null && input.charCodeAt(0) === 27)
      ) {
        onCancel();
        return;
      }

      if (key.upArrow) {
        setCursorIndex(prev => (prev > 0 ? prev - 1 : files.length - 1));
        return;
      }

      if (key.downArrow) {
        setCursorIndex(prev => (prev < files.length - 1 ? prev + 1 : 0));
        return;
      }

      if (input === ' ') {
        const current = files[cursorIndex];
        if (current) {
          setSelectedPaths(prev => {
            const next = new Set(prev);
            if (next.has(current.path)) {
              next.delete(current.path);
            } else {
              next.add(current.path);
            }
            return next;
          });
        }
        return;
      }

      if (input === 'a' || input === 'A') {
        setSelectedPaths(prev => {
          if (prev.size === files.length) {
            return new Set();
          }
          return new Set(files.map(f => f.path));
        });
        return;
      }

      if (key.return) {
        onSubmit(Array.from(selectedPaths));
      }
    },
    { isActive: isFocused },
  );

  if (files.length === 0) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="cyan">
          {title}
        </Text>
        <Text dimColor>No files available.</Text>
        <Box marginTop={1}>
          <Text dimColor>Press Escape to return</Text>
        </Box>
      </Box>
    );
  }

  const getStatusColor = (category: string): string => {
    switch (category) {
      case 'staged':
        return 'green';
      case 'modified':
        return 'yellow';
      case 'untracked':
        return 'magenta';
      case 'deleted':
        return 'red';
      case 'renamed':
        return 'cyan';
      default:
        return 'white';
    }
  };

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">
        {title}
      </Text>

      <Box flexDirection="column">
        {files.map((file, index) => {
          const isCursor = index === cursorIndex;
          const isChecked = selectedPaths.has(file.path);
          const statusColor = getStatusColor(file.category);

          return (
            <Box key={file.path}>
              <Text color={isCursor ? 'cyan' : undefined} bold={isCursor}>
                {isCursor ? '❯ ' : '  '}
              </Text>
              <Text color={isChecked ? 'green' : 'gray'}>{isChecked ? '[x] ' : '[ ] '}</Text>
              <Text color={statusColor}>{file.category.padEnd(9)}</Text>
              <Text bold={isCursor}>{file.path}</Text>
            </Box>
          );
        })}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text dimColor>
          Selected: {selectedPaths.size} of {files.length} files
        </Text>
        <Text dimColor>Space Toggle · A Toggle All · Enter Continue · Esc Cancel</Text>
      </Box>
    </Box>
  );
}
