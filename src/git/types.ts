export type FileChangeCategory =
  'staged' | 'modified' | 'untracked' | 'deleted' | 'renamed' | 'conflicted';

export interface FileChange {
  readonly path: string;
  readonly indexStatus: string;
  readonly workingTreeStatus: string;
  readonly category: FileChangeCategory;
  readonly oldPath?: string;
  readonly isStaged: boolean;
}

export interface WorkingTreeStatus {
  readonly files: ReadonlyArray<FileChange>;
  readonly stagedFiles: ReadonlyArray<FileChange>;
  readonly unstagedFiles: ReadonlyArray<FileChange>;
  readonly untrackedFiles: ReadonlyArray<FileChange>;
  readonly modifiedFiles: ReadonlyArray<FileChange>;
  readonly deletedFiles: ReadonlyArray<FileChange>;
  readonly renamedFiles: ReadonlyArray<FileChange>;
  readonly conflictedFiles: ReadonlyArray<FileChange>;
  readonly isClean: boolean;
}

export interface AheadBehind {
  readonly ahead: number;
  readonly behind: number;
}

export interface RemoteBranchInfo {
  readonly remote: string;
  readonly branch: string;
}

export interface PullResult {
  readonly alreadyUpToDate: boolean;
  readonly filesChanged: number;
  readonly insertions: number;
  readonly deletions: number;
  readonly hasConflict: boolean;
  readonly conflictedFiles?: ReadonlyArray<string>;
  readonly rawSummary?: string;
}

export interface PushResult {
  readonly success: boolean;
  readonly remote: string;
  readonly branch: string;
  readonly setUpstream?: boolean;
}

export interface RepoInfo {
  readonly root: string;
  readonly branch: string;
  readonly fileStatus: GitFileStatus;
  readonly workingTree: WorkingTreeStatus;
  readonly remotes: ReadonlyArray<string>;
  readonly upstream: RemoteBranchInfo | null;
  readonly aheadBehind: AheadBehind | null;
  readonly lastCommit: CommitInfo | null;
}

export interface GitFileStatus {
  readonly modified: number;
  readonly untracked: number;
  readonly staged: number;
  readonly isClean: boolean;
}

export interface CommitInfo {
  readonly hash: string;
  readonly message: string;
}

export interface RepoDetectionResult {
  readonly isRepo: boolean;
  readonly root: string | null;
}
