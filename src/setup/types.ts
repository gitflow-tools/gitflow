import type { GitignoreTemplate } from '../templates/gitignore.js';
import type { RemoteConfig } from '../git/remote.js';

export interface SetupPlan {
  readonly directory: string;
  readonly repositoryName: string;
  readonly createReadme: boolean;
  readonly readmeDescription?: string;
  readonly existingReadmeAction?: 'keep' | 'replace' | 'skip';
  readonly existingReadmeFilename?: string;
  readonly gitignoreTemplate: GitignoreTemplate;
  readonly existingGitignoreAction?: 'keep' | 'replace' | 'skip';
  readonly createInitialCommit: boolean;
  readonly commitMessage?: string;
  readonly defaultBranch: string;
  readonly remote?: RemoteConfig;
  readonly pushAfterSetup: boolean;
}

export type SetupActionType = 'file' | 'git';

export interface SetupActionItem {
  readonly type: SetupActionType;
  readonly description: string;
  readonly command?: string;
}

export interface SetupSummarySection {
  readonly title: string;
  readonly lines: Array<{
    readonly label?: string;
    readonly value: string;
    readonly color?: 'green' | 'yellow' | 'red' | 'cyan' | 'gray';
    readonly icon?: string;
  }>;
}

export type ExecutionStepStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';

export interface ExecutionStepInfo {
  readonly id: string;
  readonly label: string;
  readonly status: ExecutionStepStatus;
  readonly error?: string;
}
