import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { Menu } from '../../components/Menu.js';
import { ConfirmDialog } from '../../components/ConfirmDialog.js';
import { ErrorDisplay } from '../../components/ErrorDisplay.js';
import { ProgressIndicator } from '../../components/ProgressIndicator.js';
import {
  CONVENTIONAL_COMMIT_TYPES,
  formatConventionalCommit,
  validateCommitDescription,
  validateCustomCommitMessage,
  validateScope,
} from '../../../commit/conventional.js';
import { createCommit, getRepoInfo } from '../../../git/client.js';
import { toGitflowError, type GitflowError } from '../../../utils/errors.js';
import type { RepoInfo } from '../../../git/types.js';
import type { MenuItem } from '../../components/Menu.js';
import type { ExecutionLogEntry } from '../../../setup/executor.js';

interface CommitScreenProps {
  cwd: string;
  repoInfo: RepoInfo;
  onRefresh: () => Promise<void>;
  onBack: () => void;
  onGoToStaging: () => void;
  onViewStatus: () => void;
  onPushChanges: () => void;
}

type CommitStep =
  | 'styleSelect'
  | 'convType'
  | 'convScope'
  | 'convBreaking'
  | 'convDesc'
  | 'customMessage'
  | 'preview'
  | 'executing'
  | 'success'
  | 'error';

export function CommitScreen({
  cwd,
  repoInfo,
  onRefresh,
  onBack,
  onGoToStaging,
  onViewStatus,
  onPushChanges,
}: CommitScreenProps): React.ReactElement {
  const stagedFiles = repoInfo.workingTree.stagedFiles;

  const [step, setStep] = useState<CommitStep>('styleSelect');
  const [commitStyle, setCommitStyle] = useState<'conventional' | 'custom'>('conventional');
  const [selectedType, setSelectedType] = useState('feat');
  const [scopeInput, setScopeInput] = useState('');
  const [scopeError, setScopeError] = useState<string | null>(null);
  const [isBreaking, setIsBreaking] = useState(false);
  const [descInput, setDescInput] = useState('');
  const [descError, setDescError] = useState<string | null>(null);
  const [customMsgInput, setCustomMsgInput] = useState('');
  const [customMsgError, setCustomMsgError] = useState<string | null>(null);
  const [finalCommitMessage, setFinalCommitMessage] = useState('');
  const [logs, setLogs] = useState<ExecutionLogEntry[]>([]);
  const [createdCommitHash, setCreatedCommitHash] = useState('');
  const [error, setError] = useState<GitflowError | null>(null);

  // If no staged changes exist
  if (stagedFiles.length === 0 && step !== 'success' && step !== 'executing') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="yellow">
          No staged changes
        </Text>
        <Text>Stage one or more files before creating a commit.</Text>
        <Menu
          items={[
            { label: 'Go to staging', value: 'staging' },
            { label: 'Back', value: 'back' },
          ]}
          onSelect={item => {
            if (item.value === 'staging') {
              onGoToStaging();
            } else {
              onBack();
            }
          }}
          onCancel={onBack}
        />
      </Box>
    );
  }

  // Handle Style Selection
  if (step === 'styleSelect') {
    const styleItems: MenuItem[] = [
      { label: 'Conventional Commit', value: 'conventional' },
      { label: 'Custom Message', value: 'custom' },
      { label: 'Cancel', value: 'cancel' },
    ];

    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="cyan">
          Commit Changes
        </Text>

        <Box flexDirection="column">
          <Text dimColor>Staged files ({stagedFiles.length}):</Text>
          {stagedFiles.slice(0, 8).map(f => (
            <Text key={f.path} color="green">
              {'  ' + (f.indexStatus || 'M')} {f.path}
            </Text>
          ))}
          {stagedFiles.length > 8 && <Text dimColor> ...and {stagedFiles.length - 8} more</Text>}
        </Box>

        <Box marginTop={1} flexDirection="column">
          <Text bold>Choose commit style:</Text>
          <Menu
            items={styleItems}
            onSelect={item => {
              if (item.value === 'conventional') {
                setCommitStyle('conventional');
                setStep('convType');
              } else if (item.value === 'custom') {
                setCommitStyle('custom');
                setStep('customMessage');
              } else {
                onBack();
              }
            }}
            onCancel={onBack}
          />
        </Box>
      </Box>
    );
  }

  // Conventional: Select Type
  if (step === 'convType') {
    const typeItems: MenuItem[] = CONVENTIONAL_COMMIT_TYPES.map(t => ({
      label: `${t.type.padEnd(10)} ${t.description}`,
      value: t.type,
    }));
    typeItems.push({ label: 'Cancel', value: '__cancel__' });

    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="cyan">
          Select commit type:
        </Text>
        <Menu
          items={typeItems}
          onSelect={item => {
            if (item.value === '__cancel__') {
              setStep('styleSelect');
              return;
            }
            setSelectedType(item.value);
            setStep('convScope');
          }}
          onCancel={() => setStep('styleSelect')}
        />
      </Box>
    );
  }

  // Conventional: Input Scope
  if (step === 'convScope') {
    const handleScopeSubmit = (): void => {
      const val = validateScope(scopeInput);
      if (!val.valid) {
        setScopeError(val.error ?? 'Invalid scope');
        return;
      }
      setScopeError(null);
      setStep('convBreaking');
    };

    return (
      <ScopeInputStep
        type={selectedType}
        scopeInput={scopeInput}
        onChange={setScopeInput}
        onSubmit={handleScopeSubmit}
        onCancel={() => setStep('convType')}
        error={scopeError}
      />
    );
  }

  // Conventional: Breaking Change Prompt
  if (step === 'convBreaking') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="cyan">
          Breaking Changes
        </Text>
        <ConfirmDialog
          message="Is this a breaking change?"
          detail="A breaking change introduces incompatible API or structural modifications."
          onConfirm={() => {
            setIsBreaking(true);
            setStep('convDesc');
          }}
          onCancel={() => {
            setIsBreaking(false);
            setStep('convDesc');
          }}
        />
      </Box>
    );
  }

  // Conventional: Input Description
  if (step === 'convDesc') {
    const handleDescSubmit = (): void => {
      const val = validateCommitDescription(descInput);
      if (!val.valid) {
        setDescError(val.error ?? 'Invalid description');
        return;
      }
      setDescError(null);
      const msg = formatConventionalCommit({
        type: selectedType,
        scope: scopeInput.trim() ? scopeInput.trim() : undefined,
        isBreaking,
        description: descInput.trim(),
      });
      setFinalCommitMessage(msg);
      setStep('preview');
    };

    return (
      <DescriptionInputStep
        type={selectedType}
        scope={scopeInput}
        isBreaking={isBreaking}
        description={descInput}
        onChange={setDescInput}
        onSubmit={handleDescSubmit}
        onCancel={() => setStep('convBreaking')}
        error={descError}
      />
    );
  }

  // Custom Message Step
  if (step === 'customMessage') {
    const handleCustomSubmit = (): void => {
      const val = validateCustomCommitMessage(customMsgInput);
      if (!val.valid) {
        setCustomMsgError(val.error ?? 'Invalid message');
        return;
      }
      setCustomMsgError(null);
      setFinalCommitMessage(customMsgInput.trim());
      setStep('preview');
    };

    return (
      <CustomMessageInputStep
        message={customMsgInput}
        onChange={setCustomMsgInput}
        onSubmit={handleCustomSubmit}
        onCancel={() => setStep('styleSelect')}
        error={customMsgError}
      />
    );
  }

  // Preview Step
  if (step === 'preview') {
    const previewItems: MenuItem[] = [
      { label: 'Create Commit', value: 'commit' },
      { label: 'Edit', value: 'edit' },
      { label: 'Cancel', value: 'cancel' },
    ];

    const handleExecuteCommit = async (): Promise<void> => {
      setStep('executing');
      const currentLogs: ExecutionLogEntry[] = [
        { message: 'Validating staged changes...', status: 'pending' },
      ];
      setLogs([...currentLogs]);

      try {
        await new Promise(r => setTimeout(r, 100));
        currentLogs[0] = { message: 'Validating staged changes', status: 'success' };
        currentLogs.push({
          message: `Creating commit: "${finalCommitMessage}"...`,
          status: 'pending',
        });
        setLogs([...currentLogs]);

        await createCommit(cwd, finalCommitMessage);
        currentLogs[1] = { message: 'Creating commit', status: 'success' };
        setLogs([...currentLogs]);

        await onRefresh();
        const updatedInfo = await getRepoInfo(cwd);
        setCreatedCommitHash(updatedInfo.lastCommit?.hash ?? '');
        setStep('success');
      } catch (err) {
        const parsed = toGitflowError(err, 'Commit Failed');
        setError(parsed);
        setStep('error');
      }
    };

    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="cyan">
          Commit Preview
        </Text>

        <Box flexDirection="column">
          <Text dimColor>Message:</Text>
          <Text bold color="white">
            {finalCommitMessage}
          </Text>
        </Box>

        <Box flexDirection="column">
          <Text dimColor>Files ({stagedFiles.length}):</Text>
          {stagedFiles.slice(0, 6).map(f => (
            <Text key={f.path} color="green">
              {'  ' + (f.indexStatus || 'M')} {f.path}
            </Text>
          ))}
          {stagedFiles.length > 6 && <Text dimColor> ...and {stagedFiles.length - 6} more</Text>}
        </Box>

        <Box flexDirection="column">
          <Text dimColor>Command:</Text>
          <Text color="cyan">git commit -m &quot;{finalCommitMessage}&quot;</Text>
        </Box>

        <Menu
          items={previewItems}
          onSelect={item => {
            if (item.value === 'commit') {
              void handleExecuteCommit();
            } else if (item.value === 'edit') {
              if (commitStyle === 'conventional') {
                setStep('convDesc');
              } else {
                setStep('customMessage');
              }
            } else {
              onBack();
            }
          }}
        />
      </Box>
    );
  }

  // Executing Step
  if (step === 'executing') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="cyan">
          Creating commit...
        </Text>
        <ProgressIndicator logs={logs} />
      </Box>
    );
  }

  // Success Step
  if (step === 'success') {
    const successItems: MenuItem[] = [
      { label: 'Return to repository', value: 'back' },
      { label: 'View status', value: 'status' },
      { label: 'Push changes', value: 'push' },
    ];

    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="green">
          ✓ Commit created successfully.
        </Text>

        <Box marginY={1}>
          {createdCommitHash ? <Text color="yellow">{createdCommitHash} </Text> : null}
          <Text>{finalCommitMessage}</Text>
        </Box>

        <Menu
          items={successItems}
          onSelect={item => {
            if (item.value === 'back') {
              onBack();
            } else if (item.value === 'status') {
              onViewStatus();
            } else if (item.value === 'push') {
              onPushChanges();
            }
          }}
          onCancel={onBack}
        />
      </Box>
    );
  }

  // Error Step
  if (step === 'error' && error) {
    return (
      <Box flexDirection="column" gap={1}>
        <ErrorDisplay title={error.title} message={error.message} hint={error.suggestion} />
        <Box marginTop={1}>
          <Menu
            items={[
              { label: 'Try again', value: 'retry' },
              { label: 'Return to repository', value: 'back' },
            ]}
            onSelect={item => {
              if (item.value === 'retry') {
                setStep('preview');
              } else {
                onBack();
              }
            }}
            onCancel={onBack}
          />
        </Box>
      </Box>
    );
  }

  return <Box />;
}

// Subcomponents for input steps with useInput handlers for Esc cancellation
interface ScopeInputStepProps {
  type: string;
  scopeInput: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  error: string | null;
}

function ScopeInputStep({
  type,
  scopeInput,
  onChange,
  onSubmit,
  onCancel,
  error,
}: ScopeInputStepProps): React.ReactElement {
  useInput((_input, key) => {
    if (
      key.escape ||
      _input === '\u001b' ||
      _input === '\x1b' ||
      (_input != null && _input.charCodeAt(0) === 27)
    ) {
      onCancel();
    }
  });

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">
        Scope (optional):
      </Text>
      <Text dimColor>
        Specify the module or area affected (e.g. ui, api, config) or press Enter to skip.
      </Text>
      <Box>
        <Text color="cyan">{type}</Text>
        <Text>(</Text>
        <TextInput value={scopeInput} onChange={onChange} onSubmit={onSubmit} />
        <Text>): ...</Text>
      </Box>
      {error && <Text color="red">⚠ {error}</Text>}
      <Box marginTop={1}>
        <Text dimColor>Enter Continue · Esc Back</Text>
      </Box>
    </Box>
  );
}

interface DescriptionInputStepProps {
  type: string;
  scope: string;
  isBreaking: boolean;
  description: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  error: string | null;
}

function DescriptionInputStep({
  type,
  scope,
  isBreaking,
  description,
  onChange,
  onSubmit,
  onCancel,
  error,
}: DescriptionInputStepProps): React.ReactElement {
  useInput((_input, key) => {
    if (
      key.escape ||
      _input === '\u001b' ||
      _input === '\x1b' ||
      (_input != null && _input.charCodeAt(0) === 27)
    ) {
      onCancel();
    }
  });

  const prefix = scope.trim()
    ? `${type}(${scope.trim()})${isBreaking ? '!' : ''}: `
    : `${type}${isBreaking ? '!' : ''}: `;

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">
        Commit Description:
      </Text>
      <Text dimColor>
        Enter a clear, concise summary in the imperative mood (no ending period).
      </Text>
      <Box>
        <Text color="cyan">{prefix}</Text>
        <TextInput value={description} onChange={onChange} onSubmit={onSubmit} />
      </Box>
      {error && <Text color="red">⚠ {error}</Text>}
      <Box marginTop={1}>
        <Text dimColor>Enter Continue · Esc Back</Text>
      </Box>
    </Box>
  );
}

interface CustomMessageInputStepProps {
  message: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  error: string | null;
}

function CustomMessageInputStep({
  message,
  onChange,
  onSubmit,
  onCancel,
  error,
}: CustomMessageInputStepProps): React.ReactElement {
  useInput((_input, key) => {
    if (
      key.escape ||
      _input === '\u001b' ||
      _input === '\x1b' ||
      (_input != null && _input.charCodeAt(0) === 27)
    ) {
      onCancel();
    }
  });

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">
        Commit Message:
      </Text>
      <Text dimColor>Enter your commit message:</Text>
      <Box borderStyle="single" borderColor="cyan" paddingX={1}>
        <TextInput value={message} onChange={onChange} onSubmit={onSubmit} />
      </Box>
      {error && <Text color="red">⚠ {error}</Text>}
      <Box marginTop={1}>
        <Text dimColor>Enter Continue · Esc Cancel</Text>
      </Box>
    </Box>
  );
}
