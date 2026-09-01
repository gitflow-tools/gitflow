import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { Menu } from '../../components/Menu.js';
import type { MenuItem } from '../../components/Menu.js';
import { detectExistingReadme } from '../../../templates/readme.js';

export interface ReadmeStepData {
  createReadme: boolean;
  readmeDescription?: string;
  existingReadmeAction?: 'keep' | 'replace' | 'skip';
  existingReadmeFilename?: string;
}

interface ReadmeStepProps {
  directory: string;
  initialData?: ReadmeStepData;
  onNext: (data: ReadmeStepData) => void;
  onBack: () => void;
}

type ReadmePhase = 'choice' | 'existingWarning' | 'description';

export function ReadmeStep({
  directory,
  initialData,
  onNext,
  onBack,
}: ReadmeStepProps): React.ReactElement {
  const [phase, setPhase] = useState<ReadmePhase>(
    initialData?.createReadme && initialData.readmeDescription !== undefined
      ? 'description'
      : 'choice',
  );
  const [description, setDescription] = useState(initialData?.readmeDescription ?? '');
  const [existingFilename, setExistingFilename] = useState<string | null>(
    initialData?.existingReadmeFilename ?? null,
  );
  const [existingAction, setExistingAction] = useState<'keep' | 'replace' | 'skip' | undefined>(
    initialData?.existingReadmeAction,
  );

  useEffect(() => {
    void detectExistingReadme(directory).then(found => {
      setExistingFilename(found);
    });
  }, [directory]);

  useInput((_input, key) => {
    if (key.escape) {
      if (phase === 'description') {
        if (existingFilename) {
          setPhase('existingWarning');
        } else {
          setPhase('choice');
        }
      } else if (phase === 'existingWarning') {
        setPhase('choice');
      } else {
        onBack();
      }
    }
  });

  const handleChoiceSelect = (item: MenuItem): void => {
    if (item.value === 'no') {
      onNext({ createReadme: false, existingReadmeAction: 'skip' });
    } else {
      if (existingFilename) {
        setPhase('existingWarning');
      } else {
        setPhase('description');
      }
    }
  };

  const handleWarningSelect = (item: MenuItem): void => {
    if (item.value === 'keep') {
      onNext({
        createReadme: true,
        existingReadmeAction: 'keep',
        existingReadmeFilename: existingFilename ?? undefined,
      });
    } else if (item.value === 'replace') {
      setExistingAction('replace');
      setPhase('description');
    } else if (item.value === 'cancel') {
      onBack();
    }
  };

  const handleDescriptionSubmit = (val: string): void => {
    onNext({
      createReadme: true,
      readmeDescription: val.trim(),
      existingReadmeAction: existingAction ?? 'replace',
      existingReadmeFilename: existingFilename ?? undefined,
    });
  };

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">
        Step 3/7 — README
      </Text>

      {phase === 'choice' && (
        <Box flexDirection="column" gap={1}>
          <Text dimColor>Create a README?</Text>
          <Menu
            items={[
              { label: 'Yes', value: 'yes' },
              { label: 'No', value: 'no' },
            ]}
            onSelect={handleChoiceSelect}
          />
          <Text dimColor>Press Escape to go back</Text>
        </Box>
      )}

      {phase === 'existingWarning' && (
        <Box flexDirection="column" gap={1}>
          <Text color="yellow" bold>
            ⚠ {existingFilename} already exists.
          </Text>
          <Text color="red">
            Replacing an existing README is a destructive action and will overwrite the file.
          </Text>
          <Menu
            items={[
              { label: 'Keep existing README', value: 'keep' },
              { label: 'Replace existing README (Overwrite)', value: 'replace' },
              { label: 'Cancel', value: 'cancel' },
            ]}
            onSelect={handleWarningSelect}
          />
          <Text dimColor>Press Escape to go back</Text>
        </Box>
      )}

      {phase === 'description' && (
        <Box flexDirection="column" gap={1}>
          <Text dimColor>Project description (optional):</Text>
          <TextInput
            value={description}
            onChange={setDescription}
            onSubmit={handleDescriptionSubmit}
            placeholder="A command line tool for simplifying Git workflows."
          />
          <Text dimColor>Press Enter to continue · Escape to go back</Text>
        </Box>
      )}
    </Box>
  );
}
