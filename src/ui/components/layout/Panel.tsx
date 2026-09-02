import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../../theme/colors.js';

interface PanelProps {
  title?: string;
  titleRight?: string;
  children: React.ReactNode;
  width?: number | string;
  height?: number | string;
  flexGrow?: number;
  borderStyle?: 'round' | 'single';
  borderColor?: string;
  paddingX?: number;
  paddingY?: number;
  overflow?: 'hidden' | 'visible';
}

export function Panel({
  title,
  titleRight,
  children,
  width,
  height,
  flexGrow,
  borderStyle = 'round',
  borderColor = colors.border,
  paddingX = 1,
  paddingY = 1,
  overflow = 'hidden',
}: PanelProps): React.ReactElement {
  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      flexGrow={flexGrow}
      flexShrink={0}
      overflow={overflow}
    >
      <Box
        flexDirection="column"
        borderStyle={borderStyle}
        borderColor={borderColor}
        paddingX={paddingX}
        paddingY={paddingY}
        width="100%"
        height="100%"
        flexGrow={1}
        overflow={overflow}
      >
        {(title != null || titleRight != null) && (
          <Box flexDirection="row" marginBottom={1}>
            <Text color={colors.pink} bold>
              {title ?? ''}
            </Text>
            <Box flexGrow={1} />
            {titleRight != null && <Text color={colors.grey}>{titleRight}</Text>}
          </Box>
        )}
        <Box flexDirection="column" flexGrow={1} overflow={overflow}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
