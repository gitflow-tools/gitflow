import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../../theme/colors.js';
import { homeDirRelative } from '../../../utils/paths.js';
import type { RepoInfo } from '../../../git/types.js';

interface HeaderBarProps {
  cwd: string;
  repoInfo: RepoInfo | null;
  isRepo: boolean;
}

export function HeaderBar({ cwd, repoInfo, isRepo }: HeaderBarProps): React.ReactElement {
  const repoName = homeDirRelative(cwd);
  const branch = repoInfo?.branch ?? '—';
  const isClean = repoInfo?.fileStatus.isClean ?? true;
  const modified = repoInfo?.fileStatus.modified ?? 0;
  const staged = repoInfo?.fileStatus.staged ?? 0;
  const untracked = repoInfo?.fileStatus.untracked ?? 0;
  const ahead = repoInfo?.aheadBehind?.ahead ?? 0;
  const behind = repoInfo?.aheadBehind?.behind ?? 0;

  return (
    <Box flexDirection="row" paddingX={1} width="100%" flexShrink={0}>
      <Text>
        <Text color={colors.orange} bold>
          gitflow
        </Text>
        <Text color={colors.grey}> v0.3.0 </Text>
        <Text color={colors.border}>│</Text>
        <Text color={colors.grey}> repo:</Text>
        <Text color={colors.white}> {repoName} </Text>
        <Text color={colors.border}>│</Text>
        <Text color={colors.grey}> </Text>
        <Text color={colors.pink} bold>
          ●
        </Text>
        <Text color={colors.white}> {branch} </Text>
        <Text color={colors.border}>│</Text>
        {isRepo ? (
          <>
            {isClean ? (
              <Text>
                <Text color={colors.grey}> </Text>
                <Text color={colors.green}>✓ clean</Text>
              </Text>
            ) : (
              <Text>
                <Text color={colors.grey}> </Text>
                <Text color={colors.yellow}>! {modified + staged + untracked} changes</Text>
              </Text>
            )}
            {ahead > 0 && (
              <Text>
                <Text color={colors.grey}> │ </Text>
                <Text color={colors.green}>↑{ahead}</Text>
              </Text>
            )}
            {behind > 0 && (
              <Text>
                <Text color={colors.grey}> </Text>
                <Text color={colors.yellow}>↓{behind}</Text>
              </Text>
            )}
          </>
        ) : (
          <Text>
            <Text color={colors.grey}> </Text>
            <Text color={colors.yellow}>○ not initialised</Text>
          </Text>
        )}
      </Text>
    </Box>
  );
}
