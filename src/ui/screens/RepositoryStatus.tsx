import React from 'react';
import { Box, Text, useInput } from 'ink';
import { homeDirRelative } from '../../utils/paths.js';
import type { RepoInfo } from '../../git/types.js';

interface RepositoryStatusProps {
  repoInfo: RepoInfo;
  onBack: () => void;
}

export function RepositoryStatus({ repoInfo, onBack }: RepositoryStatusProps): React.ReactElement {
  useInput((_input, key) => {
    if (key.escape || _input === 'q' || _input === 'Q') {
      onBack();
    }
  });

  const { fileStatus, lastCommit } = repoInfo;

  return (
    <Box flexDirection="column" gap={1} paddingX={1}>
      <Text bold color="cyan">
        Repository Status
      </Text>

      <Box flexDirection="column">
        <Text dimColor>Path:</Text>
        <Text>{homeDirRelative(repoInfo.root)}</Text>
      </Box>

      <Box flexDirection="column">
        <Text dimColor>Branch:</Text>
        <Text color="cyan">{repoInfo.branch}</Text>
      </Box>

      <Box flexDirection="column">
        <Text dimColor>Working Tree:</Text>
        <Text color={fileStatus.isClean ? 'green' : 'yellow'}>
          {fileStatus.isClean ? 'Clean' : 'Dirty'}
        </Text>
      </Box>

      <Box flexDirection="column">
        <Text dimColor>Changes:</Text>
        <Text>
          {fileStatus.modified} modified · {fileStatus.untracked} untracked · {fileStatus.staged}{' '}
          staged
        </Text>
      </Box>

      <Box flexDirection="column">
        <Text dimColor>Remotes:</Text>
        {repoInfo.remotes.length > 0 ? (
          repoInfo.remotes.map(remote => <Text key={remote}>{remote}</Text>)
        ) : (
          <Text dimColor>None configured</Text>
        )}
      </Box>

      <Box flexDirection="column">
        <Text dimColor>Last Commit:</Text>
        {lastCommit != null ? (
          <Text>
            <Text color="yellow">{lastCommit.hash}</Text> {lastCommit.message}
          </Text>
        ) : (
          <Text dimColor>No commits yet</Text>
        )}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Press Escape or Q to return to menu</Text>
      </Box>
    </Box>
  );
}
