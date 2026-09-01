import { describe, it, expect } from 'vitest';
import { getPlanActionItems, getFilesToCreate } from '../../src/setup/plan.js';
import type { SetupPlan } from '../../src/setup/types.js';

describe('Setup Plan Generation', () => {
  const fullPlan: SetupPlan = {
    directory: '/home/user/my-project',
    repositoryName: 'my-project',
    createReadme: true,
    readmeDescription: 'My project description',
    existingReadmeAction: 'replace',
    gitignoreTemplate: 'nodejs',
    existingGitignoreAction: 'replace',
    createInitialCommit: true,
    commitMessage: 'Initial commit',
    defaultBranch: 'main',
    remote: {
      name: 'origin',
      url: 'https://github.com/username/my-project.git',
    },
    pushAfterSetup: true,
  };

  it('generates files to create correctly for full plan', () => {
    const files = getFilesToCreate(fullPlan);
    expect(files).toEqual(['README.md', '.gitignore']);
  });

  it('generates complete action list for full plan matching requirements', () => {
    const actions = getPlanActionItems(fullPlan);

    expect(actions).toHaveLength(8);
    expect(actions[0]).toEqual({
      type: 'file',
      description: 'Create README.md',
    });
    expect(actions[1]).toEqual({
      type: 'file',
      description: 'Create .gitignore (Node.js)',
    });
    expect(actions[2]).toEqual({
      type: 'git',
      description: 'Initialise Git repository',
      command: 'git init',
    });
    expect(actions[3]).toEqual({
      type: 'git',
      description: 'Set default branch to main',
      command: 'git branch -M main',
    });
    expect(actions[4]).toEqual({
      type: 'git',
      description: 'Stage files: README.md .gitignore',
      command: 'git add README.md .gitignore',
    });
    expect(actions[5]).toEqual({
      type: 'git',
      description: 'Create initial commit: "Initial commit"',
      command: 'git commit -m "Initial commit"',
    });
    expect(actions[6]).toEqual({
      type: 'git',
      description: 'Add remote origin',
      command: 'git remote add origin https://github.com/username/my-project.git',
    });
    expect(actions[7]).toEqual({
      type: 'git',
      description: 'Push to remote origin',
      command: 'git push -u origin main',
    });
  });

  it('omits file creation and staging when files are kept existing', () => {
    const planWithKeptFiles: SetupPlan = {
      ...fullPlan,
      existingReadmeAction: 'keep',
      existingGitignoreAction: 'keep',
      remote: undefined,
      pushAfterSetup: false,
    };

    const files = getFilesToCreate(planWithKeptFiles);
    expect(files).toEqual([]);

    const actions = getPlanActionItems(planWithKeptFiles);
    expect(actions.some(a => a.type === 'file')).toBe(false);
    expect(actions.some(a => a.command?.startsWith('git add'))).toBe(false);
  });

  it('handles minimal plan with no files, no commit, no remote', () => {
    const minimalPlan: SetupPlan = {
      directory: '/home/user/my-project',
      repositoryName: 'my-project',
      createReadme: false,
      gitignoreTemplate: 'none',
      createInitialCommit: false,
      defaultBranch: 'main',
      pushAfterSetup: false,
    };

    const files = getFilesToCreate(minimalPlan);
    expect(files).toEqual([]);

    const actions = getPlanActionItems(minimalPlan);
    expect(actions).toEqual([
      {
        type: 'git',
        description: 'Initialise Git repository',
        command: 'git init',
      },
      {
        type: 'git',
        description: 'Set default branch to main',
        command: 'git branch -M main',
      },
    ]);
  });
});
