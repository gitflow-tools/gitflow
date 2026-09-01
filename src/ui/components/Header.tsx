import React from 'react';
import { Box, Text } from 'ink';
import { homeDirRelative } from '../../utils/paths.js';
import type { RepoInfo } from '../../git/types.js';

interface HeaderProps {
  cwd: string;
  repoInfo: RepoInfo | null;
  isRepo: boolean;
}

export function Header({ cwd, repoInfo, isRepo }: HeaderProps): React.ReactElement {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box flexDirection="column" marginBottom={1}>
        <Text dimColor>Directory:</Text>
        <Text>{homeDirRelative(cwd)}</Text>
      </Box>

      <Box flexDirection="column" marginBottom={isRepo && repoInfo != null ? 1 : 0}>
        <Text dimColor>Repository:</Text>
        {isRepo ? <Text color="green">Detected</Text> : <Text color="yellow">Not initialised</Text>}
      </Box>

      {isRepo && repoInfo != null && (
        <Box flexDirection="column">
          <Text dimColor>Branch:</Text>
          <Text color="cyan">{repoInfo.branch}</Text>
        </Box>
      )}
    </Box>
  );
}
