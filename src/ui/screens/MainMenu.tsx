import React from 'react';
import { Box, Text, useApp } from 'ink';
import { Menu } from '../components/Menu.js';
import { Header } from '../components/Header.js';
import type { MenuItem } from '../components/Menu.js';
import type { RepoInfo } from '../../git/types.js';

export type MenuAction = 'status' | 'staging' | 'commit' | 'push' | 'pull' | 'init';

interface MainMenuProps {
  cwd: string;
  isRepo: boolean;
  repoInfo: RepoInfo | null;
  onNavigate: (action: MenuAction) => void;
}

export function MainMenu({ cwd, isRepo, repoInfo, onNavigate }: MainMenuProps): React.ReactElement {
  const { exit } = useApp();

  const stagedCount = repoInfo?.workingTree?.stagedFiles.length ?? 0;
  const remotesCount = repoInfo?.remotes.length ?? 0;

  const menuItems: ReadonlyArray<MenuItem> = [
    {
      label: 'Status',
      value: 'status',
      disabled: !isRepo,
    },
    {
      label: 'Stage Changes',
      value: 'staging',
      disabled: !isRepo,
    },
    {
      label: 'Commit',
      value: 'commit',
      disabled: !isRepo,
      warning: isRepo && stagedCount === 0 ? 'No staged changes' : undefined,
    },
    {
      label: 'Push',
      value: 'push',
      disabled: !isRepo,
      warning: isRepo && remotesCount === 0 ? 'No remotes configured' : undefined,
    },
    {
      label: 'Pull',
      value: 'pull',
      disabled: !isRepo,
      warning: isRepo && remotesCount === 0 ? 'No remotes configured' : undefined,
    },
    {
      label: isRepo ? 'Repository Setup' : 'Initialise Repository',
      value: 'init',
      warning: isRepo ? 'A Git repository already exists here' : undefined,
    },
    {
      label: 'Exit',
      value: 'exit',
    },
  ];

  const handleSelect = (item: MenuItem): void => {
    if (item.value === 'exit') {
      exit();
      return;
    }
    onNavigate(item.value as MenuAction);
  };

  return (
    <Box flexDirection="column">
      <Header cwd={cwd} repoInfo={repoInfo} isRepo={isRepo} />

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="cyan"
        paddingX={3}
        paddingY={1}
        width={48}
      >
        <Box justifyContent="center" marginBottom={1}>
          <Text bold color="cyan">
            GITFLOW
          </Text>
        </Box>

        <Box justifyContent="center" marginBottom={2}>
          <Text dimColor>Your Git workflow assistant</Text>
        </Box>

        <Menu items={menuItems} onSelect={handleSelect} onCancel={exit} />

        <Box marginTop={2}>
          <Text dimColor> ↑↓ Navigate · Enter Select · Q/Esc Exit</Text>
        </Box>
      </Box>
    </Box>
  );
}
