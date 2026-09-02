import React from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from '../../theme/colors.js';

interface OverlayDialogProps {
  title: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function OverlayDialog({
  title,
  message,
  detail,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: OverlayDialogProps): React.ReactElement {
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  useInput((input, key) => {
    if (key.escape || input === 'q' || input === 'Q') {
      onCancel();
    } else if (key.leftArrow || key.rightArrow || input === '\t') {
      setSelectedIndex(prev => (prev === 0 ? 1 : 0));
    } else if (key.return) {
      if (selectedIndex === 0) onConfirm();
      else onCancel();
    }
  });

  return (
    <Box flexDirection="column" alignItems="center" marginTop={2}>
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={colors.coral}
        paddingX={2}
        paddingY={1}
        width={46}
      >
        <Box justifyContent="center" marginBottom={1}>
          <Text color={colors.coral} bold>
            {title}
          </Text>
        </Box>

        <Text>{message}</Text>
        {detail != null && <Text dimColor>{detail}</Text>}

        <Box marginTop={1} justifyContent="center" gap={2} flexDirection="row">
          <Text
            color={selectedIndex === 0 ? colors.bgDark : colors.white}
            backgroundColor={selectedIndex === 0 ? colors.pink : undefined}
            bold={selectedIndex === 0}
          >
            {' '}
            {confirmLabel}{' '}
          </Text>
          <Text> </Text>
          <Text
            color={selectedIndex === 1 ? colors.bgDark : colors.white}
            backgroundColor={selectedIndex === 1 ? colors.grey : undefined}
            bold={selectedIndex === 1}
          >
            {' '}
            {cancelLabel}{' '}
          </Text>
        </Box>

        <Box marginTop={1} justifyContent="center">
          <Text color={colors.grey}>← → select · Enter confirm · Esc cancel</Text>
        </Box>
      </Box>
    </Box>
  );
}
