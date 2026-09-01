import { describe, it, expect } from 'vitest';
import { homedir } from 'os';
import {
  validateRepositoryName,
  validateCommitMessage,
  validateRemoteName,
  validateRemoteUrl,
  expandTilde,
} from '../../src/setup/validation.js';

describe('validateRepositoryName', () => {
  it('accepts valid repository names', () => {
    expect(validateRepositoryName('my-project').valid).toBe(true);
    expect(validateRepositoryName('gitflow_v2').valid).toBe(true);
    expect(validateRepositoryName('project.app').valid).toBe(true);
  });

  it('rejects empty or whitespace repository names', () => {
    expect(validateRepositoryName('').valid).toBe(false);
    expect(validateRepositoryName('   ').valid).toBe(false);
  });

  it('rejects "." and ".."', () => {
    expect(validateRepositoryName('.').valid).toBe(false);
    expect(validateRepositoryName('..').valid).toBe(false);
  });

  it('rejects names with slashes or invalid characters', () => {
    expect(validateRepositoryName('foo/bar').valid).toBe(false);
    expect(validateRepositoryName('foo\\bar').valid).toBe(false);
    expect(validateRepositoryName('foo\0bar').valid).toBe(false);
  });

  it('rejects overly long repository names', () => {
    const longName = 'a'.repeat(215);
    expect(validateRepositoryName(longName).valid).toBe(false);
  });
});

describe('validateCommitMessage', () => {
  it('accepts non-empty commit messages', () => {
    expect(validateCommitMessage('Initial commit').valid).toBe(true);
    expect(validateCommitMessage('feat: add setup wizard').valid).toBe(true);
  });

  it('rejects empty or whitespace commit messages', () => {
    expect(validateCommitMessage('').valid).toBe(false);
    expect(validateCommitMessage('   ').valid).toBe(false);
  });
});

describe('expandTilde', () => {
  it('expands ~ to home directory', () => {
    expect(expandTilde('~')).toBe(homedir());
  });

  it('expands ~/path to homedir/path', () => {
    expect(expandTilde('~/projects/app')).toBe(homedir() + '/projects/app');
  });

  it('leaves non-tilde paths unchanged', () => {
    expect(expandTilde('/var/log')).toBe('/var/log');
    expect(expandTilde('./local')).toBe('./local');
  });
});

describe('re-exported remote validations', () => {
  it('validates remote name and url', () => {
    expect(validateRemoteName('origin').valid).toBe(true);
    expect(validateRemoteUrl('https://github.com/user/repo.git').valid).toBe(true);
  });
});
