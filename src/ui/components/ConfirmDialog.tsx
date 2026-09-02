import React from 'react';
import { Box, Text } from 'ink';
import { Menu } from './Menu.js';
import { colors } from '../theme/colors.js';
import type { MenuItem } from './Menu.js';

interface ConfirmDialogProps {
  message: string;
  detail?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isFocused?: boolean;
}

const CONFIRM_ITEMS: ReadonlyArray<MenuItem> = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
];

export function ConfirmDialog({
  message,
  detail,
  onConfirm,
  onCancel,
  isFocused = true,
}: ConfirmDialogProps): React.ReactElement {
  const handleSelect = (item: MenuItem): void => {
    if (item.value === 'yes') {
      onConfirm();
    } else {
      onCancel();
    }
  };

  return (
    <Box
      flexDirection="column"
      gap={1}
      borderStyle="round"
      borderColor={colors.coral}
      paddingX={2}
      paddingY={1}
      width={52}
    >
      <Text color={colors.coral} bold>
        {message}
      </Text>
      {detail != null && <Text dimColor>{detail}</Text>}
      <Menu
        items={CONFIRM_ITEMS}
        onSelect={handleSelect}
        onCancel={onCancel}
        isFocused={isFocused}
      />
    </Box>
  );
}
