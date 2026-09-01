import { simpleGit } from 'simple-git';
import type { SimpleGit, StatusResult } from 'simple-git';
import type {
  RepoInfo,
  GitFileStatus,
  CommitInfo,
  WorkingTreeStatus,
  FileChange,
  FileChangeCategory,
  RemoteBranchInfo,
  AheadBehind,
  PushResult,
  PullResult,
} from './types.js';

function createClient(dir?: string): SimpleGit {
  return simpleGit(dir ?? process.cwd());
}

export async function isGitInstalled(): Promise<boolean> {
  try {
    const git = createClient();
    await git.raw(['--version']);
    return true;
  } catch {
    return false;
  }
}

export async function isGitRepository(dir: string): Promise<boolean> {
  try {
    const git = createClient(dir);
    const result = await git.revparse(['--is-inside-work-tree']);
    return result.trim() === 'true';
  } catch {
    return false;
  }
}

export async function getRepoRoot(dir: string): Promise<string> {
  const git = createClient(dir);
  const result = await git.revparse(['--show-toplevel']);
  return result.trim();
}

export function parseWorkingTreeStatus(
  statusResult: Partial<StatusResult> | undefined,
): WorkingTreeStatus {
  const fileMap = new Map<string, FileChange>();

  if (!statusResult) {
    return {
      files: [],
      stagedFiles: [],
      unstagedFiles: [],
      untrackedFiles: [],
      modifiedFiles: [],
      deletedFiles: [],
      renamedFiles: [],
      conflictedFiles: [],
      isClean: true,
    };
  }

  const conflictedSet = new Set(statusResult.conflicted ?? []);
  const stagedSet = new Set(statusResult.staged ?? []);
  const notAddedSet = new Set(statusResult.not_added ?? []);
  const deletedSet = new Set(statusResult.deleted ?? []);
  const modifiedSet = new Set(statusResult.modified ?? []);
  const renamedMap = new Map<string, string>();

  if (Array.isArray(statusResult.renamed)) {
    for (const r of statusResult.renamed) {
      if (typeof r === 'object' && r !== null && 'to' in r && 'from' in r) {
        renamedMap.set(r.to, r.from);
      }
    }
  }

  if (Array.isArray(statusResult.files)) {
    for (const file of statusResult.files) {
      const filePath = file.path;
      let category: FileChangeCategory = 'modified';
      const isStaged = file.index !== ' ' && file.index !== '?' && file.index !== 'U';

      if (conflictedSet.has(filePath) || file.index === 'U' || file.working_dir === 'U') {
        category = 'conflicted';
      } else if (isStaged) {
        category = 'staged';
      } else if (notAddedSet.has(filePath) || file.index === '?' || file.working_dir === '?') {
        category = 'untracked';
      } else if (deletedSet.has(filePath) || file.working_dir === 'D' || file.index === 'D') {
        category = 'deleted';
      } else if (renamedMap.has(filePath) || file.index === 'R' || file.working_dir === 'R') {
        category = 'renamed';
      } else {
        category = 'modified';
      }

      fileMap.set(filePath, {
        path: filePath,
        indexStatus: file.index,
        workingTreeStatus: file.working_dir,
        category,
        oldPath: renamedMap.get(filePath),
        isStaged,
      });
    }
  }

  // Synthesize entries for any items in not_added, modified, staged, deleted, renamed if not in files
  for (const untracked of notAddedSet) {
    if (!fileMap.has(untracked)) {
      fileMap.set(untracked, {
        path: untracked,
        indexStatus: '?',
        workingTreeStatus: '?',
        category: 'untracked',
        isStaged: false,
      });
    }
  }

  for (const staged of stagedSet) {
    if (!fileMap.has(staged)) {
      fileMap.set(staged, {
        path: staged,
        indexStatus: 'M',
        workingTreeStatus: ' ',
        category: 'staged',
        isStaged: true,
      });
    }
  }

  for (const mod of modifiedSet) {
    if (!fileMap.has(mod)) {
      fileMap.set(mod, {
        path: mod,
        indexStatus: ' ',
        workingTreeStatus: 'M',
        category: 'modified',
        isStaged: false,
      });
    }
  }

  for (const del of deletedSet) {
    if (!fileMap.has(del)) {
      fileMap.set(del, {
        path: del,
        indexStatus: ' ',
        workingTreeStatus: 'D',
        category: 'deleted',
        isStaged: false,
      });
    }
  }

  const allFiles = Array.from(fileMap.values());
  const stagedFiles = allFiles.filter(f => f.isStaged || f.category === 'staged');
  const unstagedFiles = allFiles.filter(f => !f.isStaged && f.category !== 'staged');
  const untrackedFiles = allFiles.filter(f => f.category === 'untracked');
  const modifiedFiles = allFiles.filter(f => f.category === 'modified');
  const deletedFiles = allFiles.filter(f => f.category === 'deleted');
  const renamedFiles = allFiles.filter(f => f.category === 'renamed');
  const conflictedFiles = allFiles.filter(f => f.category === 'conflicted');
  const isClean =
    typeof statusResult.isClean === 'function' ? statusResult.isClean() : allFiles.length === 0;

  return {
    files: allFiles,
    stagedFiles,
    unstagedFiles,
    untrackedFiles,
    modifiedFiles,
    deletedFiles,
    renamedFiles,
    conflictedFiles,
    isClean,
  };
}

export async function getWorkingTreeStatus(dir: string): Promise<WorkingTreeStatus> {
  const git = createClient(dir);
  const statusResult = await git.status();
  return parseWorkingTreeStatus(statusResult);
}

export async function getUpstream(dir: string, _branch?: string): Promise<RemoteBranchInfo | null> {
  const git = createClient(dir);
  try {
    const upstreamRef = (
      await git.raw(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'])
    ).trim();
    if (!upstreamRef || upstreamRef.includes('@{u}')) {
      return null;
    }
    const slashIdx = upstreamRef.indexOf('/');
    if (slashIdx === -1) {
      return null;
    }
    return {
      remote: upstreamRef.substring(0, slashIdx),
      branch: upstreamRef.substring(slashIdx + 1),
    };
  } catch {
    return null;
  }
}

export async function getAheadBehind(
  dir: string,
  branch?: string,
  upstream?: string,
): Promise<AheadBehind | null> {
  const git = createClient(dir);
  try {
    let upstreamRef = upstream;
    if (!upstreamRef) {
      const up = await getUpstream(dir, branch);
      if (!up) return null;
      upstreamRef = `${up.remote}/${up.branch}`;
    }

    const branchRef = branch ?? 'HEAD';
    const output = (
      await git.raw(['rev-list', '--left-right', '--count', `${branchRef}...${upstreamRef}`])
    ).trim();
    const parts = output.split(/\s+/).map(p => parseInt(p, 10));
    if (parts.length >= 2 && !isNaN(parts[0]!) && !isNaN(parts[1]!)) {
      return {
        ahead: parts[0]!,
        behind: parts[1]!,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getRepoInfo(dir: string): Promise<RepoInfo> {
  const git = createClient(dir);
  const root = await getRepoRoot(dir);

  let branch: string;
  try {
    branch = (await git.revparse(['--abbrev-ref', 'HEAD'])).trim();
  } catch {
    branch = 'HEAD (no commits)';
  }

  const statusResult = await git.status();
  const workingTree = parseWorkingTreeStatus(statusResult);
  const fileStatus: GitFileStatus = {
    modified: statusResult.modified.length + statusResult.renamed.length,
    untracked: statusResult.not_added.length,
    staged: statusResult.staged.length,
    isClean: statusResult.isClean(),
  };

  const remotesResult = await git.getRemotes(false);
  const remotes = remotesResult.map(r => r.name);

  let lastCommit: CommitInfo | null = null;
  try {
    const log = await git.log({ maxCount: 1 });
    if (log.latest != null) {
      lastCommit = {
        hash: log.latest.hash.substring(0, 7),
        message: log.latest.message,
      };
    }
  } catch {
    lastCommit = null;
  }

  const upstream = await getUpstream(dir, branch);
  const aheadBehind =
    upstream != null
      ? await getAheadBehind(dir, branch, `${upstream.remote}/${upstream.branch}`)
      : null;

  return { root, branch, fileStatus, workingTree, remotes, upstream, aheadBehind, lastCommit };
}

export async function initRepository(dir: string): Promise<void> {
  const git = createClient(dir);
  await git.init();
}

export async function stageFiles(dir: string, files: string[]): Promise<void> {
  if (files.length === 0) return;
  const git = createClient(dir);
  await git.add(files);
}

export async function unstageFiles(dir: string, files: string[]): Promise<void> {
  if (files.length === 0) return;
  const git = createClient(dir);
  try {
    await git.raw(['restore', '--staged', '--', ...files]);
  } catch {
    await git.reset(['HEAD', '--', ...files]);
  }
}

export async function stageAll(dir: string): Promise<void> {
  const git = createClient(dir);
  await git.add(['-A']);
}

export async function unstageAll(dir: string): Promise<void> {
  const git = createClient(dir);
  try {
    await git.raw(['restore', '--staged', '.']);
  } catch {
    await git.reset(['HEAD']);
  }
}

export interface DiffResult {
  readonly diff: string;
  readonly truncated: boolean;
  readonly isUntracked: boolean;
  readonly totalLines: number;
}

export async function getFileDiff(
  dir: string,
  filePath: string,
  staged: boolean = false,
  maxLines: number = 200,
): Promise<DiffResult> {
  const git = createClient(dir);
  const status = await git.status();

  if (status.not_added.includes(filePath)) {
    return {
      diff: '',
      truncated: false,
      isUntracked: true,
      totalLines: 0,
    };
  }

  let diffText = '';
  try {
    if (staged) {
      diffText = await git.raw(['diff', '--staged', '--', filePath]);
    } else {
      diffText = await git.raw(['diff', '--', filePath]);
    }
  } catch {
    diffText = '';
  }

  const lines = diffText.split('\n');
  const totalLines = lines.length;
  if (lines.length > maxLines) {
    return {
      diff: lines.slice(0, maxLines).join('\n'),
      truncated: true,
      isUntracked: false,
      totalLines,
    };
  }

  return {
    diff: diffText,
    truncated: false,
    isUntracked: false,
    totalLines,
  };
}

export async function createCommit(dir: string, message: string): Promise<void> {
  const git = createClient(dir);
  await git.commit(message);
}

export async function setDefaultBranch(dir: string, branch: string = 'main'): Promise<void> {
  const git = createClient(dir);
  await git.raw(['branch', '-M', branch]);
}

export async function addRemote(dir: string, name: string, url: string): Promise<void> {
  const git = createClient(dir);
  await git.addRemote(name, url);
}

export async function pushToRemote(
  dir: string,
  remote: string,
  branch: string = 'main',
): Promise<void> {
  const git = createClient(dir);
  await git.push(['-u', remote, branch]);
}

export async function push(
  dir: string,
  options: { remote: string; branch: string; setUpstream?: boolean },
): Promise<PushResult> {
  const git = createClient(dir);
  if (options.setUpstream) {
    await git.push(['-u', options.remote, options.branch]);
  } else {
    await git.push([options.remote, options.branch]);
  }
  return {
    success: true,
    remote: options.remote,
    branch: options.branch,
    setUpstream: options.setUpstream,
  };
}

export async function pull(
  dir: string,
  options?: { remote?: string; branch?: string },
): Promise<PullResult> {
  const git = createClient(dir);
  try {
    const pullResult = await git.pull(options?.remote, options?.branch, { '--no-rebase': null });
    const filesChanged = pullResult.files ? pullResult.files.length : 0;
    const insertions = pullResult.insertions?.changes || 0;
    const deletions = pullResult.deletions?.changes || 0;
    const isAlreadyUpToDate =
      filesChanged === 0 &&
      insertions === 0 &&
      deletions === 0 &&
      (pullResult.summary ? pullResult.summary.changes === 0 : true);

    return {
      alreadyUpToDate: isAlreadyUpToDate,
      filesChanged,
      insertions,
      deletions,
      hasConflict: false,
      rawSummary: pullResult.summary?.changes ? `${pullResult.summary.changes} changes` : undefined,
    };
  } catch (err) {
    try {
      const status = await git.status();
      if (
        status.conflicted.length > 0 ||
        (err instanceof Error &&
          (err.message.toLowerCase().includes('conflict') || err.message.includes('CONFLICT')))
      ) {
        return {
          alreadyUpToDate: false,
          filesChanged: 0,
          insertions: 0,
          deletions: 0,
          hasConflict: true,
          conflictedFiles: status.conflicted,
        };
      }
    } catch {
      // Ignore status fetch error and continue to throw original error
    }
    throw err;
  }
}
