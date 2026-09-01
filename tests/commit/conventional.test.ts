import { describe, it, expect } from 'vitest';
import {
  CONVENTIONAL_COMMIT_TYPES,
  formatConventionalCommit,
  validateCommitDescription,
  validateScope,
  validateCustomCommitMessage,
} from '../../src/commit/conventional.js';

describe('Conventional Commit Types', () => {
  it('includes all standard conventional commit types', () => {
    const types = CONVENTIONAL_COMMIT_TYPES.map(t => t.type);
    expect(types).toContain('feat');
    expect(types).toContain('fix');
    expect(types).toContain('docs');
    expect(types).toContain('style');
    expect(types).toContain('refactor');
    expect(types).toContain('test');
    expect(types).toContain('chore');
    expect(types).toContain('perf');
    expect(types).toContain('build');
    expect(types).toContain('ci');
    expect(types).toContain('revert');
  });

  it('provides descriptions for all types', () => {
    for (const t of CONVENTIONAL_COMMIT_TYPES) {
      expect(t.description.length).toBeGreaterThan(0);
    }
  });
});

describe('formatConventionalCommit', () => {
  it('formats type and description without scope', () => {
    const result = formatConventionalCommit({
      type: 'feat',
      description: 'add interactive staging workflow',
    });
    expect(result).toBe('feat: add interactive staging workflow');
  });

  it('formats type with scope and description', () => {
    const result = formatConventionalCommit({
      type: 'feat',
      scope: 'ui',
      description: 'add interactive staging workflow',
    });
    expect(result).toBe('feat(ui): add interactive staging workflow');
  });

  it('formats breaking change indicator with scope', () => {
    const result = formatConventionalCommit({
      type: 'feat',
      scope: 'api',
      isBreaking: true,
      description: 'change configuration format',
    });
    expect(result).toBe('feat(api)!: change configuration format');
  });

  it('formats breaking change indicator without scope', () => {
    const result = formatConventionalCommit({
      type: 'fix',
      isBreaking: true,
      description: 'drop deprecated endpoint',
    });
    expect(result).toBe('fix!: drop deprecated endpoint');
  });

  it('trims whitespace around type, scope, and description', () => {
    const result = formatConventionalCommit({
      type: '  docs  ',
      scope: '  readme  ',
      description: '  update install guide  ',
    });
    expect(result).toBe('docs(readme): update install guide');
  });
});

describe('validateCommitDescription', () => {
  it('accepts valid descriptions', () => {
    expect(validateCommitDescription('add new button component').valid).toBe(true);
    expect(validateCommitDescription('fix bug in parser').valid).toBe(true);
  });

  it('rejects empty descriptions', () => {
    const result = validateCommitDescription('   ');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Commit description cannot be empty');
  });

  it('rejects descriptions ending with a period', () => {
    const result = validateCommitDescription('add new button component.');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Commit description should not end with a period');
  });
});

describe('validateScope', () => {
  it('accepts empty or whitespace scope as valid (optional)', () => {
    expect(validateScope('').valid).toBe(true);
    expect(validateScope('   ').valid).toBe(true);
  });

  it('accepts alphanumeric scopes', () => {
    expect(validateScope('ui').valid).toBe(true);
    expect(validateScope('core-parser').valid).toBe(true);
    expect(validateScope('api_v2').valid).toBe(true);
  });

  it('rejects scopes with spaces or parentheses', () => {
    expect(validateScope('my scope').valid).toBe(false);
    expect(validateScope('scope(test)').valid).toBe(false);
  });
});

describe('validateCustomCommitMessage', () => {
  it('accepts non-empty commit messages', () => {
    expect(validateCustomCommitMessage('Initial setup of project').valid).toBe(true);
  });

  it('rejects empty commit messages', () => {
    const result = validateCustomCommitMessage('  ');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Commit message cannot be empty');
  });
});
