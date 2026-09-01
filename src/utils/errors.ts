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
