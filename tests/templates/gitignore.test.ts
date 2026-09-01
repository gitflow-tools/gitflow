import { describe, it, expect } from 'vitest';
import {
  GITIGNORE_TEMPLATES,
  GITIGNORE_TEMPLATE_LABELS,
  getGitignoreContent,
} from '../../src/templates/gitignore.js';
import type { GitignoreTemplate } from '../../src/templates/gitignore.js';

const ALL_TEMPLATES: Exclude<GitignoreTemplate, 'none'>[] = [
  'nodejs',
  'python',
  'rust',
  'go',
  'java',
];

describe('GITIGNORE_TEMPLATES', () => {
  it('has an entry for every non-none template', () => {
    for (const template of ALL_TEMPLATES) {
      expect(GITIGNORE_TEMPLATES[template]).toBeDefined();
    }
  });

  it('all templates are non-empty strings', () => {
    for (const template of ALL_TEMPLATES) {
      expect(typeof GITIGNORE_TEMPLATES[template]).toBe('string');
      expect(GITIGNORE_TEMPLATES[template].trim().length).toBeGreaterThan(0);
    }
  });
});

describe('GITIGNORE_TEMPLATE_LABELS', () => {
  it('has a label for every template including none', () => {
    const all: GitignoreTemplate[] = [...ALL_TEMPLATES, 'none'];
    for (const template of all) {
      expect(GITIGNORE_TEMPLATE_LABELS[template]).toBeDefined();
      expect(GITIGNORE_TEMPLATE_LABELS[template].length).toBeGreaterThan(0);
    }
  });
});

describe('getGitignoreContent', () => {
  it('returns null for "none"', () => {
    expect(getGitignoreContent('none')).toBeNull();
  });

  it('returns the template content for known templates', () => {
    for (const template of ALL_TEMPLATES) {
      const content = getGitignoreContent(template);
      expect(content).not.toBeNull();
      expect(typeof content).toBe('string');
    }
  });

  it('nodejs template contains node_modules', () => {
    const content = getGitignoreContent('nodejs');
    expect(content).toContain('node_modules');
  });

  it('python template contains __pycache__', () => {
    const content = getGitignoreContent('python');
    expect(content).toContain('__pycache__');
  });

  it('rust template contains target/', () => {
    const content = getGitignoreContent('rust');
    expect(content).toContain('target/');
  });

  it('go template contains *.exe', () => {
    const content = getGitignoreContent('go');
    expect(content).toContain('*.exe');
  });

  it('java template contains *.class', () => {
    const content = getGitignoreContent('java');
    expect(content).toContain('*.class');
  });

  it('all templates ignore .DS_Store', () => {
    for (const template of ALL_TEMPLATES) {
      const content = getGitignoreContent(template);
      expect(content).toContain('.DS_Store');
    }
  });

  it('all templates ignore .env', () => {
    for (const template of ALL_TEMPLATES) {
      const content = getGitignoreContent(template);
      expect(content).toContain('.env');
    }
  });
});
