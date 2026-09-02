import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Panel } from '../components/layout/Panel.js';
import { colors } from '../theme/colors.js';
import type { RepoInfo } from '../../git/types.js';

export type MenuAction = 'status' | 'staging' | 'commit' | 'push' | 'pull' | 'init';

interface MainMenuProps {
  cwd: string;
  isRepo: boolean;
  repoInfo: RepoInfo | null;
  onNavigate: (action: MenuAction) => void;
  onExit: () => void;
}

const MENU_ACTIONS: ReadonlyArray<{
  label: string;
  value: MenuAction | 'exit';
  disabled?: boolean;
  warning?: string;
}> = [
  { label: 'Repository Status', value: 'status' },
  { label: 'Stage Changes', value: 'staging' },
  { label: 'Create Commit', value: 'commit' },
  { label: 'Pull Changes', value: 'pull' },
  { label: 'Push Changes', value: 'push' },
  { label: 'Repository Setup', value: 'init' },
  { label: 'Exit', value: 'exit' },
];

export function MainMenu({ repoInfo, onNavigate, onExit }: MainMenuProps): React.ReactElement {
  const [selected, setSelected] = useState(0);

  const enabledIndices = MENU_ACTIONS.reduce<number[]>((acc, item, i) => {
    if (!item.disabled && !['exit'].includes(item.value)) acc.push(i);
    return acc;
  }, []);
  const totalEnabled = enabledIndices.length;

  useInput((input, key) => {
    if (key.upArrow || input === 'k' || input === 'K') {
      setSelected(prev => (prev > 0 ? prev - 1 : totalEnabled - 1));
    } else if (key.downArrow || input === 'j' || input === 'J') {
      setSelected(prev => (prev < totalEnabled - 1 ? prev + 1 : 0));
    } else if (key.return) {
      const item = MENU_ACTIONS[selected];
      if (item && !item.disabled) {
        if (item.value === 'exit') {
          onExit();
        } else {
          onNavigate(item.value);
        }
      }
    }
  });

  const remotesCount = repoInfo?.remotes.length ?? 0;

  const sideInfo: React.ReactNode[] = [];
  const clean = repoInfo?.fileStatus.isClean ?? true;
  sideInfo.push(
    <Box key="clean" flexDirection="row">
      <Text color={colors.grey}>working tree: </Text>
      <Text color={clean ? colors.green : colors.yellow}>
        {clean
          ? 'clean'
          : `${repoInfo!.fileStatus.modified} modified · ${repoInfo!.fileStatus.staged} staged · ${repoInfo!.fileStatus.untracked} untracked`}
      </Text>
    </Box>,
  );
  if (remotesCount > 0) {
    sideInfo.push(
      <Box key="remote" flexDirection="row">
        <Text color={colors.grey}>remotes: </Text>
        <Text color={colors.white}>{repoInfo!.remotes.join(', ')}</Text>
      </Box>,
    );
  }

  return (
    <Panel
      title="workspace"
      flexGrow={1}
      borderColor={colors.border}
      paddingY={1}
      paddingX={2}
      titleRight={repoInfo?.branch ? `branch: ${repoInfo.branch}` : 'no repository'}
    >
      <Box flexDirection="column" gap={0}>
        <Box marginLeft={2} marginBottom={1}>
          <Text color={colors.orange} bold>
            Git workflow assistant
          </Text>
        </Box>

        <Box flexDirection="column">
          {MENU_ACTIONS.map((item, index) => {
            const isSelected = selected === index;
            const isExit = item.value === 'exit';

            return (
              <Box key={item.value} flexDirection="column" paddingX={1}>
                <Box flexDirection="row">
                  <Text>
                    {isSelected ? (
                      <Text color={colors.pink} bold>
                        ❯{' '}
                      </Text>
                    ) : (
                      <Text color={colors.darkGrey}> </Text>
                    )}
                    <Text
                      color={isSelected ? colors.white : isExit ? colors.grey : colors.lightGrey}
                      bold={isSelected}
                    >
                      {item.label}
                    </Text>
                    {item.value === 'status' && repoInfo && !clean && (
                      <Text color={colors.yellow}>
                        {' '}
                        {repoInfo.fileStatus.modified +
                          repoInfo.fileStatus.staged +
                          repoInfo.fileStatus.untracked}
                      </Text>
                    )}
                  </Text>
                </Box>
              </Box>
            );
          })}
        </Box>

        <Box marginTop={2} flexDirection="column">
          <Box flexDirection="column">{sideInfo}</Box>
        </Box>
      </Box>
    </Panel>
  );
}
