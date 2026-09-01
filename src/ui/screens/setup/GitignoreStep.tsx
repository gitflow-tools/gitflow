import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { Menu } from '../../components/Menu.js';
import type { MenuItem } from '../../components/Menu.js';
import { type GitignoreTemplate, detectExistingGitignore } from '../../../templates/gitignore.js';

export interface GitignoreStepData {
  gitignoreTemplate: GitignoreTemplate;
  existingGitignoreAction?: 'keep' | 'replace' | 'skip';
}

interface GitignoreStepProps {
  directory: string;
  initialData?: GitignoreStepData;
  onNext: (data: GitignoreStepData) => void;
  onBack: () => void;
}

type GitignorePhase = 'selection' | 'existingWarning';

export function GitignoreStep({
  directory,
  initialData,
  onNext,
  onBack,
}: GitignoreStepProps): React.ReactElement {
  const [phase, setPhase] = useState<GitignorePhase>('selection');
  const [selectedTemplate, setSelectedTemplate] = useState<GitignoreTemplate>(
    initialData?.gitignoreTemplate ?? 'none',
  );
  const [gitignoreExists, setGitignoreExists] = useState(false);

  useEffect(() => {
    void detectExistingGitignore(directory).then(exists => {
      setGitignoreExists(exists);
    });
  }, [directory]);

  useInput((_input, key) => {
    if (key.escape) {
      if (phase === 'existingWarning') {
        setPhase('selection');
      } else {
        onBack();
      }
    }
  });

  const handleTemplateSelect = (item: MenuItem): void => {
    const template = item.value as GitignoreTemplate;
    setSelectedTemplate(template);

    if (template === 'none') {
      onNext({ gitignoreTemplate: 'none', existingGitignoreAction: 'skip' });
      return;
    }

    if (gitignoreExists) {
      setPhase('existingWarning');
    } else {
      onNext({ gitignoreTemplate: template, existingGitignoreAction: 'replace' });
    }
  };

  const handleWarningSelect = (item: MenuItem): void => {
    if (item.value === 'keep') {
      onNext({ gitignoreTemplate: selectedTemplate, existingGitignoreAction: 'keep' });
    } else if (item.value === 'replace') {
      onNext({ gitignoreTemplate: selectedTemplate, existingGitignoreAction: 'replace' });
    } else if (item.value === 'cancel') {
      setPhase('selection');
    }
  };

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">
        Step 4/7 — .gitignore
      </Text>

      {phase === 'selection' && (
        <Box flexDirection="column" gap={1}>
          <Text dimColor>Select a .gitignore template:</Text>
          <Menu
            items={[
              { label: 'Node.js', value: 'nodejs' },
              { label: 'Python', value: 'python' },
              { label: 'Rust', value: 'rust' },
              { label: 'Go', value: 'go' },
              { label: 'Java', value: 'java' },
              { label: 'None', value: 'none' },
            ]}
            onSelect={handleTemplateSelect}
          />
          <Text dimColor>Press Escape to go back</Text>
        </Box>
      )}

      {phase === 'existingWarning' && (
        <Box flexDirection="column" gap={1}>
          <Text color="yellow" bold>
            ⚠ .gitignore already exists.
          </Text>
          <Text color="red">
            Replacing an existing .gitignore is a destructive action and will overwrite the file.
          </Text>
          <Menu
            items={[
              { label: 'Keep existing file', value: 'keep' },
              { label: 'Replace existing file (Overwrite)', value: 'replace' },
              { label: 'Cancel', value: 'cancel' },
            ]}
            onSelect={handleWarningSelect}
          />
          <Text dimColor>Press Escape to go back</Text>
        </Box>
      )}
    </Box>
  );
}
