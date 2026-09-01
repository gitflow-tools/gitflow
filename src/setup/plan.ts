import { GITIGNORE_TEMPLATE_LABELS } from '../templates/gitignore.js';
import type { SetupPlan, SetupActionItem } from './types.js';

export function getFilesToCreate(plan: SetupPlan): string[] {
  const files: string[] = [];

  const shouldCreateReadme =
    plan.createReadme &&
    plan.existingReadmeAction !== 'keep' &&
    plan.existingReadmeAction !== 'skip';
  if (shouldCreateReadme) {
    files.push('README.md');
  }

  const shouldCreateGitignore =
    plan.gitignoreTemplate !== 'none' &&
    plan.existingGitignoreAction !== 'keep' &&
    plan.existingGitignoreAction !== 'skip';
  if (shouldCreateGitignore) {
    files.push('.gitignore');
  }

  return files;
}

export function getPlanActionItems(plan: SetupPlan): SetupActionItem[] {
  const items: SetupActionItem[] = [];

  const shouldCreateReadme =
    plan.createReadme &&
    plan.existingReadmeAction !== 'keep' &&
    plan.existingReadmeAction !== 'skip';
  if (shouldCreateReadme) {
    items.push({
      type: 'file',
      description: 'Create README.md',
    });
  }

  const shouldCreateGitignore =
    plan.gitignoreTemplate !== 'none' &&
    plan.existingGitignoreAction !== 'keep' &&
    plan.existingGitignoreAction !== 'skip';
  if (shouldCreateGitignore) {
    const label = GITIGNORE_TEMPLATE_LABELS[plan.gitignoreTemplate];
    items.push({
      type: 'file',
      description: `Create .gitignore (${label})`,
    });
  }

  // Git init
  items.push({
    type: 'git',
    description: 'Initialise Git repository',
    command: 'git init',
  });

  // Branch setup
  const branch = plan.defaultBranch || 'main';
  items.push({
    type: 'git',
    description: `Set default branch to ${branch}`,
    command: `git branch -M ${branch}`,
  });

  // Stage & commit
  const filesToStage = getFilesToCreate(plan);
  if (plan.createInitialCommit) {
    if (filesToStage.length > 0) {
      items.push({
        type: 'git',
        description: `Stage files: ${filesToStage.join(' ')}`,
        command: `git add ${filesToStage.join(' ')}`,
      });
    }
    const message = plan.commitMessage?.trim() || 'Initial commit';
    items.push({
      type: 'git',
      description: `Create initial commit: "${message}"`,
      command: `git commit -m "${message}"`,
    });
  }

  // Remote
  if (plan.remote) {
    items.push({
      type: 'git',
      description: `Add remote ${plan.remote.name}`,
      command: `git remote add ${plan.remote.name} ${plan.remote.url}`,
    });

    if (plan.pushAfterSetup) {
      items.push({
        type: 'git',
        description: `Push to remote ${plan.remote.name}`,
        command: `git push -u ${plan.remote.name} ${branch}`,
      });
    }
  }

  return items;
}
