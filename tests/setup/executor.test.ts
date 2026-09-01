import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SetupPlan } from '../../src/setup/types.js';

const mockWriteFile = vi.fn().mockResolvedValue(undefined);
vi.mock('fs/promises', () => ({
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
}));

const mockInit = vi.fn().mockResolvedValue(undefined);
const mockSetBranch = vi.fn().mockResolvedValue(undefined);
const mockStage = vi.fn().mockResolvedValue(undefined);
const mockCommit = vi.fn().mockResolvedValue(undefined);
const mockAddRemote = vi.fn().mockResolvedValue(undefined);
const mockPush = vi.fn().mockResolvedValue(undefined);

vi.mock('../../src/git/client.js', () => ({
  initRepository: (...args: unknown[]) => mockInit(...args),
  setDefaultBranch: (...args: unknown[]) => mockSetBranch(...args),
  stageFiles: (...args: unknown[]) => mockStage(...args),
  createCommit: (...args: unknown[]) => mockCommit(...args),
  addRemote: (...args: unknown[]) => mockAddRemote(...args),
  pushToRemote: (...args: unknown[]) => mockPush(...args),
}));

import { executeSetupPlan, type ExecutionLogEntry } from '../../src/setup/executor.js';

describe('executeSetupPlan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const plan: SetupPlan = {
    directory: '/tmp/test-repo',
    repositoryName: 'test-repo',
    createReadme: true,
    readmeDescription: 'A test project',
    existingReadmeAction: 'replace',
    gitignoreTemplate: 'nodejs',
    existingGitignoreAction: 'replace',
    createInitialCommit: true,
    commitMessage: 'Initial commit',
    defaultBranch: 'main',
    remote: {
      name: 'origin',
      url: 'https://github.com/user/test-repo.git',
    },
    pushAfterSetup: true,
  };

  it('executes all steps in the plan successfully', async () => {
    const logs: ExecutionLogEntry[] = [];
    const onProgress = (entry: ExecutionLogEntry) => {
      logs.push(entry);
    };

    const result = await executeSetupPlan(plan, onProgress);

    expect(result.success).toBe(true);
    expect(mockWriteFile).toHaveBeenCalledTimes(2); // README and .gitignore
    expect(mockInit).toHaveBeenCalledWith('/tmp/test-repo');
    expect(mockSetBranch).toHaveBeenCalledWith('/tmp/test-repo', 'main');
    expect(mockStage).toHaveBeenCalledWith('/tmp/test-repo', ['README.md', '.gitignore']);
    expect(mockCommit).toHaveBeenCalledWith('/tmp/test-repo', 'Initial commit');
    expect(mockAddRemote).toHaveBeenCalledWith(
      '/tmp/test-repo',
      'origin',
      'https://github.com/user/test-repo.git',
    );
    expect(mockPush).toHaveBeenCalledWith('/tmp/test-repo', 'origin', 'main');

    expect(result.logs.every(l => l.status === 'success')).toBe(true);
  });

  it('stops and reports failure when a step throws', async () => {
    mockCommit.mockRejectedValue(new Error('author identity unknown'));

    const result = await executeSetupPlan(plan);

    expect(result.success).toBe(false);
    expect(result.failedStep).toBe('Creating initial commit');
    expect(result.error).toContain('user.name'); // Parsed into GitIdentityError instructions
    expect(mockAddRemote).not.toHaveBeenCalled(); // Stopped before remote step
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('skips file creation and push when not configured', async () => {
    const minimalPlan: SetupPlan = {
      directory: '/tmp/test-repo',
      repositoryName: 'test-repo',
      createReadme: false,
      gitignoreTemplate: 'none',
      createInitialCommit: false,
      defaultBranch: 'main',
      pushAfterSetup: false,
    };

    const result = await executeSetupPlan(minimalPlan);

    expect(result.success).toBe(true);
    expect(mockWriteFile).not.toHaveBeenCalled();
    expect(mockStage).not.toHaveBeenCalled();
    expect(mockCommit).not.toHaveBeenCalled();
    expect(mockAddRemote).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
