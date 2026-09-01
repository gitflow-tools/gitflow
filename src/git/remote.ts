export interface RemoteConfig {
  readonly name: string;
  readonly url: string;
}

const REMOTE_NAME_REGEX = /^[a-zA-Z0-9._-]+$/;

export function validateRemoteName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: 'Remote name cannot be empty' };
  }
  if (!REMOTE_NAME_REGEX.test(trimmed)) {
    return {
      valid: false,
      error:
        'Remote name contains invalid characters. Use letters, numbers, dots, hyphens, or underscores.',
    };
  }
  return { valid: true };
}

const URL_PATTERNS = [
  /^https?:\/\/[^\s/$.?#].[^\s]*$/i, // http/https
  /^git@[a-zA-Z0-9._-]+:[a-zA-Z0-9._~/-]+$/i, // git@host:path/repo.git
  /^ssh:\/\/[^\s]+$/i, // ssh://...
  /^git:\/\/[^\s]+$/i, // git://...
  /^file:\/\/[^\s]+$/i, // file://...
  /^\/[^\s]+$/i, // absolute path
];

export function validateRemoteUrl(url: string): { valid: boolean; error?: string } {
  const trimmed = url.trim();
  if (!trimmed) {
    return { valid: false, error: 'Remote URL cannot be empty' };
  }
  const isMatch = URL_PATTERNS.some(pattern => pattern.test(trimmed));
  if (!isMatch) {
    return {
      valid: false,
      error:
        'Invalid remote URL format. Example: https://github.com/user/repo.git or git@github.com:user/repo.git',
    };
  }
  return { valid: true };
}
