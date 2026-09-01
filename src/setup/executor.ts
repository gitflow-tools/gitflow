import { writeFile } from 'fs/promises';
import { join } from 'path';
import { getGitignoreContent, GITIGNORE_TEMPLATE_LABELS } from '../templates/gitignore.js';
import { generateReadmeContent } from '../templates/readme.js';
import {
  initRepository,
  setDefaultBranch,
  stageFiles,
  createCommit,
  addRemote,
  pushToRemote,
} from '../git/client.js';
import { parseGitError } from '../utils/errors.js';
import { getFilesToCreate } from './plan.js';
import type { SetupPlan } from './types.js';

export interface ExecutionLogEntry {
  readonly message: string;
  readonly status: 'pending' | 'success' | 'failed' | 'info';
}

export type ExecutionProgressCallback = (
  entry: ExecutionLogEntry,
  allLogs: ExecutionLogEntry[],
) => void;

export interface SetupExecutionResult {
  readonly success: boolean;
  readonly logs: ExecutionLogEntry[];
  readonly failedStep?: string;
  readonly error?: string;
}

export async function executeSetupPlan(
  plan: SetupPlan,
  onProgress?: ExecutionProgressCallback,
): Promise<SetupExecutionResult> {
  const logs: ExecutionLogEntry[] = [];

  const addLog = (message: string, status: 'pending' | 'success' | 'failed' | 'info'): void => {
    const entry = { message, status };
    logs.push(entry);
    onProgress?.(entry, logs);
  };

  const updateLastLog = (message: string, status: 'success' | 'failed'): void => {
    if (logs.length > 0) {
      const lastIndex = logs.length - 1;
      const entry: ExecutionLogEntry = { message, status };
      logs[lastIndex] = entry;
      onProgress?.(entry, logs);
    } else {
      addLog(message, status);
    }
  };

  let currentStepName = '';

  try {
    // 1. README
    const shouldCreateReadme =
      plan.createReadme &&
      plan.existingReadmeAction !== 'keep' &&
      plan.existingReadmeAction !== 'skip';

    if (shouldCreateReadme) {
      currentStepName = 'Creating README.md';
      addLog('Creating README.md...', 'pending');
      const content = generateReadmeContent(plan.repositoryName, plan.readmeDescription);
      await writeFile(join(plan.directory, 'README.md'), content, 'utf8');
      updateLastLog('✓ Creating README.md', 'success');
    }

    // 2. .gitignore
    const shouldCreateGitignore =
      plan.gitignoreTemplate !== 'none' &&
      plan.existingGitignoreAction !== 'keep' &&
      plan.existingGitignoreAction !== 'skip';

    if (shouldCreateGitignore) {
      const label = GITIGNORE_TEMPLATE_LABELS[plan.gitignoreTemplate];
      currentStepName = `Creating .gitignore (${label})`;
      addLog(`Creating .gitignore (${label})...`, 'pending');
      const gitignoreContent = getGitignoreContent(plan.gitignoreTemplate);
      if (gitignoreContent != null) {
        await writeFile(join(plan.directory, '.gitignore'), gitignoreContent, 'utf8');
      }
      updateLastLog('✓ Creating .gitignore', 'success');
    }

    // 3. Git Init
    currentStepName = 'Initialising Git repository';
    addLog('Initialising Git repository...', 'pending');
    await initRepository(plan.directory);
    updateLastLog('✓ Initialising Git repository', 'success');

    // 4. Default branch
    const branch = plan.defaultBranch || 'main';
    currentStepName = `Setting branch to ${branch}`;
    addLog(`Setting branch to ${branch}...`, 'pending');
    await setDefaultBranch(plan.directory, branch);
    updateLastLog(`✓ Setting branch to ${branch}`, 'success');

    // 5. Stage & Commit
    if (plan.createInitialCommit) {
      const filesToStage = getFilesToCreate(plan);
      if (filesToStage.length > 0) {
        currentStepName = `Staging files (${filesToStage.join(', ')})`;
        addLog(`Staging files: ${filesToStage.join(', ')}...`, 'pending');
        await stageFiles(plan.directory, filesToStage);
        updateLastLog('✓ Staging files', 'success');
      }

      const commitMessage = plan.commitMessage?.trim() || 'Initial commit';
      currentStepName = 'Creating initial commit';
      addLog(`Creating initial commit: "${commitMessage}"...`, 'pending');
      await createCommit(plan.directory, commitMessage);
      updateLastLog('✓ Creating initial commit', 'success');
    }

    // 6. Remote
    if (plan.remote) {
      currentStepName = `Adding remote ${plan.remote.name}`;
      addLog(`Adding remote ${plan.remote.name}...`, 'pending');
      await addRemote(plan.directory, plan.remote.name, plan.remote.url);
      updateLastLog(`✓ Adding remote ${plan.remote.name}`, 'success');

      // 7. Push
      if (plan.pushAfterSetup) {
        currentStepName = `Pushing to remote ${plan.remote.name}`;
        addLog(`Pushing to remote ${plan.remote.name}...`, 'pending');
        await pushToRemote(plan.directory, plan.remote.name, branch);
        updateLastLog('✓ Pushing to remote', 'success');
      }
    }

    return { success: true, logs };
  } catch (err) {
    const parsed = parseGitError(err);
    const lastLog = logs[logs.length - 1];
    if (lastLog?.status === 'pending') {
      updateLastLog(`✗ ${currentStepName}`, 'failed');
    } else {
      addLog(`✗ ${currentStepName}`, 'failed');
    }

    return {
      success: false,
      logs,
      failedStep: currentStepName,
      error: parsed.message,
    };
  }
}
