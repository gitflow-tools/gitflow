import { simpleGit } from 'simple-git';
import type { SimpleGit } from 'simple-git';
import type { RepoInfo, GitFileStatus, CommitInfo } from './types.js';

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

  return { root, branch, fileStatus, remotes, lastCommit };
}

export async function initRepository(dir: string): Promise<void> {
  const git = createClient(dir);
  await git.init();
}

export async function stageFiles(dir: string, files: string[]): Promise<void> {
  const git = createClient(dir);
  await git.add(files);
}

export async function createCommit(dir: string, message: string): Promise<void> {
  const git = createClient(dir);
  await git.commit(message);
}
