export interface GitflowError {
  readonly title: string;
  readonly message: string;
  readonly technicalDetails?: string;
  readonly suggestion?: string;
}

export class GitIdentityError extends Error {
  override readonly name = 'GitIdentityError';

  constructor() {
    super(
      'Git requires your user name and email to be configured.\n\n' +
        'Run:\n\n' +
        '  git config --global user.name "Your Name"\n' +
        '  git config --global user.email "you@example.com"\n\n' +
        'Then restart gitflow.',
    );
  }
}

export class AppError extends Error {
  override readonly name = 'AppError';

  constructor(
    message: string,
    public readonly originalError?: Error | undefined,
  ) {
    super(message);
  }
}

const GIT_IDENTITY_PATTERNS = [
  'user.email',
  'user.name',
  'please tell me who you are',
  'author identity unknown',
  'commit-email',
];

export function parseGitError(err: unknown): AppError | GitIdentityError {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (GIT_IDENTITY_PATTERNS.some(pattern => msg.includes(pattern))) {
      return new GitIdentityError();
    }
    return new AppError(err.message, err);
  }
  return new AppError(String(err));
}

export function isGitIdentityError(err: unknown): err is GitIdentityError {
  return err instanceof GitIdentityError;
}

export function toGitflowError(err: unknown, fallbackTitle = 'Git Operation Failed'): GitflowError {
  const rawMessage = err instanceof Error ? err.message : String(err ?? 'Unknown error');
  const lower = rawMessage.toLowerCase();

  if (GIT_IDENTITY_PATTERNS.some(pattern => lower.includes(pattern))) {
    return {
      title: 'Git Identity Not Configured',
      message: 'Git user identity is not configured.',
      technicalDetails: rawMessage,
      suggestion:
        'Run:\n  git config --global user.name "Your Name"\n  git config --global user.email "you@example.com"',
    };
  }

  if (
    lower.includes('authentication failed') ||
    lower.includes('permission denied (publickey)') ||
    lower.includes('could not read from remote repository') ||
    lower.includes('access denied') ||
    lower.includes('invalid credentials')
  ) {
    return {
      title: 'Authentication Failed',
      message: 'Your Git remote requires authentication.',
      technicalDetails: rawMessage,
      suggestion: 'Ensure you are signed in or have configured SSH or a credential manager.',
    };
  }

  if (
    lower.includes('fetch first') ||
    lower.includes('non-fast-forward') ||
    lower.includes('updates were rejected because the remote contains work') ||
    lower.includes('rejected')
  ) {
    return {
      title: 'Rejected Push',
      message: 'The remote contains changes that are not available locally.',
      technicalDetails: rawMessage,
      suggestion: 'Pull the latest changes before pushing.',
    };
  }

  if (
    lower.includes('conflict') ||
    lower.includes('fix conflicts') ||
    lower.includes('merge conflict')
  ) {
    return {
      title: 'Merge Conflict Detected',
      message: 'Git was unable to automatically merge some changes.',
      technicalDetails: rawMessage,
      suggestion: 'Resolve the conflicts manually, then use Git to complete the merge.',
    };
  }

  if (
    lower.includes('local changes to the following files would be overwritten') ||
    lower.includes('your local changes') ||
    lower.includes('please commit your changes or stash them')
  ) {
    return {
      title: 'Local Changes Conflict',
      message: 'Your local changes would be overwritten by pull.',
      technicalDetails: rawMessage,
      suggestion: 'Stage or commit your changes before pulling.',
    };
  }

  if (lower.includes('no upstream branch') || lower.includes('has no upstream branch')) {
    return {
      title: 'No Upstream Branch',
      message: 'The current branch has no upstream branch configured.',
      technicalDetails: rawMessage,
      suggestion: 'Push with -u to set an upstream tracking branch.',
    };
  }

  return {
    title: fallbackTitle,
    message: rawMessage,
    technicalDetails: rawMessage,
  };
}
