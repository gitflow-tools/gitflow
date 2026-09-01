import { validateRemoteName, validateRemoteUrl } from '../git/remote.js';
import { validateDirectory, expandTilde } from '../utils/paths.js';

export { validateRemoteName, validateRemoteUrl, validateDirectory, expandTilde };

export function validateRepositoryName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: 'Repository name cannot be empty' };
  }
  if (trimmed === '.' || trimmed === '..') {
    return { valid: false, error: 'Repository name cannot be "." or ".."' };
  }
  if (trimmed.length > 214) {
    return { valid: false, error: 'Repository name must be 214 characters or fewer' };
  }
  // Disallow control characters or slashes in repository name
  if (
    trimmed.includes('/') ||
    trimmed.includes('\\') ||
    [...trimmed].some(char => {
      const code = char.charCodeAt(0);
      return (code >= 0 && code <= 31) || code === 127;
    })
  ) {
    return { valid: false, error: 'Repository name contains invalid characters' };
  }
  return { valid: true };
}

export function validateCommitMessage(message: string): { valid: boolean; error?: string } {
  const trimmed = message.trim();
  if (!trimmed) {
    return { valid: false, error: 'Commit message cannot be empty' };
  }
  return { valid: true };
}
