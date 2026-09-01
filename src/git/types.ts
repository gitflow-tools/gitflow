export interface RepoInfo {
  readonly root: string;
  readonly branch: string;
  readonly fileStatus: GitFileStatus;
  readonly remotes: ReadonlyArray<string>;
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
