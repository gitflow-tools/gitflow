import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from '../theme/colors.js';

export interface MenuItem {
  readonly label: string;
  readonly value: string;
  readonly disabled?: boolean;
  readonly warning?: string;
  readonly detail?: string;
}

interface MenuProps {
  items: ReadonlyArray<MenuItem>;
  onSelect: (item: MenuItem) => void;
  onCancel?: () => void;
  isFocused?: boolean;
  hideSelectedIcon?: boolean;
}

export function Menu({
  items,
  onSelect,
  onCancel,
  isFocused = true,
  hideSelectedIcon = false,
}: MenuProps): React.ReactElement {
  const enabledIndices = items.reduce<number[]>((acc, item, index) => {
    if (item.disabled !== true) acc.push(index);
    return acc;
  }, []);

  const firstEnabled = enabledIndices[0] ?? 0;
  const [selectedIndex, setSelectedIndex] = useState<number>(firstEnabled);

  useInput(
    (input, key) => {
      if (
        onCancel &&
        (key.escape ||
          input === 'q' ||
          input === 'Q' ||
          input === '\u001b' ||
          input === '\x1b' ||
          (input != null && input.charCodeAt(0) === 27))
      ) {
        onCancel();
        return;
      }

      if (key.upArrow || input === 'k' || input === 'K') {
        setSelectedIndex(prev => {
          const pos = enabledIndices.indexOf(prev);
          const nextPos = pos <= 0 ? enabledIndices.length - 1 : pos - 1;
          return enabledIndices[nextPos] ?? prev;
        });
      } else if (key.downArrow || input === 'j' || input === 'J') {
        setSelectedIndex(prev => {
          const pos = enabledIndices.indexOf(prev);
          const nextPos = pos >= enabledIndices.length - 1 ? 0 : pos + 1;
          return enabledIndices[nextPos] ?? prev;
        });
      } else if (key.return) {
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
            <Box flexDirection="row" paddingX={1}>
              <Text>
                {hideSelectedIcon ? (
                  <Text> </Text>
                ) : isSelected && !isDisabled ? (
                  <Text color={colors.pink} bold>
                    ❯{' '}
                  </Text>
                ) : (
                  <Text> </Text>
                )}
                <Text
                  color={isDisabled ? colors.grey : isSelected ? colors.white : colors.lightGrey}
                  bold={isSelected && !isDisabled}
                  dimColor={isDisabled}
                >
                  {item.label}
                </Text>
              </Text>
            </Box>
            {item.detail != null && !isSelected && (
              <Box paddingX={3}>
                <Text color={colors.grey}>{item.detail}</Text>
              </Box>
            )}
            {isSelected && item.warning != null && (
              <Box paddingX={3}>
                <Text color={colors.yellow}>⚠ {item.warning}</Text>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
