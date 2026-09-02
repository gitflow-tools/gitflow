import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';
import { homeDirRelative } from '../../utils/paths.js';
import { GITIGNORE_TEMPLATE_LABELS } from '../../templates/gitignore.js';
import { getPlanActionItems } from '../../setup/plan.js';
import type { SetupPlan } from '../../setup/types.js';

interface CommandPreviewProps {
  plan: SetupPlan;
}

export function CommandPreview({ plan }: CommandPreviewProps): React.ReactElement {
  const actions = getPlanActionItems(plan);
  const gitignoreLabel = GITIGNORE_TEMPLATE_LABELS[plan.gitignoreTemplate];
  const branch = plan.defaultBranch || 'main';

  return (
    <Box flexDirection="column" gap={1}>
      <Text color={colors.pink} bold>
        Repository Setup Plan
      </Text>

      <Box flexDirection="column">
        <Text color={colors.grey}>Directory:</Text>
        <Text>{homeDirRelative(plan.directory)}</Text>
      </Box>

      <Box flexDirection="column">
        <Text color={colors.grey}>Repository:</Text>
        <Text>{plan.repositoryName}</Text>
      </Box>

      <Box flexDirection="column">
        <Text color={colors.grey}>Files:</Text>
        {plan.createReadme ? (
          plan.existingReadmeAction === 'keep' ? (
            <Text color={colors.yellow}>⚠ README.md (keep existing)</Text>
          ) : (
            <Text color={colors.green}>✓ README.md</Text>
          )
        ) : (
          <Text color={colors.grey}>✗ README.md (skipped)</Text>
        )}

        {plan.gitignoreTemplate !== 'none' ? (
          plan.existingGitignoreAction === 'keep' ? (
            <Text color={colors.yellow}>⚠ .gitignore (keep existing)</Text>
          ) : (
            <Text color={colors.green}>✓ .gitignore ({gitignoreLabel})</Text>
          )
        ) : (
          <Text color={colors.grey}>✗ .gitignore (skipped)</Text>
        )}
      </Box>

      <Box flexDirection="column">
        <Text color={colors.grey}>Git:</Text>
        <Text color={colors.green}>✓ Initialise repository</Text>
        <Text color={colors.green}>✓ Set default branch to {branch}</Text>
      </Box>

      <Box flexDirection="column">
        <Text color={colors.grey}>Commit:</Text>
        {plan.createInitialCommit ? (
          <>
            <Text color={colors.green}>✓ Initial commit</Text>
            <Box flexDirection="column" marginTop={1}>
              <Text color={colors.grey}>Message:</Text>
              <Text>{plan.commitMessage || 'Initial commit'}</Text>
            </Box>
          </>
        ) : (
          <Text color={colors.grey}>✗ Disabled</Text>
        )}
      </Box>

      <Box flexDirection="column">
        <Text color={colors.grey}>Remote:</Text>
        {plan.remote ? (
          <>
            <Text color={colors.green}>✓ {plan.remote.name}</Text>
            <Text>{plan.remote.url}</Text>
          </>
        ) : (
          <Text color={colors.grey}>✗ None</Text>
        )}
      </Box>

      <Box flexDirection="column">
        <Text color={colors.grey}>Push:</Text>
        {plan.pushAfterSetup ? (
          <Text color={colors.green}>✓ Enabled</Text>
        ) : (
          <Text color={colors.grey}>✗ Disabled</Text>
        )}
      </Box>

      <Text color={colors.border}>────────────────────────────────────────────</Text>

      <Box flexDirection="column">
        <Text color={colors.grey} bold>
          Commands and actions:
        </Text>
        {actions.map((action, i) => (
          <Box key={i}>
            <Text color={colors.grey}>{i + 1}. </Text>
            {action.command ? (
              <Text color={colors.orange}>{action.command}</Text>
            ) : (
              <Text>{action.description}</Text>
            )}
          </Box>
        ))}
      </Box>

      <Text color={colors.border}>────────────────────────────────────────────</Text>
    </Box>
  );
}
