import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import type { ExecutionLogEntry } from '../../setup/executor.js';

interface ProgressIndicatorProps {
  logs: ExecutionLogEntry[];
}

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export function ProgressIndicator({ logs }: ProgressIndicatorProps): React.ReactElement {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame(prev => (prev + 1) % SPINNER_FRAMES.length);
    }, 80);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box flexDirection="column" gap={0}>
      {logs.map((log, index) => {
        let prefix = '  ';
        let color: string | undefined;

        if (log.status === 'success') {
          prefix = '✓ ';
          color = 'green';
        } else if (log.status === 'failed') {
          prefix = '✗ ';
          color = 'red';
        } else if (log.status === 'pending') {
          prefix = `${SPINNER_FRAMES[frame]} `;
          color = 'cyan';
        }

        // Clean message if it already starts with checkmark or cross
        let displayMessage = log.message;
        if (displayMessage.startsWith('✓ ') || displayMessage.startsWith('✗ ')) {
          displayMessage = displayMessage.slice(2);
        }

        return (
          <Box key={index}>
            <Text color={color} bold={log.status === 'pending' || log.status === 'failed'}>
              {prefix}
              {displayMessage}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
