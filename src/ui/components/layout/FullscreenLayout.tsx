import React from 'react';
import { Box } from 'ink';
import { HeaderBar } from './HeaderBar.js';
import { FooterBar } from './FooterBar.js';
import type { RepoInfo } from '../../../git/types.js';

interface LayoutProps {
  cwd: string;
  repoInfo: RepoInfo | null;
  isRepo: boolean;
  sidebar?: React.ReactNode;
  sidebarWidth?: number;
  footerShortcuts: ReadonlyArray<{ key: string; label: string }>;
  children: React.ReactNode;
  showHeader?: boolean;
  termWidth?: number;
  termHeight?: number;
}

export function FullscreenLayout({
  cwd,
  repoInfo,
  isRepo,
  sidebar,
  sidebarWidth = 22,
  footerShortcuts,
  children,
  showHeader = true,
  termWidth,
  termHeight,
}: LayoutProps): React.ReactElement {
  return (
    <Box flexDirection="column" width={termWidth ?? '100%'} height={termHeight ?? '100%'}>
      {showHeader && (
        <HeaderBar cwd={cwd} repoInfo={repoInfo} isRepo={isRepo} />
      )}

      <Box flexDirection="row" flexGrow={1} overflow="hidden">
        {sidebar != null && (
          <Box
            width={sidebarWidth}
            flexDirection="column"
            flexShrink={0}
            borderStyle="round"
            borderColor="gray"
            paddingX={0}
            paddingY={0}
            height={termHeight != null ? termHeight - 2 : '100%'}
          >
            {sidebar}
          </Box>
        )}

        <Box flexDirection="column" flexGrow={1} overflow="hidden">
          {children}
        </Box>
      </Box>

      <FooterBar shortcuts={footerShortcuts} />
    </Box>
  );
}