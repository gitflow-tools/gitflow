import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGit, mockSimpleGit } = vi.hoisted(() => {
  const mock = {
    raw: vi.fn(),
    revparse: vi.fn(),
    status: vi.fn().mockResolvedValue({
      modified: [],
      renamed: [],
      not_added: [],
      staged: [],
      isClean: () => true,
    }),
    getRemotes: vi.fn().mockResolvedValue([]),
    log: vi.fn().mockResolvedValue({ latest: null }),
    init: vi.fn(),
    add: vi.fn(),
    commit: vi.fn(),
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

import { detectRepository, getRepoStatus } from '../../src/git/repository.js';

describe('detectRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns isRepo=false when not in a git repo', async () => {
    mockGit.revparse.mockRejectedValue(new Error('not a git repo'));
    const result = await detectRepository('/not/a/repo');
    expect(result.isRepo).toBe(false);
    expect(result.root).toBeNull();
  });

  it('returns isRepo=true with root when in a valid repo', async () => {
    mockGit.revparse.mockImplementation((args: string[]) => {
      if (args.includes('--is-inside-work-tree')) return Promise.resolve('true');
      if (args.includes('--show-toplevel')) return Promise.resolve('/home/user/project\n');
      return Promise.resolve('');
    });

    const result = await detectRepository('/home/user/project/src');
    expect(result.isRepo).toBe(true);
    expect(result.root).toBe('/home/user/project');
  });

  it('returns isRepo=false when root cannot be determined', async () => {
    mockGit.revparse.mockImplementation((args: string[]) => {
      if (args.includes('--is-inside-work-tree')) return Promise.resolve('true');
      if (args.includes('--show-toplevel')) return Promise.reject(new Error('error'));
      return Promise.resolve('');
    });

    const result = await detectRepository('/some/dir');
    expect(result.isRepo).toBe(false);
    expect(result.root).toBeNull();
  });
});

describe('getRepoStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGit.revparse.mockImplementation((args: string[]) => {
      if (args.includes('--show-toplevel')) return Promise.resolve('/project\n');
      if (args.includes('--abbrev-ref')) return Promise.resolve('main\n');
      return Promise.resolve('');
    });
    mockGit.status.mockResolvedValue({
      modified: [],
      renamed: [],
      not_added: [],
      staged: [],
      isClean: () => true,
    });
    mockGit.getRemotes.mockResolvedValue([]);
    mockGit.log.mockResolvedValue({ latest: null });
  });

  it('returns repo info from getRepoInfo', async () => {
    const info = await getRepoStatus('/project');
    expect(info.branch).toBe('main');
    expect(info.root).toBe('/project');
  });
});
