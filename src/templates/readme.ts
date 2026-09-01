import { access } from 'fs/promises';
import { constants } from 'fs';
import { join } from 'path';

export const COMMON_README_FILENAMES = ['README.md', 'README', 'readme.md'] as const;

export function generateReadmeContent(repoName: string, description?: string): string {
  const trimmedName = repoName.trim();
  const trimmedDesc = description?.trim();

  if (trimmedDesc) {
    return `# ${trimmedName}\n\n${trimmedDesc}\n`;
  }
  return `# ${trimmedName}\n`;
}

export async function detectExistingReadme(dir: string): Promise<string | null> {
  for (const filename of COMMON_README_FILENAMES) {
    try {
      await access(join(dir, filename), constants.F_OK);
      return filename;
    } catch {
      // File does not exist, check next
    }
  }
  return null;
}
