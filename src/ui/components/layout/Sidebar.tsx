import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../../theme/colors.js';

export interface NavItem {
  readonly label: string;
  readonly value: string;
  readonly disabled?: boolean;
  readonly badge?: string;
  readonly badgeColor?: string;
}

interface SidebarProps {
  items: ReadonlyArray<NavItem>;
  selectedIndex: number;
  activeIndex?: number;
  width: number;
}

export function Sidebar({ items, selectedIndex, activeIndex, width }: SidebarProps): React.ReactElement {
  const highlightIndex = activeIndex ?? selectedIndex;
  return (
    <Box width={width} flexDirection="column" flexShrink={0} height="100%">
      {items.map((item, index) => {
        const isSelected = index === highlightIndex;
        const isDisabled = item.disabled === true;

        return (
          <Box key={item.value} flexDirection="row" paddingX={1}>
            <Text>
              <Text>  </Text>
              <Text
                color={
                  isDisabled ? colors.darkGrey : isSelected ? colors.white : colors.lightGrey
                }
                bold={isSelected && !isDisabled}
                dimColor={isDisabled}
              >
                {item.label}
              </Text>
              {item.badge != null && (
                <Text color={item.badgeColor ?? colors.grey}> {item.badge}</Text>
              )}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
