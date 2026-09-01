import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  initRepository,
  stageFiles,
  unstageFiles,
  stageAll,
  unstageAll,
  getFileDiff,
  createCommit,
  getWorkingTreeStatus,
  getRepoInfo,
} from '../../src/git/client.js';
import { formatConventionalCommit } from '../../src/commit/conventional.js';

describe('Real Git Staging and Commit Integration', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'gitflow-stage-commit-test-'));
    await initRepository(testDir);
    // Create initial commit so branch and HEAD exist
    await writeFile(join(testDir, 'init.txt'), 'init', 'utf8');
    await stageFiles(testDir, ['init.txt']);
    await createCommit(testDir, 'chore: initial commit');
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('stages an individual file and reports correct working tree status', async () => {
    await writeFile(join(testDir, 'file1.txt'), 'hello', 'utf8');
    await writeFile(join(testDir, 'file2.txt'), 'world', 'utf8');

    let status = await getWorkingTreeStatus(testDir);
    expect(status.untrackedFiles.length).toBe(2);
    expect(status.stagedFiles.length).toBe(0);

    await stageFiles(testDir, ['file1.txt']);

    status = await getWorkingTreeStatus(testDir);
    expect(status.stagedFiles.length).toBe(1);
    expect(status.stagedFiles[0]?.path).toBe('file1.txt');
    expect(status.unstagedFiles.length).toBe(1);
    expect(status.unstagedFiles[0]?.path).toBe('file2.txt');
  });

  it('stages multiple files concurrently', async () => {
    await writeFile(join(testDir, 'a.txt'), 'a', 'utf8');
    await writeFile(join(testDir, 'b.txt'), 'b', 'utf8');
    await writeFile(join(testDir, 'c.txt'), 'c', 'utf8');

    await stageFiles(testDir, ['a.txt', 'b.txt']);

    const status = await getWorkingTreeStatus(testDir);
    expect(status.stagedFiles.length).toBe(2);
    expect(status.unstagedFiles.length).toBe(1);
  });

  it('stages all changes with stageAll', async () => {
    await writeFile(join(testDir, 'a.txt'), 'a', 'utf8');
    await writeFile(join(testDir, 'b.txt'), 'b', 'utf8');

    await stageAll(testDir);

    const status = await getWorkingTreeStatus(testDir);
    expect(status.stagedFiles.length).toBe(2);
    expect(status.unstagedFiles.length).toBe(0);
  });

  it('unstages an individual file with unstageFiles', async () => {
    await writeFile(join(testDir, 'a.txt'), 'a', 'utf8');
    await writeFile(join(testDir, 'b.txt'), 'b', 'utf8');
    await stageAll(testDir);

    let status = await getWorkingTreeStatus(testDir);
    expect(status.stagedFiles.length).toBe(2);

    await unstageFiles(testDir, ['a.txt']);

    status = await getWorkingTreeStatus(testDir);
    expect(status.stagedFiles.length).toBe(1);
    expect(status.stagedFiles[0]?.path).toBe('b.txt');
    expect(status.unstagedFiles.length).toBe(1);
    expect(status.unstagedFiles[0]?.path).toBe('a.txt');
  });

  it('unstages all files with unstageAll', async () => {
    await writeFile(join(testDir, 'a.txt'), 'a', 'utf8');
    await writeFile(join(testDir, 'b.txt'), 'b', 'utf8');
    await stageAll(testDir);

    await unstageAll(testDir);

    const status = await getWorkingTreeStatus(testDir);
    expect(status.stagedFiles.length).toBe(0);
    expect(status.unstagedFiles.length).toBe(2);
  });

  it('retrieves diffs for unstaged modifications', async () => {
    await writeFile(join(testDir, 'init.txt'), 'init modified\nnew line', 'utf8');

    const diff = await getFileDiff(testDir, 'init.txt', false);
    expect(diff.isUntracked).toBe(false);
    expect(diff.diff).toContain('+init modified');
    expect(diff.diff).toContain('-init');
  });

  it('retrieves diffs for staged modifications', async () => {
    await writeFile(join(testDir, 'init.txt'), 'staged content', 'utf8');
    await stageFiles(testDir, ['init.txt']);

    const diff = await getFileDiff(testDir, 'init.txt', true);
    expect(diff.isUntracked).toBe(false);
    expect(diff.diff).toContain('+staged content');
  });

  it('identifies untracked files correctly in diff inspection', async () => {
    await writeFile(join(testDir, 'untracked.txt'), 'brand new file', 'utf8');

    const diff = await getFileDiff(testDir, 'untracked.txt', false);
    expect(diff.isUntracked).toBe(true);
    expect(diff.diff).toBe('');
  });

  it('truncates large diffs when line limit is exceeded', async () => {
    const largeLines = Array.from({ length: 150 }, (_, i) => `line ${i}`).join('\n');
    await writeFile(join(testDir, 'init.txt'), largeLines, 'utf8');

    const diff = await getFileDiff(testDir, 'init.txt', false, 20);
    expect(diff.truncated).toBe(true);
    expect(diff.diff.split('\n').length).toBe(20);
    expect(diff.totalLines).toBeGreaterThan(20);
  });

  it('creates conventional commit and updates repository status', async () => {
    await writeFile(join(testDir, 'feature.ts'), 'export const a = 1;', 'utf8');
    await stageFiles(testDir, ['feature.ts']);

    const message = formatConventionalCommit({
      type: 'feat',
      scope: 'core',
      isBreaking: true,
      description: 'add core export',
    });
    expect(message).toBe('feat(core)!: add core export');

    await createCommit(testDir, message);

    const info = await getRepoInfo(testDir);
    expect(info.fileStatus.isClean).toBe(true);
    expect(info.lastCommit?.message).toBe('feat(core)!: add core export');
  });

  it('creates custom commit messages and preserves exact formatting', async () => {
    await writeFile(join(testDir, 'fix.txt'), 'fixed', 'utf8');
    await stageFiles(testDir, ['fix.txt']);

    const customMessage = 'Fix problem with data parsing in legacy module';
    await createCommit(testDir, customMessage);

    const info = await getRepoInfo(testDir);
    expect(info.lastCommit?.message).toBe(customMessage);
  });
});
