import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

export interface MenuItem {
  readonly label: string;
  readonly value: string;
  readonly disabled?: boolean;
  readonly warning?: string;
}

interface MenuProps {
  items: ReadonlyArray<MenuItem>;
  onSelect: (item: MenuItem) => void;
  onCancel?: () => void;
  isFocused?: boolean;
}

export function Menu({
  items,
  onSelect,
  onCancel,
  isFocused = true,
}: MenuProps): React.ReactElement {
  const enabledIndices = items.reduce<number[]>((acc, item, index) => {
    if (item.disabled !== true) acc.push(index);
    return acc;
  }, []);

  const firstEnabled = enabledIndices[0] ?? 0;
  const [selectedIndex, setSelectedIndex] = useState<number>(firstEnabled);

  useInput(
    (_input, key) => {
      if (
        key.escape ||
        _input === 'q' ||
        _input === 'Q' ||
        _input === '\u001b' ||
        _input === '\x1b' ||
        (_input != null && _input.charCodeAt(0) === 27)
      ) {
        if (onCancel) {
          onCancel();
          return;
        }
      }

      if (key.upArrow) {
        setSelectedIndex(prev => {
          const pos = enabledIndices.indexOf(prev);
          const nextPos = pos <= 0 ? enabledIndices.length - 1 : pos - 1;
          return enabledIndices[nextPos] ?? prev;
        });
      }

      if (key.downArrow) {
        setSelectedIndex(prev => {
          const pos = enabledIndices.indexOf(prev);
          const nextPos = pos >= enabledIndices.length - 1 ? 0 : pos + 1;
          return enabledIndices[nextPos] ?? prev;
        });
      }

      if (key.return) {
        const item = items[selectedIndex];
        if (item != null && item.disabled !== true) {
          onSelect(item);
        }
      }
    },
    { isActive: isFocused },
  );

  return (
    <Box flexDirection="column">
      {items.map((item, index) => {
        const isSelected = index === selectedIndex;
        const isDisabled = item.disabled === true;

        return (
          <Box key={item.value} flexDirection="column">
            <Text
              color={isDisabled ? 'gray' : isSelected ? 'white' : undefined}
              bold={isSelected && !isDisabled}
              dimColor={isDisabled}
            >
              {isSelected && !isDisabled ? '❯ ' : '  '}
              {item.label}
            </Text>
            {isSelected && item.warning != null && <Text color="yellow"> ⚠ {item.warning}</Text>}
          </Box>
        );
      })}
    </Box>
  );
}
