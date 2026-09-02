import React from 'react';
import { Box, Text, useInput } from 'ink';
import { Menu } from '../../components/Menu.js';
import type { MenuItem } from '../../components/Menu.js';
import { CommandPreview } from '../../components/CommandPreview.js';
import { colors } from '../../theme/colors.js';
import type { SetupPlan } from '../../../setup/types.js';

interface ReviewStepProps {
  plan: SetupPlan;
  onExecute: () => void;
  onBack: () => void;
  onCancel: () => void;
}

export function ReviewStep({
  plan,
  onExecute,
  onBack,
  onCancel,
}: ReviewStepProps): React.ReactElement {
  useInput((_input, key) => {
    if (key.escape) {
      onBack();
    }
  });

  const handleSelect = (item: MenuItem): void => {
    if (item.value === 'execute') {
      onExecute();
    } else if (item.value === 'back') {
      onBack();
    } else if (item.value === 'cancel') {
      onCancel();
    }
  };

  return (
    <Box flexDirection="column" gap={1}>
      <Text color={colors.pink} bold>
        Step 7/7 — Review and Execute
      </Text>

      <CommandPreview plan={plan} />

      <Menu
        items={[
          { label: 'Execute Setup', value: 'execute' },
          { label: 'Go Back', value: 'back' },
          { label: 'Cancel', value: 'cancel' },
        ]}
        onSelect={handleSelect}
      />
    </Box>
  );
}
