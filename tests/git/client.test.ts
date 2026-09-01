import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGit, mockSimpleGit } = vi.hoisted(() => {
  const mock = {
    raw: vi.fn().mockResolvedValue('git version 2.39.0\n'),
    revparse: vi.fn().mockResolvedValue('true'),
    status: vi.fn().mockResolvedValue({
      modified: ['src/index.ts'],
      renamed: [],
      not_added: ['untracked.txt'],
      staged: ['README.md'],
      isClean: () => false,
    }),
    getRemotes: vi.fn().mockResolvedValue([{ name: 'origin' }]),
    log: vi.fn().mockResolvedValue({
      latest: { hash: 'a1b2c3d4e5f67890', message: 'feat: initial commit' },
    }),
    init: vi.fn().mockResolvedValue(undefined),
    add: vi.fn().mockResolvedValue(undefined),
    commit: vi.fn().mockResolvedValue(undefined),
    addRemote: vi.fn().mockResolvedValue(undefined),
    push: vi.fn().mockResolvedValue(undefined),
  };

  const simple = vi.fn(() => mock);
  return { mockGit: mock, mockSimpleGit: simple };
});

vi.mock('simple-git', () => {
  return {
    simpleGit: mockSimpleGit,
    default: mockSimpleGit,
  };
});

import {
  isGitInstalled,
  isGitRepository,
  getRepoInfo,
  initRepository,
  stageFiles,
  createCommit,
  setDefaultBranch,
  addRemote,
  pushToRemote,
} from '../../src/git/client.js';

describe('isGitInstalled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when git raw --version succeeds', async () => {
    mockGit.raw.mockResolvedValue('git version 2.39.0\n');
    const result = await isGitInstalled();
    expect(result).toBe(true);
  });

  it('returns false when git raw throws', async () => {
    mockGit.raw.mockRejectedValue(new Error('git not found'));
    const result = await isGitInstalled();
    expect(result).toBe(false);
  });
});

describe('isGitRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when revparse --is-inside-work-tree returns "true"', async () => {
    mockGit.revparse.mockResolvedValue('true\n');
    const result = await isGitRepository('/some/repo');
    expect(result).toBe(true);
  });

  it('returns false when revparse returns "false"', async () => {
    mockGit.revparse.mockResolvedValue('false');
    const result = await isGitRepository('/not/a/repo');
    expect(result).toBe(false);
  });

  it('returns false when revparse throws (not in a git repo)', async () => {
    mockGit.revparse.mockRejectedValue(new Error('not a git repository'));
    const result = await isGitRepository('/not/a/repo');
    expect(result).toBe(false);
  });
});

describe('getRepoInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGit.revparse.mockImplementation((args: string[]) => {
      if (args.includes('--show-toplevel')) return Promise.resolve('/home/user/project\n');
      if (args.includes('--abbrev-ref')) return Promise.resolve('main\n');
      return Promise.resolve('');
    });
    mockGit.status.mockResolvedValue({
      modified: ['src/index.ts', 'src/utils.ts'],
      renamed: [],
      not_added: ['new-file.txt'],
      staged: ['README.md'],
      isClean: () => false,
    });
    mockGit.getRemotes.mockResolvedValue([{ name: 'origin' }, { name: 'upstream' }]);
    mockGit.log.mockResolvedValue({
      latest: { hash: 'a1b2c3d4e5f67890', message: 'feat: add feature' },
    });
  });

  it('returns correct root path', async () => {
    const info = await getRepoInfo('/home/user/project');
    expect(info.root).toBe('/home/user/project');
  });

  it('returns the current branch', async () => {
    const info = await getRepoInfo('/home/user/project');
    expect(info.branch).toBe('main');
  });

  it('returns correct file counts', async () => {
    const info = await getRepoInfo('/home/user/project');
    expect(info.fileStatus.modified).toBe(2);
    expect(info.fileStatus.untracked).toBe(1);
    expect(info.fileStatus.staged).toBe(1);
    expect(info.fileStatus.isClean).toBe(false);
  });

  it('returns remote names', async () => {
    const info = await getRepoInfo('/home/user/project');
    expect(info.remotes).toEqual(['origin', 'upstream']);
  });

  it('returns shortened commit hash and message', async () => {
    const info = await getRepoInfo('/home/user/project');
    expect(info.lastCommit?.hash).toBe('a1b2c3d');
    expect(info.lastCommit?.message).toBe('feat: add feature');
  });

  it('returns null lastCommit when no commits exist', async () => {
    mockGit.log.mockRejectedValue(new Error('does not have any commits yet'));
    const info = await getRepoInfo('/home/user/project');
    expect(info.lastCommit).toBeNull();
  });

  it('falls back to "HEAD (no commits)" when branch cannot be determined', async () => {
    mockGit.revparse.mockImplementation((args: string[]) => {
      if (args.includes('--show-toplevel')) return Promise.resolve('/home/user/project\n');
      if (args.includes('--abbrev-ref')) return Promise.reject(new Error('no commits'));
      return Promise.resolve('');
    });
    const info = await getRepoInfo('/home/user/project');
    expect(info.branch).toBe('HEAD (no commits)');
  });

  it('includes renamed files in modified count', async () => {
    mockGit.status.mockResolvedValue({
      modified: ['a.ts'],
      renamed: [{ from: 'b.ts', to: 'c.ts' }],
      not_added: [],
      staged: [],
      isClean: () => false,
    });
    const info = await getRepoInfo('/home/user/project');
    expect(info.fileStatus.modified).toBe(2);
  });
});

describe('initRepository', () => {
  it('calls git.init()', async () => {
    mockGit.init.mockResolvedValue(undefined);
    await initRepository('/some/dir');
    expect(mockSimpleGit).toHaveBeenCalledWith('/some/dir');
    expect(mockGit.init).toHaveBeenCalled();
  });
});

describe('stageFiles', () => {
  it('calls git.add() with the provided files', async () => {
    mockGit.add.mockResolvedValue(undefined);
    await stageFiles('/some/dir', ['README.md', '.gitignore']);
    expect(mockGit.add).toHaveBeenCalledWith(['README.md', '.gitignore']);
  });
});

describe('createCommit', () => {
  it('calls git.commit() with the provided message', async () => {
    mockGit.commit.mockResolvedValue(undefined);
    await createCommit('/some/dir', 'Initial commit');
    expect(mockGit.commit).toHaveBeenCalledWith('Initial commit');
  });
});

describe('setDefaultBranch', () => {
  it('calls git.raw to set branch to default main', async () => {
    mockGit.raw.mockResolvedValue('');
    await setDefaultBranch('/some/dir');
    expect(mockGit.raw).toHaveBeenCalledWith(['branch', '-M', 'main']);
  });

  it('calls git.raw to set branch to custom branch name', async () => {
    mockGit.raw.mockResolvedValue('');
    await setDefaultBranch('/some/dir', 'master');
    expect(mockGit.raw).toHaveBeenCalledWith(['branch', '-M', 'master']);
  });
});

describe('addRemote', () => {
  it('calls git.addRemote with name and URL', async () => {
    mockGit.addRemote.mockResolvedValue(undefined);
    await addRemote('/some/dir', 'origin', 'https://github.com/user/repo.git');
    expect(mockGit.addRemote).toHaveBeenCalledWith('origin', 'https://github.com/user/repo.git');
  });
});

describe('pushToRemote', () => {
  it('calls git.push with -u, remote and branch', async () => {
    mockGit.push.mockResolvedValue(undefined);
    await pushToRemote('/some/dir', 'origin', 'main');
    expect(mockGit.push).toHaveBeenCalledWith(['-u', 'origin', 'main']);
  });
});
