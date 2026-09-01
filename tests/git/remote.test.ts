import { describe, it, expect } from 'vitest';
import { validateRemoteName, validateRemoteUrl } from '../../src/git/remote.js';

describe('validateRemoteName', () => {
  it('accepts valid remote names', () => {
    expect(validateRemoteName('origin').valid).toBe(true);
    expect(validateRemoteName('upstream').valid).toBe(true);
    expect(validateRemoteName('origin-1').valid).toBe(true);
    expect(validateRemoteName('origin_2').valid).toBe(true);
    expect(validateRemoteName('my.remote').valid).toBe(true);
  });

  it('rejects empty or whitespace names', () => {
    expect(validateRemoteName('').valid).toBe(false);
    expect(validateRemoteName('   ').valid).toBe(false);
  });

  it('rejects names with spaces or special characters', () => {
    expect(validateRemoteName('my remote').valid).toBe(false);
    expect(validateRemoteName('origin/main').valid).toBe(false);
    expect(validateRemoteName('origin:foo').valid).toBe(false);
    expect(validateRemoteName('origin@bar').valid).toBe(false);
  });
});

describe('validateRemoteUrl', () => {
  it('accepts HTTPS URLs', () => {
    expect(validateRemoteUrl('https://github.com/user/repo.git').valid).toBe(true);
    expect(validateRemoteUrl('https://gitlab.com/group/project').valid).toBe(true);
  });

  it('accepts SSH URLs', () => {
    expect(validateRemoteUrl('git@github.com:user/repo.git').valid).toBe(true);
    expect(validateRemoteUrl('ssh://git@server.com/path/to/repo.git').valid).toBe(true);
  });

  it('accepts git protocol URLs', () => {
    expect(validateRemoteUrl('git://github.com/user/repo.git').valid).toBe(true);
  });

  it('accepts file and absolute path URLs', () => {
    expect(validateRemoteUrl('file:///tmp/repo.git').valid).toBe(true);
    expect(validateRemoteUrl('/tmp/repo.git').valid).toBe(true);
  });

  it('rejects empty or whitespace URLs', () => {
    expect(validateRemoteUrl('').valid).toBe(false);
    expect(validateRemoteUrl('   ').valid).toBe(false);
  });

  it('rejects invalid URL formats', () => {
    expect(validateRemoteUrl('not-a-url').valid).toBe(false);
    expect(validateRemoteUrl('random text here').valid).toBe(false);
  });
});
