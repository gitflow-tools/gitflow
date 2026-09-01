import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { simpleGit } from 'simple-git';
import {
  initRepository,
  stageFiles,
  createCommit,
  addRemote,
  push,
  pull,
  getRepoInfo,
  getUpstream,
  getAheadBehind,
  setDefaultBranch,
} from '../../src/git/client.js';

describe('Real Git Push and Pull Integration', () => {
  let localDir: string;
  let remoteBareDir: string;
  let secondLocalDir: string;

  beforeEach(async () => {
    localDir = await mkdtemp(join(tmpdir(), 'gitflow-local-'));
    remoteBareDir = await mkdtemp(join(tmpdir(), 'gitflow-remote-bare-'));
    secondLocalDir = await mkdtemp(join(tmpdir(), 'gitflow-second-local-'));

    // Init bare remote repo
    const remoteGit = simpleGit(remoteBareDir);
    await remoteGit.init(true);
    await remoteGit.raw(['symbolic-ref', 'HEAD', 'refs/heads/main']);

    // Init local repo
    await initRepository(localDir);
    await setDefaultBranch(localDir, 'main');
    await writeFile(join(localDir, 'README.md'), '# First', 'utf8');
    await stageFiles(localDir, ['README.md']);
    await createCommit(localDir, 'chore: init main');
    await addRemote(localDir, 'origin', remoteBareDir);
  });

  afterEach(async () => {
    await rm(localDir, { recursive: true, force: true });
    await rm(remoteBareDir, { recursive: true, force: true });
    await rm(secondLocalDir, { recursive: true, force: true });
  });

  it('pushes to remote and sets upstream branch with push({ setUpstream: true })', async () => {
    let upstream = await getUpstream(localDir);
    expect(upstream).toBeNull();

    const pushResult = await push(localDir, {
      remote: 'origin',
      branch: 'main',
      setUpstream: true,
    });
    expect(pushResult.success).toBe(true);

    upstream = await getUpstream(localDir);
    expect(upstream).not.toBeNull();
    expect(upstream?.remote).toBe('origin');
    expect(upstream?.branch).toBe('main');

    const aheadBehind = await getAheadBehind(localDir);
    expect(aheadBehind).not.toBeNull();
    expect(aheadBehind?.ahead).toBe(0);
    expect(aheadBehind?.behind).toBe(0);
  });

  it('accurately tracks ahead commits before pushing to existing upstream', async () => {
    await push(localDir, {
      remote: 'origin',
      branch: 'main',
      setUpstream: true,
    });

    await writeFile(join(localDir, 'file.txt'), 'content 1', 'utf8');
    await stageFiles(localDir, ['file.txt']);
    await createCommit(localDir, 'feat: commit 1');

    await writeFile(join(localDir, 'file2.txt'), 'content 2', 'utf8');
    await stageFiles(localDir, ['file2.txt']);
    await createCommit(localDir, 'feat: commit 2');

    const info = await getRepoInfo(localDir);
    expect(info.aheadBehind?.ahead).toBe(2);
    expect(info.aheadBehind?.behind).toBe(0);

    const pushResult = await push(localDir, {
      remote: 'origin',
      branch: 'main',
    });
    expect(pushResult.success).toBe(true);

    const updatedInfo = await getRepoInfo(localDir);
    expect(updatedInfo.aheadBehind?.ahead).toBe(0);
  });

  it('pulls changes from remote when branch is behind', async () => {
    // 1. Initial push from localDir
    await push(localDir, {
      remote: 'origin',
      branch: 'main',
      setUpstream: true,
    });

    // 2. Clone to secondLocalDir and make a commit
    const secondGit = simpleGit();
    await secondGit.clone(remoteBareDir, secondLocalDir);
    await writeFile(join(secondLocalDir, 'remote-change.txt'), 'from remote', 'utf8');
    const secondLocalGit = simpleGit(secondLocalDir);
    await secondLocalGit.add(['remote-change.txt']);
    await secondLocalGit.commit('feat: change from collaborator');
    await secondLocalGit.push('origin', 'main');

    // 3. In localDir, pull changes
    const pullResult = await pull(localDir);
    expect(pullResult.alreadyUpToDate).toBe(false);
    expect(pullResult.filesChanged).toBe(1);
    expect(pullResult.hasConflict).toBe(false);

    // 4. Pulling again reports already up to date
    const secondPullResult = await pull(localDir);
    expect(secondPullResult.alreadyUpToDate).toBe(true);
  });

  it('detects merge conflicts gracefully during pull', async () => {
    await push(localDir, {
      remote: 'origin',
      branch: 'main',
      setUpstream: true,
    });

    // Clone to secondLocalDir
    const secondGit = simpleGit();
    await secondGit.clone(remoteBareDir, secondLocalDir);

    // Modify README in second repo and push
    await writeFile(join(secondLocalDir, 'README.md'), '# Collaborator Version', 'utf8');
    const secondLocalGit = simpleGit(secondLocalDir);
    await secondLocalGit.add(['README.md']);
    await secondLocalGit.commit('docs: update readme by collaborator');
    await secondLocalGit.push('origin', 'main');

    // Modify README differently in local repo and commit locally
    await writeFile(join(localDir, 'README.md'), '# Local Version with Conflict', 'utf8');
    await stageFiles(localDir, ['README.md']);
    await createCommit(localDir, 'docs: update readme locally');

    // Pull should encounter conflict and return conflict result without crashing
    const pullResult = await pull(localDir);
    expect(pullResult.hasConflict).toBe(true);
    expect(pullResult.conflictedFiles).toContain('README.md');
  });
});
