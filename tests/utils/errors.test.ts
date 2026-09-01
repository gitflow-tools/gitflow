import { describe, it, expect } from 'vitest';
import {
  GitIdentityError,
  AppError,
  parseGitError,
  isGitIdentityError,
} from '../../src/utils/errors.js';

describe('GitIdentityError', () => {
  it('has the name "GitIdentityError"', () => {
    const err = new GitIdentityError();
    expect(err.name).toBe('GitIdentityError');
  });

  it('is an instance of Error', () => {
    const err = new GitIdentityError();
    expect(err).toBeInstanceOf(Error);
  });

  it('message contains git config instructions', () => {
    const err = new GitIdentityError();
    expect(err.message).toContain('git config --global user.name');
    expect(err.message).toContain('git config --global user.email');
  });
});

describe('AppError', () => {
  it('has the name "AppError"', () => {
    const err = new AppError('something failed');
    expect(err.name).toBe('AppError');
  });

  it('stores the original error', () => {
    const original = new Error('root cause');
    const err = new AppError('wrapped', original);
    expect(err.originalError).toBe(original);
  });

  it('is an instance of Error', () => {
    expect(new AppError('test')).toBeInstanceOf(Error);
  });
});

describe('parseGitError', () => {
  it('returns GitIdentityError when message mentions user.email', () => {
    const err = new Error('Please configure user.email before committing');
    const result = parseGitError(err);
    expect(result).toBeInstanceOf(GitIdentityError);
  });

  it('returns GitIdentityError when message mentions user.name', () => {
    const err = new Error('author identity unknown — set user.name');
    const result = parseGitError(err);
    expect(result).toBeInstanceOf(GitIdentityError);
  });

  it('returns GitIdentityError for "please tell me who you are"', () => {
    const err = new Error('Please tell me who you are.');
    const result = parseGitError(err);
    expect(result).toBeInstanceOf(GitIdentityError);
  });

  it('returns GitIdentityError for "author identity unknown"', () => {
    const err = new Error('Author identity unknown');
    const result = parseGitError(err);
    expect(result).toBeInstanceOf(GitIdentityError);
  });

  it('returns AppError for generic git errors', () => {
    const err = new Error('could not read from remote repository');
    const result = parseGitError(err);
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toContain('could not read from remote repository');
  });

  it('handles non-Error values', () => {
    const result = parseGitError('a string error');
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('a string error');
  });

  it('handles null gracefully', () => {
    const result = parseGitError(null);
    expect(result).toBeInstanceOf(AppError);
  });
});

describe('isGitIdentityError', () => {
  it('returns true for GitIdentityError', () => {
    expect(isGitIdentityError(new GitIdentityError())).toBe(true);
  });

  it('returns false for AppError', () => {
    expect(isGitIdentityError(new AppError('test'))).toBe(false);
  });

  it('returns false for a plain Error', () => {
    expect(isGitIdentityError(new Error('test'))).toBe(false);
  });

  it('returns false for non-Error values', () => {
    expect(isGitIdentityError('string')).toBe(false);
    expect(isGitIdentityError(null)).toBe(false);
    expect(isGitIdentityError(42)).toBe(false);
  });
});
