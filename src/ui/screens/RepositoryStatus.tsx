import React from 'react';
import { Box, Text } from 'ink';
import { Panel } from '../components/layout/Panel.js';
import { Section, InfoRow } from '../components/Section.js';
import { ScreenHeader } from '../components/ScreenHeader.js';
import { colors } from '../theme/colors.js';
import type { RepoInfo } from '../../git/types.js';

interface RepositoryStatusProps {
  repoInfo: RepoInfo;
  onBack: () => void;
}

export function RepositoryStatus({ repoInfo }: RepositoryStatusProps): React.ReactElement {
  const { fileStatus, workingTree, lastCommit, upstream, aheadBehind } = repoInfo;
  const totalChanges =
    workingTree.stagedFiles.length +
    workingTree.modifiedFiles.length +
    workingTree.untrackedFiles.length +
    workingTree.deletedFiles.length +
    workingTree.renamedFiles.length;

  const fileColor = (category: string): string => {
    switch (category) {
      case 'staged':
        return colors.green;
      case 'modified':
        return colors.yellow;
      case 'untracked':
        return colors.coral;
      case 'deleted':
        return colors.red;
      case 'renamed':
        return colors.pink;
      case 'conflicted':
        return colors.red;
      default:
        return colors.white;
    }
  };

  const statusLabel = (category: string): string => {
    switch (category) {
      case 'staged':
        return 'M';
      case 'modified':
        return 'M';
      case 'untracked':
        return '?';
      case 'deleted':
        return 'D';
      case 'renamed':
        return 'R';
      case 'conflicted':
        return '!';
      default:
        return '·';
    }
  };

  return (
    <Panel
      title="repository status"
      flexGrow={1}
      width="100%"
      titleRight={repoInfo.branch ? `branch: ${repoInfo.branch}` : undefined}
    >
      <ScreenHeader title="Repository Status" />

      <Box flexDirection="row" gap={4} marginBottom={1}>
        <Section title="branch">
          <InfoRow label="branch">
            <Text color={colors.pink} bold>
              {repoInfo.branch}
            </Text>
          </InfoRow>
          {upstream && (
            <InfoRow label="tracking">
              <Text>
                {upstream.remote}/{upstream.branch}
              </Text>
            </InfoRow>
          )}
          <InfoRow label="state">
            <Text color={fileStatus.isClean ? colors.green : colors.yellow}>
              {fileStatus.isClean ? '● clean' : `● ${totalChanges} changes`}
            </Text>
          </InfoRow>
        </Section>

        <Section title="sync">
          {aheadBehind ? (
            <>
              <InfoRow label="ahead">
                <Text color={aheadBehind.ahead > 0 ? colors.green : colors.grey}>
                  {aheadBehind.ahead > 0 ? `↑ ${aheadBehind.ahead}` : '—'}
                </Text>
              </InfoRow>
              <InfoRow label="behind">
                <Text color={aheadBehind.behind > 0 ? colors.yellow : colors.grey}>
                  {aheadBehind.behind > 0 ? `↓ ${aheadBehind.behind}` : '—'}
                </Text>
              </InfoRow>
            </>
          ) : (
            <InfoRow label="upstream">
              <Text color={colors.grey}>none</Text>
            </InfoRow>
          )}
        </Section>

        <Section title="remotes">
          {repoInfo.remotes.length > 0 ? (
            repoInfo.remotes.map(remote => (
              <InfoRow key={remote} label={remote}>
                <Text color={colors.orange}>{remote}</Text>
              </InfoRow>
            ))
          ) : (
            <InfoRow label="none">
              <Text color={colors.grey}>no remotes configured</Text>
            </InfoRow>
          )}
        </Section>

        <Section title="last commit">
          {lastCommit != null ? (
            <>
              <InfoRow label="hash">
                <Text color={colors.yellow}>{lastCommit.hash.slice(0, 8)}</Text>
              </InfoRow>
              <InfoRow label="msg">
                <Text>{lastCommit.message}</Text>
              </InfoRow>
            </>
          ) : (
            <InfoRow label="none">
              <Text color={colors.grey}>no commits yet</Text>
            </InfoRow>
          )}
        </Section>
      </Box>

      {!fileStatus.isClean && (
        <Box flexDirection="column" marginTop={1}>
          <Box flexDirection="row" marginBottom={1}>
            <Text color={colors.pink} bold>
              changed files
            </Text>
            <Box flexGrow={1} />
            <Text color={colors.grey}>{totalChanges}</Text>
          </Box>

          <Box
            flexDirection="column"
            borderStyle="single"
            borderColor={colors.border}
            paddingX={2}
            paddingY={1}
            overflow="hidden"
          >
            {workingTree.files.map(f => (
              <Box key={f.path + (f.oldPath ?? '')} flexDirection="row">
                <Text color={fileColor(f.category)}>{statusLabel(f.category)}</Text>
                <Text color={colors.grey}> </Text>
                <Text color={fileColor(f.category)}>{f.category.padEnd(9)}</Text>
                <Text color={colors.white}>{f.oldPath ? `${f.oldPath} -> ${f.path}` : f.path}</Text>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {fileStatus.isClean && (
        <Box marginTop={1}>
          <Text color={colors.green}>✓ working tree clean — nothing to stage or commit</Text>
        </Box>
      )}
    </Panel>
  );
}