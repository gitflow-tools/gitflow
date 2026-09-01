import { isGitRepository, getRepoRoot, getRepoInfo } from './client.js';
import type { RepoInfo, RepoDetectionResult } from './types.js';

export async function detectRepository(cwd: string): Promise<RepoDetectionResult> {
  const isRepo = await isGitRepository(cwd);
  if (!isRepo) {
    return { isRepo: false, root: null };
  }
  try {
    const root = await getRepoRoot(cwd);
    return { isRepo: true, root };
  } catch {
    return { isRepo: false, root: null };
  }
}

export async function getRepoStatus(cwd: string): Promise<RepoInfo> {
  return getRepoInfo(cwd);
}

export type { RepoInfo, RepoDetectionResult };
