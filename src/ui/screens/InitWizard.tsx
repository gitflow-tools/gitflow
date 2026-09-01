import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';
import { join, basename } from 'path';
import { Menu } from '../components/Menu.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js';
import type { MenuItem } from '../components/Menu.js';
import { GITIGNORE_TEMPLATE_LABELS, getGitignoreContent } from '../../templates/gitignore.js';
import type { GitignoreTemplate } from '../../templates/gitignore.js';
import { initRepository, stageFiles, createCommit, isGitRepository } from '../../git/client.js';
import { homeDirRelative, validateDirectory } from '../../utils/paths.js';
import { parseGitError } from '../../utils/errors.js';

type WizardPhase =
  | 'directory'
  | 'repoName'
  | 'readme'
  | 'gitignore'
  | 'commitMessage'
  | 'summary'
  | 'confirmOverwriteReadme'
  | 'confirmOverwriteGitignore'
  | 'executing'
  | 'success'
  | 'error';

interface WizardFormData {
  directory: string;
  repoName: string;
  createReadme: boolean;
  gitignoreTemplate: GitignoreTemplate;
  commitMessage: string;
}

interface ExistingFiles {
  readmeExists: boolean;
  gitignoreExists: boolean;
  overwriteReadme: boolean;
  overwriteGitignore: boolean;
}

interface WizardState {
  phase: WizardPhase;
  formData: Partial<WizardFormData>;
  inputValue: string;
  inputError: string | null;
  progressLog: string[];
  existingFiles: ExistingFiles;
  errorMessage: string | null;
  alreadyRepo: boolean;
}

const INITIAL_EXISTING_FILES: ExistingFiles = {
  readmeExists: false,
  gitignoreExists: false,
  overwriteReadme: false,
  overwriteGitignore: false,
};

interface InitWizardProps {
  cwd: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function InitWizard({ cwd, onComplete, onCancel }: InitWizardProps): React.ReactElement {
  const [state, setState] = useState<WizardState>({
    phase: 'directory',
    formData: {},
    inputValue: cwd,
    inputError: null,
    progressLog: [],
    existingFiles: INITIAL_EXISTING_FILES,
    errorMessage: null,
    alreadyRepo: false,
  });

  const executionStarted = useRef(false);

  useInput(
    (_input, key) => {
      if (!key.escape) return;
      handleEscape();
    },
    { isActive: state.phase !== 'executing' && state.phase !== 'success' },
  );

  const handleEscape = useCallback((): void => {
    setState(prev => {
      switch (prev.phase) {
        case 'directory':
          return prev;
        case 'repoName':
          return {
            ...prev,
            phase: 'directory',
            inputValue: prev.formData.directory ?? cwd,
            inputError: null,
          };
        case 'readme':
          return {
            ...prev,
            phase: 'repoName',
            inputValue: prev.formData.repoName ?? '',
            inputError: null,
          };
        case 'gitignore':
          return { ...prev, phase: 'readme', inputError: null };
        case 'commitMessage':
          return {
            ...prev,
            phase: 'gitignore',
            inputValue: prev.formData.commitMessage ?? 'Initial commit',
            inputError: null,
          };
        case 'summary':
        case 'confirmOverwriteReadme':
        case 'confirmOverwriteGitignore':
          return { ...prev, phase: 'summary', inputError: null };
        case 'error':
          return { ...prev, phase: 'summary', inputError: null };
        default:
          return prev;
      }
    });
  }, [cwd]);

  useEffect(() => {
    if (state.phase !== 'executing') return;
    if (executionStarted.current) return;
    executionStarted.current = true;

    const data = state.formData as WizardFormData;
    const { existingFiles } = state;

    const addProgress = (msg: string): void => {
      setState(prev => ({ ...prev, progressLog: [...prev.progressLog, msg] }));
    };

    const execute = async (): Promise<void> => {
      try {
        const filesToStage: string[] = [];
        const gitignoreContent = getGitignoreContent(data.gitignoreTemplate);

        if (data.createReadme && (!existingFiles.readmeExists || existingFiles.overwriteReadme)) {
          addProgress('Creating README.md...');
          const readmeContent = `# ${data.repoName}\n\nProject description goes here.\n`;
          await writeFile(join(data.directory, 'README.md'), readmeContent, 'utf8');
          addProgress('✓ README.md created');
          filesToStage.push('README.md');
        }

        if (
          gitignoreContent != null &&
          (!existingFiles.gitignoreExists || existingFiles.overwriteGitignore)
        ) {
          addProgress(
            `Creating .gitignore (${GITIGNORE_TEMPLATE_LABELS[data.gitignoreTemplate]})...`,
          );
          await writeFile(join(data.directory, '.gitignore'), gitignoreContent, 'utf8');
          addProgress('✓ .gitignore created');
          filesToStage.push('.gitignore');
        }

        addProgress('Initialising Git repository...');
        await initRepository(data.directory);
        addProgress('✓ Git repository initialised');

        if (filesToStage.length > 0) {
          addProgress(`Staging ${filesToStage.join(', ')}...`);
          await stageFiles(data.directory, filesToStage);
          addProgress(`✓ Staged ${filesToStage.join(', ')}`);
        }

        if (filesToStage.length > 0) {
          addProgress(`Creating commit: "${data.commitMessage}"...`);
          await createCommit(data.directory, data.commitMessage);
          addProgress('✓ Initial commit created');
        } else {
          addProgress('No files to commit — skipping initial commit');
        }

        setState(prev => ({ ...prev, phase: 'success' }));
      } catch (err) {
        const parsed = parseGitError(err);
        setState(prev => ({
          ...prev,
          phase: 'error',
          errorMessage: parsed.message,
          progressLog: [...prev.progressLog, `✗ Failed`],
        }));
      }
    };

    void execute();
  }, [state.phase]);

  const handleDirectorySubmit = useCallback(async (value: string): Promise<void> => {
    const validation = await validateDirectory(value);
    if (!validation.valid) {
      setState(prev => ({ ...prev, inputError: validation.error ?? 'Invalid directory' }));
      return;
    }

    const resolved = validation.resolvedPath ?? value;
    const alreadyRepo = await isGitRepository(resolved);

    setState(prev => ({
      ...prev,
      phase: 'repoName',
      formData: { ...prev.formData, directory: resolved },
      inputValue: basename(resolved),
      inputError: null,
      alreadyRepo,
    }));
  }, []);

  const handleRepoNameSubmit = useCallback((value: string): void => {
    if (!value.trim()) {
      setState(prev => ({ ...prev, inputError: 'Repository name cannot be empty' }));
      return;
    }
    setState(prev => ({
      ...prev,
      phase: 'readme',
      formData: { ...prev.formData, repoName: value.trim() },
      inputError: null,
    }));
  }, []);

  const handleReadmeSelect = useCallback((item: MenuItem): void => {
    const createReadme = item.value === 'yes';
    setState(prev => ({
      ...prev,
      phase: 'gitignore',
      formData: { ...prev.formData, createReadme },
    }));
  }, []);

  const handleGitignoreSelect = useCallback((item: MenuItem): void => {
    setState(prev => ({
      ...prev,
      phase: 'commitMessage',
      formData: { ...prev.formData, gitignoreTemplate: item.value as GitignoreTemplate },
      inputValue: 'Initial commit',
      inputError: null,
    }));
  }, []);

  const handleCommitMessageSubmit = useCallback((value: string): void => {
    if (!value.trim()) {
      setState(prev => ({ ...prev, inputError: 'Commit message cannot be empty' }));
      return;
    }
    setState(prev => ({
      ...prev,
      phase: 'summary',
      formData: { ...prev.formData, commitMessage: value.trim() },
      inputError: null,
    }));
  }, []);

  const handleSummarySelect = useCallback(
    (item: MenuItem): void => {
      if (item.value === 'back') {
        setState(prev => ({
          ...prev,
          phase: 'commitMessage',
          inputValue: prev.formData.commitMessage ?? 'Initial commit',
          inputError: null,
        }));
        return;
      }

      if (item.value === 'cancel') {
        onCancel();
        return;
      }

      if (item.value !== 'execute') return;

      const data = state.formData as WizardFormData;

      const readmeExists = data.createReadme && existsSync(join(data.directory, 'README.md'));
      const gitignoreExists =
        data.gitignoreTemplate !== 'none' && existsSync(join(data.directory, '.gitignore'));

      setState(prev => ({
        ...prev,
        existingFiles: {
          ...INITIAL_EXISTING_FILES,
          readmeExists,
          gitignoreExists,
        },
      }));

      if (readmeExists) {
        setState(prev => ({ ...prev, phase: 'confirmOverwriteReadme' }));
      } else if (gitignoreExists) {
        setState(prev => ({ ...prev, phase: 'confirmOverwriteGitignore' }));
      } else {
        setState(prev => ({ ...prev, phase: 'executing' }));
      }
    },
    [state.formData, onCancel],
  );

  const handleReadmeOverwriteConfirm = useCallback((): void => {
    setState(prev => ({
      ...prev,
      existingFiles: { ...prev.existingFiles, overwriteReadme: true },
    }));
    setState(prev => {
      if (prev.existingFiles.gitignoreExists) {
        return { ...prev, phase: 'confirmOverwriteGitignore' };
      }
      return { ...prev, phase: 'executing' };
    });
  }, []);

  const handleReadmeOverwriteCancel = useCallback((): void => {
    setState(prev => ({
      ...prev,
      existingFiles: { ...prev.existingFiles, overwriteReadme: false },
    }));
    setState(prev => {
      if (prev.existingFiles.gitignoreExists) {
        return { ...prev, phase: 'confirmOverwriteGitignore' };
      }
      return { ...prev, phase: 'executing' };
    });
  }, []);

  const handleGitignoreOverwriteConfirm = useCallback((): void => {
    setState(prev => ({
      ...prev,
      existingFiles: { ...prev.existingFiles, overwriteGitignore: true },
      phase: 'executing',
    }));
  }, []);

  const handleGitignoreOverwriteCancel = useCallback((): void => {
    setState(prev => ({
      ...prev,
      existingFiles: { ...prev.existingFiles, overwriteGitignore: false },
      phase: 'executing',
    }));
  }, []);

  const {
    phase,
    formData,
    inputValue,
    inputError,
    progressLog,
    errorMessage,
    alreadyRepo,
  } = state;

  return (
    <Box flexDirection="column" gap={1} paddingX={1}>
      <Text bold color="cyan">
        Initialise Repository
      </Text>

      {phase === 'directory' && (
        <Box flexDirection="column" gap={1}>
          <Text>
            Step 1 of 5 <Text dimColor>— Directory</Text>
          </Text>
          <Text dimColor>Enter the directory to initialise:</Text>
          <TextInput
            value={inputValue}
            onChange={value => setState(prev => ({ ...prev, inputValue: value, inputError: null }))}
            onSubmit={value => {
              void handleDirectorySubmit(value);
            }}
            placeholder={cwd}
          />
          {inputError != null && <Text color="red">✗ {inputError}</Text>}
          <Text dimColor>Press Enter to confirm · Escape to cancel</Text>
        </Box>
      )}

      {phase === 'repoName' && (
        <Box flexDirection="column" gap={1}>
          <Text>
            Step 2 of 5 <Text dimColor>— Repository Name</Text>
          </Text>
          {alreadyRepo && (
            <Text color="yellow">
              ⚠ This directory already contains a Git repository. Proceeding will reinitialise it.
            </Text>
          )}
          <Text dimColor>Enter a name for this repository:</Text>
          <TextInput
            value={inputValue}
            onChange={value => setState(prev => ({ ...prev, inputValue: value, inputError: null }))}
            onSubmit={handleRepoNameSubmit}
            placeholder="my-project"
          />
          {inputError != null && <Text color="red">✗ {inputError}</Text>}
          <Text dimColor>Press Enter to confirm · Escape to go back</Text>
        </Box>
      )}

      {phase === 'readme' && (
        <Box flexDirection="column" gap={1}>
          <Text>
            Step 3 of 5 <Text dimColor>— README</Text>
          </Text>
          <Text dimColor>Create a README.md?</Text>
          <Menu
            items={[
              { label: 'Yes', value: 'yes' },
              { label: 'No', value: 'no' },
            ]}
            onSelect={handleReadmeSelect}
          />
          <Text dimColor>Press Escape to go back</Text>
        </Box>
      )}

      {phase === 'gitignore' && (
        <Box flexDirection="column" gap={1}>
          <Text>
            Step 4 of 5 <Text dimColor>— .gitignore Template</Text>
          </Text>
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
            onSelect={handleGitignoreSelect}
          />
          <Text dimColor>Press Escape to go back</Text>
        </Box>
      )}

      {phase === 'commitMessage' && (
        <Box flexDirection="column" gap={1}>
          <Text>
            Step 5 of 5 <Text dimColor>— Initial Commit Message</Text>
          </Text>
          <Text dimColor>Enter the initial commit message:</Text>
          <TextInput
            value={inputValue}
            onChange={value => setState(prev => ({ ...prev, inputValue: value, inputError: null }))}
            onSubmit={handleCommitMessageSubmit}
            placeholder="Initial commit"
          />
          {inputError != null && <Text color="red">✗ {inputError}</Text>}
          <Text dimColor>Press Enter to confirm · Escape to go back</Text>
        </Box>
      )}

      {phase === 'summary' && (
        <SummaryView formData={formData as WizardFormData} onSelect={handleSummarySelect} />
      )}

      {phase === 'confirmOverwriteReadme' && (
        <ConfirmDialog
          message="README.md already exists. Overwrite it?"
          detail={`Found at: ${join(formData.directory ?? '', 'README.md')}`}
          onConfirm={handleReadmeOverwriteConfirm}
          onCancel={handleReadmeOverwriteCancel}
        />
      )}

      {phase === 'confirmOverwriteGitignore' && (
        <ConfirmDialog
          message=".gitignore already exists. Overwrite it?"
          detail={`Found at: ${join(formData.directory ?? '', '.gitignore')}`}
          onConfirm={handleGitignoreOverwriteConfirm}
          onCancel={handleGitignoreOverwriteCancel}
        />
      )}

      {phase === 'executing' && (
        <Box flexDirection="column" gap={1}>
          <Text bold>Executing setup...</Text>
          <Box flexDirection="column">
            {progressLog.map((line, i) => (
              <Text
                key={i}
                color={line.startsWith('✓') ? 'green' : line.startsWith('✗') ? 'red' : undefined}
              >
                {line}
              </Text>
            ))}
          </Box>
        </Box>
      )}

      {phase === 'success' && (
        <SuccessView
          directory={formData.directory ?? ''}
          progressLog={progressLog}
          onComplete={onComplete}
        />
      )}

      {phase === 'error' && (
        <ErrorView
          message={errorMessage ?? 'An unexpected error occurred'}
          progressLog={progressLog}
          onBack={() => setState(prev => ({ ...prev, phase: 'summary' }))}
          onCancel={onCancel}
        />
      )}
    </Box>
  );
}

interface SummaryViewProps {
  formData: WizardFormData;
  onSelect: (item: MenuItem) => void;
}

function SummaryView({ formData, onSelect }: SummaryViewProps): React.ReactElement {
  const gitignoreLabel = GITIGNORE_TEMPLATE_LABELS[formData.gitignoreTemplate];

  const actions: string[] = [];
  if (formData.createReadme) actions.push('Create README.md');
  if (formData.gitignoreTemplate !== 'none') actions.push(`Create .gitignore (${gitignoreLabel})`);
  actions.push('Initialise Git repository');
  if (formData.createReadme || formData.gitignoreTemplate !== 'none')
    actions.push('Stage generated files');
  actions.push(`Create initial commit: "${formData.commitMessage}"`);

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>Repository Setup Plan</Text>

      <Box flexDirection="column">
        <Text dimColor>Directory:</Text>
        <Text>{homeDirRelative(formData.directory)}</Text>
      </Box>

      <Box flexDirection="column">
        <Text dimColor>Repository:</Text>
        <Text>{formData.repoName}</Text>
      </Box>

      <Box flexDirection="column">
        <Text dimColor>Files:</Text>
        {formData.createReadme ? (
          <Text color="green">✓ README.md</Text>
        ) : (
          <Text dimColor>✗ README.md (skipped)</Text>
        )}
        {formData.gitignoreTemplate !== 'none' ? (
          <Text color="green">✓ .gitignore ({gitignoreLabel})</Text>
        ) : (
          <Text dimColor>✗ .gitignore (skipped)</Text>
        )}
      </Box>

      <Box flexDirection="column">
        <Text dimColor>Actions that will be performed:</Text>
        {actions.map((action, i) => (
          <Text key={i}>
            <Text dimColor>{i + 1}. </Text>
            {action}
          </Text>
        ))}
      </Box>

      <Menu
        items={[
          { label: 'Execute Setup', value: 'execute' },
          { label: 'Go Back', value: 'back' },
          { label: 'Cancel', value: 'cancel' },
        ]}
        onSelect={onSelect}
      />
    </Box>
  );
}

interface SuccessViewProps {
  directory: string;
  progressLog: string[];
  onComplete: () => void;
}

function SuccessView({ directory, progressLog, onComplete }: SuccessViewProps): React.ReactElement {
  useInput((_input, key) => {
    if (key.return || key.escape) {
      onComplete();
    }
  });

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="green">
        ✓ Repository setup complete!
      </Text>

      <Box flexDirection="column">
        <Text dimColor>Created in:</Text>
        <Text>{homeDirRelative(directory)}</Text>
      </Box>

      <Box flexDirection="column">
        {progressLog.map((line, i) => (
          <Text
            key={i}
            color={line.startsWith('✓') ? 'green' : line.startsWith('✗') ? 'red' : 'gray'}
          >
            {line}
          </Text>
        ))}
      </Box>

      <Text dimColor>Press Enter or Escape to return to the main menu</Text>
    </Box>
  );
}

interface ErrorViewProps {
  message: string;
  progressLog: string[];
  onBack: () => void;
  onCancel: () => void;
}

function ErrorView({ message, progressLog, onBack, onCancel }: ErrorViewProps): React.ReactElement {
  const isIdentityError = message.includes('git config --global');

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="red">
        ✗ Setup failed
      </Text>

      <Box flexDirection="column">
        {progressLog.map((line, i) => (
          <Text
            key={i}
            color={line.startsWith('✓') ? 'green' : line.startsWith('✗') ? 'red' : 'gray'}
          >
            {line}
          </Text>
        ))}
      </Box>

      {isIdentityError ? (
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor="yellow"
          paddingX={2}
          paddingY={1}
        >
          <Text bold color="yellow">
            Unable to create commit
          </Text>
          <Text>{message}</Text>
        </Box>
      ) : (
        <Box flexDirection="column" borderStyle="round" borderColor="red" paddingX={2} paddingY={1}>
          <Text color="red">{message}</Text>
        </Box>
      )}

      <Menu
        items={[
          { label: 'Go Back to Summary', value: 'back' },
          { label: 'Cancel', value: 'cancel' },
        ]}
        onSelect={item => {
          if (item.value === 'back') onBack();
          else onCancel();
        }}
      />
    </Box>
  );
}
