import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { homedir } from 'os';
import { join } from 'path';
import type * as FsPromises from 'fs/promises';
import { homeDirRelative, validateDirectory } from '../../src/utils/paths.js';

describe('homeDirRelative', () => {
  it('replaces the home directory prefix with ~', () => {
    const home = homedir();
    const p = join(home, 'Documents', 'project');
    expect(homeDirRelative(p)).toBe('~/Documents/project');
  });

  it('replaces an exact home directory path with ~', () => {
    const home = homedir();
    expect(homeDirRelative(home)).toBe('~');
  });

  it('leaves paths outside the home directory unchanged', () => {
    const p = '/tmp/some/path';
    expect(homeDirRelative(p)).toBe('/tmp/some/path');
  });

  it('does not replace partial matches', () => {
    const home = homedir();
    const p = home + 'extra/path';
    expect(homeDirRelative(p)).toBe(p);
  });
});

describe('validateDirectory', () => {
  beforeEach(() => {
    vi.mock('fs/promises', async () => {
      const actual = await vi.importActual<typeof FsPromises>('fs/promises');
      return { ...actual };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns valid=false for an empty string', async () => {
    const result = await validateDirectory('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('empty');
  });

  it('returns valid=false for a whitespace-only string', async () => {
    const result = await validateDirectory('   ');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('empty');
  });

  it('returns valid=true and resolvedPath for the current working directory', async () => {
    const result = await validateDirectory(process.cwd());
    expect(result.valid).toBe(true);
    expect(result.resolvedPath).toBeTruthy();
  });

  it('returns valid=false for a non-existent path', async () => {
    const result = await validateDirectory('/this/path/definitely/does/not/exist/xyz123');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('does not exist');
  });

  it('resolves relative paths to absolute paths', async () => {
    const result = await validateDirectory('.');
    expect(result.valid).toBe(true);
    expect(result.resolvedPath?.startsWith('/')).toBe(true);
  });
});
