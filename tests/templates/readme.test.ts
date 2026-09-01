import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  generateReadmeContent,
  detectExistingReadme,
  COMMON_README_FILENAMES,
} from '../../src/templates/readme.js';

describe('generateReadmeContent', () => {
  it('generates a README with title and description', () => {
    const result = generateReadmeContent('my-project', 'A command line tool');
    expect(result).toBe('# my-project\n\nA command line tool\n');
  });

  it('generates a README with title only when description is omitted', () => {
    const result = generateReadmeContent('my-project');
    expect(result).toBe('# my-project\n');
  });

  it('generates a README with title only when description is whitespace', () => {
    const result = generateReadmeContent('my-project', '   ');
    expect(result).toBe('# my-project\n');
  });

  it('trims repository name and description', () => {
    const result = generateReadmeContent('  my-project  ', '  Awesome tool  ');
    expect(result).toBe('# my-project\n\nAwesome tool\n');
  });
});

describe('detectExistingReadme', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'gitflow-readme-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('returns null when no README file exists', async () => {
    const result = await detectExistingReadme(tempDir);
    expect(result).toBeNull();
  });

  it('detects README.md', async () => {
    await writeFile(join(tempDir, 'README.md'), '# Existing', 'utf8');
    const result = await detectExistingReadme(tempDir);
    expect(result).toBe('README.md');
  });

  it('detects README', async () => {
    await writeFile(join(tempDir, 'README'), 'Existing text', 'utf8');
    const result = await detectExistingReadme(tempDir);
    expect(result).toBe('README');
  });

  it('detects readme.md', async () => {
    await writeFile(join(tempDir, 'readme.md'), '# lower', 'utf8');
    const result = await detectExistingReadme(tempDir);
    expect(result).toBe('readme.md');
  });

  it('includes standard common readme filenames', () => {
    expect(COMMON_README_FILENAMES).toContain('README.md');
    expect(COMMON_README_FILENAMES).toContain('README');
    expect(COMMON_README_FILENAMES).toContain('readme.md');
  });
});
