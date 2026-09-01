import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { executeSetupPlan } from '../../src/setup/executor.js';
import { getRepoStatus } from '../../src/git/repository.js';
import { GITIGNORE_TEMPLATES } from '../../src/templates/gitignore.js';
import type { SetupPlan } from '../../src/setup/types.js';

describe('Setup Wizard Real Git Integration', () => {
  let tempDir: string;
  let remoteDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'gitflow-setup-test-'));
    remoteDir = await mkdtemp(join(tmpdir(), 'gitflow-setup-remote-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
    await rm(remoteDir, { recursive: true, force: true });
  });

  it('performs full repository initialization end-to-end', async () => {
    const plan: SetupPlan = {
      directory: tempDir,
      repositoryName: 'test-real-project',
      createReadme: true,
      readmeDescription: 'Integration test description',
      existingReadmeAction: 'replace',
      gitignoreTemplate: 'python',
      existingGitignoreAction: 'replace',
      createInitialCommit: true,
      commitMessage: 'feat: initialize repository with gitflow',
      defaultBranch: 'main',
      remote: {
        name: 'origin',
        url: `file://${remoteDir}`,
      },
      pushAfterSetup: false,
    };

    const result = await executeSetupPlan(plan);
    expect(result.success).toBe(true);

    const readmeContent = await readFile(join(tempDir, 'README.md'), 'utf8');
    expect(readmeContent).toBe('# test-real-project\n\nIntegration test description\n');

    const gitignoreContent = await readFile(join(tempDir, '.gitignore'), 'utf8');
    expect(gitignoreContent).toBe(GITIGNORE_TEMPLATES.python);

    const status = await getRepoStatus(tempDir);
    expect(status.branch).toBe('main');
    expect(status.fileStatus.isClean).toBe(true);
    expect(status.remotes).toContain('origin');
    expect(status.lastCommit?.message).toBe('feat: initialize repository with gitflow');
  });

  it('preserves existing files when existingReadmeAction is "keep"', async () => {
    const existingReadmeText = '# Custom Existing README Content';
    await writeFile(join(tempDir, 'README.md'), existingReadmeText, 'utf8');

    const plan: SetupPlan = {
      directory: tempDir,
      repositoryName: 'preserve-project',
      createReadme: true,
      readmeDescription: 'Should not overwrite',
      existingReadmeAction: 'keep',
      gitignoreTemplate: 'none',
      createInitialCommit: false,
      defaultBranch: 'main',
      pushAfterSetup: false,
    };

    const result = await executeSetupPlan(plan);
    expect(result.success).toBe(true);

    const currentReadme = await readFile(join(tempDir, 'README.md'), 'utf8');
    expect(currentReadme).toBe(existingReadmeText);
  });

  it('generates README without description when none provided', async () => {
    const plan: SetupPlan = {
      directory: tempDir,
      repositoryName: 'no-desc-project',
      createReadme: true,
      readmeDescription: '',
      gitignoreTemplate: 'none',
      createInitialCommit: true,
      commitMessage: 'Initial commit',
      defaultBranch: 'main',
      pushAfterSetup: false,
    };

    const result = await executeSetupPlan(plan);
    expect(result.success).toBe(true);

    const readmeContent = await readFile(join(tempDir, 'README.md'), 'utf8');
    expect(readmeContent).toBe('# no-desc-project\n');
  });

  it('preserves existing gitignore when existingGitignoreAction is "keep"', async () => {
    const existingGitignoreText = 'node_modules/\ncustom_build/\n';
    await writeFile(join(tempDir, '.gitignore'), existingGitignoreText, 'utf8');

    const plan: SetupPlan = {
      directory: tempDir,
      repositoryName: 'preserve-gitignore-project',
      createReadme: false,
      gitignoreTemplate: 'rust',
      existingGitignoreAction: 'keep',
      createInitialCommit: false,
      defaultBranch: 'main',
      pushAfterSetup: false,
    };

    const result = await executeSetupPlan(plan);
    expect(result.success).toBe(true);

    const currentGitignore = await readFile(join(tempDir, '.gitignore'), 'utf8');
    expect(currentGitignore).toBe(existingGitignoreText);
  });

  it('replaces existing .gitignore when existingGitignoreAction is "replace"', async () => {
    await writeFile(join(tempDir, '.gitignore'), 'old_ignore', 'utf8');

    const plan: SetupPlan = {
      directory: tempDir,
      repositoryName: 'replace-gitignore-project',
      createReadme: false,
      gitignoreTemplate: 'go',
      existingGitignoreAction: 'replace',
      createInitialCommit: false,
      defaultBranch: 'main',
      pushAfterSetup: false,
    };

    const result = await executeSetupPlan(plan);
    expect(result.success).toBe(true);

    const currentGitignore = await readFile(join(tempDir, '.gitignore'), 'utf8');
    expect(currentGitignore).toBe(GITIGNORE_TEMPLATES.go);
  });

  it('generates valid gitignore template for all supported languages', async () => {
    const templates = ['nodejs', 'rust', 'go', 'java'] as const;
    for (const template of templates) {
      const subTempDir = await mkdtemp(join(tmpdir(), `gitflow-test-${template}-`));
      const plan: SetupPlan = {
        directory: subTempDir,
        repositoryName: `${template}-project`,
        createReadme: false,
        gitignoreTemplate: template,
        createInitialCommit: false,
        defaultBranch: 'main',
        pushAfterSetup: false,
      };

      const result = await executeSetupPlan(plan);
      expect(result.success).toBe(true);

      const content = await readFile(join(subTempDir, '.gitignore'), 'utf8');
      expect(content).toBe(GITIGNORE_TEMPLATES[template]);
      await rm(subTempDir, { recursive: true, force: true });
    }
  });

  it('handles remote push failure gracefully', async () => {
    const nonExistentRemote = join(tmpdir(), 'non-existent-remote-' + Date.now());

    const plan: SetupPlan = {
      directory: tempDir,
      repositoryName: 'push-fail-project',
      createReadme: true,
      gitignoreTemplate: 'none',
      createInitialCommit: true,
      commitMessage: 'Initial commit',
      defaultBranch: 'main',
      remote: {
        name: 'origin',
        url: nonExistentRemote,
      },
      pushAfterSetup: true,
    };

    const result = await executeSetupPlan(plan);
    expect(result.success).toBe(false);
    expect(result.failedStep).toBe('Pushing to remote origin');
    expect(result.error).toBeTruthy();
  });
});
