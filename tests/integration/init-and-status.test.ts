import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  isGitInstalled,
  isGitRepository,
  getRepoInfo,
  initRepository,
  stageFiles,
  createCommit,
} from '../../src/git/client.js';
import { detectRepository, getRepoStatus } from '../../src/git/repository.js';
import { getGitignoreContent, GITIGNORE_TEMPLATES } from '../../src/templates/gitignore.js';
import { validateDirectory } from '../../src/utils/paths.js';

describe('Real Git Integration Tests', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'gitflow-integration-test-'));
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('detects git is installed on the host system', async () => {
    const installed = await isGitInstalled();
    expect(installed).toBe(true);
  });

  it('detects non-repository directory correctly', async () => {
    const isRepo = await isGitRepository(testDir);
    expect(isRepo).toBe(false);

    const detection = await detectRepository(testDir);
    expect(detection.isRepo).toBe(false);
    expect(detection.root).toBeNull();
  });

  it('initialises a new repository, generates README and .gitignore, and creates initial commit', async () => {
    const validation = await validateDirectory(testDir);
    expect(validation.valid).toBe(true);
    expect(validation.resolvedPath).toBe(testDir);

    const repoName = 'test-integration-repo';
    const readmeContent = `# ${repoName}\n\nProject description goes here.\n`;
    await writeFile(join(testDir, 'README.md'), readmeContent, 'utf8');

    const gitignoreContent = getGitignoreContent('nodejs');
    expect(gitignoreContent).not.toBeNull();
    await writeFile(join(testDir, '.gitignore'), gitignoreContent!, 'utf8');

    await initRepository(testDir);

    const isRepo = await isGitRepository(testDir);
    expect(isRepo).toBe(true);

    const detection = await detectRepository(testDir);
    expect(detection.isRepo).toBe(true);
    expect(detection.root).toBeTruthy();

    await stageFiles(testDir, ['README.md', '.gitignore']);

    const savedReadme = await readFile(join(testDir, 'README.md'), 'utf8');
    expect(savedReadme).toBe(readmeContent);

    const savedGitignore = await readFile(join(testDir, '.gitignore'), 'utf8');
    expect(savedGitignore).toBe(GITIGNORE_TEMPLATES.nodejs);

    const commitMessage = 'feat: initial repository setup';
    await createCommit(testDir, commitMessage);

    const status = await getRepoStatus(testDir);
    expect(status.root).toBeTruthy();
    expect(status.branch).toBeTruthy();
    expect(status.fileStatus.isClean).toBe(true);
    expect(status.fileStatus.modified).toBe(0);
    expect(status.fileStatus.untracked).toBe(0);
    expect(status.fileStatus.staged).toBe(0);
    expect(status.lastCommit).not.toBeNull();
    expect(status.lastCommit?.message).toBe(commitMessage);
    expect(status.lastCommit?.hash).toHaveLength(7);
  });

  it('accurately tracks modified, untracked, and staged files', async () => {
    await initRepository(testDir);

    await writeFile(join(testDir, 'file-a.txt'), 'version 1', 'utf8');
    await stageFiles(testDir, ['file-a.txt']);
    await createCommit(testDir, 'Initial commit');

    await writeFile(join(testDir, 'file-a.txt'), 'version 2', 'utf8');

    await writeFile(join(testDir, 'file-b.txt'), 'new file', 'utf8');

    await writeFile(join(testDir, 'file-c.txt'), 'staged file', 'utf8');
    await stageFiles(testDir, ['file-c.txt']);

    const info = await getRepoInfo(testDir);
    expect(info.fileStatus.isClean).toBe(false);
    expect(info.fileStatus.modified).toBe(1);
    expect(info.fileStatus.untracked).toBe(1);
    expect(info.fileStatus.staged).toBe(1);
  });

  it('handles repositories with no commits gracefully', async () => {
    await initRepository(testDir);
    const info = await getRepoInfo(testDir);
    expect(info.root).toBeTruthy();
    expect(info.lastCommit).toBeNull();
  });
});
