import React from 'react';
import { Text } from 'ink';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'muted';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: string;
}

const VARIANT_COLORS: Record<BadgeVariant, string> = {
  success: 'green',
  warning: 'yellow',
  error: 'red',
  info: 'cyan',
  muted: 'gray',
};

export function StatusBadge({
  label,
  variant = 'info',
  icon,
}: StatusBadgeProps): React.ReactElement {
  return <Text color={VARIANT_COLORS[variant]}>{icon != null ? `${icon} ${label}` : label}</Text>;
}
