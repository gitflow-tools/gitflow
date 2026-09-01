export interface ConventionalCommitType {
  readonly type: string;
  readonly description: string;
}

export const CONVENTIONAL_COMMIT_TYPES: ReadonlyArray<ConventionalCommitType> = [
  { type: 'feat', description: 'A new feature' },
  { type: 'fix', description: 'A bug fix' },
  { type: 'docs', description: 'Documentation changes' },
  { type: 'style', description: 'Formatting and whitespace changes' },
  { type: 'refactor', description: 'Code restructuring without changing behaviour' },
  { type: 'test', description: 'Adding or updating tests' },
  { type: 'chore', description: 'Maintenance tasks and dependencies' },
  { type: 'perf', description: 'Performance improvements' },
  { type: 'build', description: 'Build system or dependency changes' },
  { type: 'ci', description: 'Continuous integration changes' },
  { type: 'revert', description: 'Reverting a previous change' },
];

export interface ConventionalCommitOptions {
  readonly type: string;
  readonly scope?: string;
  readonly isBreaking?: boolean;
  readonly description: string;
}

export function formatConventionalCommit(options: ConventionalCommitOptions): string {
  const type = options.type.trim();
  const scope = options.scope?.trim();
  const breaking = options.isBreaking === true ? '!' : '';
  const description = options.description.trim();

  if (scope) {
    return `${type}(${scope})${breaking}: ${description}`;
  }
  return `${type}${breaking}: ${description}`;
}

export function validateCommitDescription(desc: string): { valid: boolean; error?: string } {
  const trimmed = desc.trim();
  if (!trimmed) {
    return { valid: false, error: 'Commit description cannot be empty' };
  }
  if (trimmed.endsWith('.')) {
    return { valid: false, error: 'Commit description should not end with a period' };
  }
  return { valid: true };
}

export function validateScope(scope: string): { valid: boolean; error?: string } {
  const trimmed = scope.trim();
  if (!trimmed) {
    return { valid: true };
  }
  if (/[\s()]/.test(trimmed)) {
    return { valid: false, error: 'Scope cannot contain spaces or parentheses' };
  }
  return { valid: true };
}

export function validateCustomCommitMessage(msg: string): { valid: boolean; error?: string } {
  const trimmed = msg.trim();
  if (!trimmed) {
    return { valid: false, error: 'Commit message cannot be empty' };
  }
  return { valid: true };
}
