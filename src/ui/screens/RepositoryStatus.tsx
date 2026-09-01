import React from 'react';
import { Box, Text, useInput } from 'ink';
import { Menu } from '../components/Menu.js';
import { homeDirRelative } from '../../utils/paths.js';
import type { RepoInfo } from '../../git/types.js';

interface RepositoryStatusProps {
  repoInfo: RepoInfo;
  onBack: () => void;
}

export function RepositoryStatus({ repoInfo, onBack }: RepositoryStatusProps): React.ReactElement {
  useInput((_input, key) => {
    if (
      key.escape ||
      _input === 'q' ||
      _input === 'Q' ||
      _input === '\u001b' ||
      _input === '\x1b' ||
      (_input != null && _input.charCodeAt(0) === 27) ||
      key.return ||
      key.backspace ||
      key.delete ||
      _input === ' '
    ) {
      onBack();
    }
  });

  const { fileStatus, workingTree, lastCommit, upstream, aheadBehind } = repoInfo;
  const totalChanges =
    workingTree.stagedFiles.length +
    workingTree.modifiedFiles.length +
    workingTree.untrackedFiles.length +
    workingTree.deletedFiles.length +
    workingTree.renamedFiles.length;

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
        <Box>
          <Text color="cyan">{repoInfo.branch}</Text>
          {upstream && (
            <Text dimColor>
              {' '}
              (tracking {upstream.remote}/{upstream.branch})
            </Text>
          )}
        </Box>
        {aheadBehind && (
          <Text color={aheadBehind.ahead > 0 ? 'green' : undefined}>
            {aheadBehind.ahead > 0 ? `${aheadBehind.ahead} commits ahead` : 'Up to date'}
            {aheadBehind.behind > 0 ? `, ${aheadBehind.behind} commits behind` : ''}
          </Text>
        )}
      </Box>

      <Box flexDirection="column">
        <Text dimColor>Working Tree:</Text>
        <Text color={fileStatus.isClean ? 'green' : 'yellow'}>
          {fileStatus.isClean ? 'Clean (no changes)' : `${totalChanges} changes`}
        </Text>
      </Box>

      {!fileStatus.isClean && (
        <Box flexDirection="column" gap={1} marginY={1}>
          {workingTree.stagedFiles.length > 0 && (
            <Box flexDirection="column">
              <Text bold color="green">
                Staged:
              </Text>
              {workingTree.stagedFiles.map(f => (
                <Text key={f.path} color="green">
                  {'  ' + (f.indexStatus || 'M')} {f.path}
                </Text>
              ))}
            </Box>
          )}

          {workingTree.modifiedFiles.length > 0 && (
            <Box flexDirection="column">
              <Text bold color="yellow">
                Modified:
              </Text>
              {workingTree.modifiedFiles.map(f => (
                <Text key={f.path} color="yellow">
                  {'  ' + (f.workingTreeStatus || 'M')} {f.path}
                </Text>
              ))}
            </Box>
          )}

          {workingTree.untrackedFiles.length > 0 && (
            <Box flexDirection="column">
              <Text bold color="magenta">
                Untracked:
              </Text>
              {workingTree.untrackedFiles.map(f => (
                <Text key={f.path} color="magenta">
                  {'  ?'} {f.path}
                </Text>
              ))}
            </Box>
          )}

          {workingTree.deletedFiles.length > 0 && (
            <Box flexDirection="column">
              <Text bold color="red">
                Deleted:
              </Text>
              {workingTree.deletedFiles.map(f => (
                <Text key={f.path} color="red">
                  {'  D'} {f.path}
                </Text>
              ))}
            </Box>
          )}

          {workingTree.renamedFiles.length > 0 && (
            <Box flexDirection="column">
              <Text bold color="cyan">
                Renamed:
              </Text>
              {workingTree.renamedFiles.map(f => (
                <Text key={f.path} color="cyan">
                  {'  R'} {f.oldPath ? `${f.oldPath} -> ` : ''}
                  {f.path}
                </Text>
              ))}
            </Box>
          )}
        </Box>
      )}

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
        <Menu
          items={[{ label: 'Return to menu', value: 'back' }]}
          onSelect={onBack}
          onCancel={onBack}
        />
      </Box>

      <Box marginTop={1}>
        <Text dimColor> ↑↓ Navigate · Enter / Esc / Q Back</Text>
      </Box>
    </Box>
  );
}
