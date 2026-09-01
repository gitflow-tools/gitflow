import { homedir } from 'os';
import { resolve, normalize } from 'path';
import { access, stat } from 'fs/promises';
import { constants } from 'fs';

export function homeDirRelative(p: string): string {
  const home = homedir();
  if (p === home || p.startsWith(home + '/')) {
    return '~' + p.slice(home.length);
  }
  return p;
}

export interface DirValidationResult {
  readonly valid: boolean;
  readonly error?: string;
  readonly resolvedPath?: string;
}

export async function validateDirectory(dir: string): Promise<DirValidationResult> {
  if (!dir.trim()) {
    return { valid: false, error: 'Directory path cannot be empty' };
  }

  try {
    const resolved = resolve(normalize(dir));
    await access(resolved, constants.F_OK | constants.R_OK);
    const info = await stat(resolved);
    if (!info.isDirectory()) {
      return { valid: false, error: 'Path is not a directory' };
    }
    return { valid: true, resolvedPath: resolved };
  } catch (err) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === 'ENOENT') {
      return { valid: false, error: 'Directory does not exist' };
    }
    if (nodeErr.code === 'EACCES') {
      return { valid: false, error: 'Permission denied' };
    }
    if (err instanceof Error) {
      return { valid: false, error: err.message };
    }
    return { valid: false, error: 'Unknown error validating directory' };
  }
}
