import React from 'react';
import { Text } from 'ink';
import { colors } from '../theme/colors.js';

type BadgeVariant =
  'success' | 'warning' | 'error' | 'info' | 'muted' | 'pink' | 'coral' | 'orange';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: string;
}

const VARIANT_COLORS: Record<BadgeVariant, string> = {
  success: colors.green,
  warning: colors.yellow,
  error: colors.red,
  info: colors.orange,
  muted: colors.grey,
  pink: colors.pink,
  coral: colors.coral,
  orange: colors.orange,
};

export function StatusBadge({
  label,
  variant = 'info',
  icon,
}: StatusBadgeProps): React.ReactElement {
  return (
    <Text color={VARIANT_COLORS[variant]} bold={false}>
      {icon != null ? `${icon} ${label}` : label}
    </Text>
  );
}
