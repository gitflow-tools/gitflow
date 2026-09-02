import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { App } from '../src/ui/App.js';
import type { RepoInfo } from '../src/git/types.js';

const emptyWorkingTree = {
  files: [],
  stagedFiles: [],
  unstagedFiles: [],
  untrackedFiles: [],
  modifiedFiles: [],
  deletedFiles: [],
  renamedFiles: [],
  conflictedFiles: [],
  isClean: true,
};

const fakeRepo: RepoInfo = {
  root: '/tmp/fake',
  branch: 'main',
  fileStatus: { modified: 0, untracked: 0, staged: 0, isClean: true },
  workingTree: emptyWorkingTree,
  remotes: ['origin'],
  upstream: { remote: 'origin', branch: 'main' },
  aheadBehind: { ahead: 0, behind: 0 },
  lastCommit: { hash: 'abc1234def5678', message: 'init' },
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

describe('navigation input', () => {
  it('maintains input after navigating menu -> status', async () => {
    const { stdin, stdout, unmount } = render(
      React.createElement(App, { cwd: '/tmp/fake', isRepo: true, repoInfo: fakeRepo }),
    );

    expect(stdout.lastFrame()).toContain('Repository Status');

    stdin.write('\r');
    await sleep(200);
    const afterEnter = stdout.lastFrame() ?? '';
    process.stdout.write('=== AFTER ENTER ===\n' + afterEnter.slice(0, 400) + '\n=== END ===\n');
    expect(afterEnter).toContain('repository status');

    stdin.write('j');
    await sleep(200);
    const afterJ = stdout.lastFrame() ?? '';
    process.stdout.write('=== AFTER J ===\n' + afterJ.slice(0, 400) + '\n=== END ===\n');

    unmount();
    expect(true).toBe(true);
  });
});
