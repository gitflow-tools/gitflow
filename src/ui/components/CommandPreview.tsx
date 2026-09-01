import React from 'react';
import { Box, Text } from 'ink';
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
      <Text bold color="cyan">
        Repository Setup Plan
      </Text>

      <Box flexDirection="column">
        <Text dimColor>Directory:</Text>
        <Text>{homeDirRelative(plan.directory)}</Text>
      </Box>

      <Box flexDirection="column">
        <Text dimColor>Repository:</Text>
        <Text>{plan.repositoryName}</Text>
      </Box>

      <Box flexDirection="column">
        <Text dimColor>Files:</Text>
        {plan.createReadme ? (
          plan.existingReadmeAction === 'keep' ? (
            <Text color="yellow">⚠ README.md (keep existing)</Text>
          ) : (
            <Text color="green">✓ README.md</Text>
          )
        ) : (
          <Text dimColor>✗ README.md (skipped)</Text>
        )}

        {plan.gitignoreTemplate !== 'none' ? (
          plan.existingGitignoreAction === 'keep' ? (
            <Text color="yellow">⚠ .gitignore (keep existing)</Text>
          ) : (
            <Text color="green">✓ .gitignore ({gitignoreLabel})</Text>
          )
        ) : (
          <Text dimColor>✗ .gitignore (skipped)</Text>
        )}
      </Box>

      <Box flexDirection="column">
        <Text dimColor>Git:</Text>
        <Text color="green">✓ Initialise repository</Text>
        <Text color="green">✓ Set default branch to {branch}</Text>
      </Box>

      <Box flexDirection="column">
        <Text dimColor>Commit:</Text>
        {plan.createInitialCommit ? (
          <>
            <Text color="green">✓ Initial commit</Text>
            <Box flexDirection="column" marginTop={1}>
              <Text dimColor>Message:</Text>
              <Text>{plan.commitMessage || 'Initial commit'}</Text>
            </Box>
          </>
        ) : (
          <Text dimColor>✗ Disabled</Text>
        )}
      </Box>

      <Box flexDirection="column">
        <Text dimColor>Remote:</Text>
        {plan.remote ? (
          <>
            <Text color="green">✓ {plan.remote.name}</Text>
            <Text>{plan.remote.url}</Text>
          </>
        ) : (
          <Text dimColor>✗ None</Text>
        )}
      </Box>

      <Box flexDirection="column">
        <Text dimColor>Push:</Text>
        {plan.pushAfterSetup ? (
          <Text color="green">✓ Enabled</Text>
        ) : (
          <Text dimColor>✗ Disabled</Text>
        )}
      </Box>

      <Text dimColor>────────────────────────────────────────────</Text>

      <Box flexDirection="column">
        <Text bold dimColor>
          Commands and actions:
        </Text>
        {actions.map((action, i) => (
          <Box key={i}>
            <Text dimColor>{i + 1}. </Text>
            {action.command ? (
              <Text color="cyan">{action.command}</Text>
            ) : (
              <Text>{action.description}</Text>
            )}
          </Box>
        ))}
      </Box>

      <Text dimColor>────────────────────────────────────────────</Text>
    </Box>
  );
}
