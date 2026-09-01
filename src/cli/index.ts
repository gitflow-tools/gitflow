#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { App } from '../ui/App.js';
import { isGitInstalled } from '../git/client.js';
import { detectRepository, getRepoStatus } from '../git/repository.js';
import type { RepoInfo } from '../git/types.js';

async function main(): Promise<void> {
  const gitInstalled = await isGitInstalled();

  if (!gitInstalled) {
    process.stderr.write(
      '\n  ✗  Git is not installed or not found in PATH.\n\n' +
        '  Please install Git: https://git-scm.com/downloads\n\n',
    );
    process.exit(1);
  }

  const cwd = process.cwd();
  const detection = await detectRepository(cwd);

  let repoInfo: RepoInfo | null = null;
  if (detection.isRepo) {
    try {
      repoInfo = await getRepoStatus(cwd);
    } catch {
      repoInfo = null;
    }
  }

  render(
    React.createElement(App, {
      cwd,
      isRepo: detection.isRepo,
      repoInfo,
    }),
  );
}

main().catch(err => {
  process.stderr.write(`\nFatal error: ${String(err)}\n`);
  process.exit(1);
});
