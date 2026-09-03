import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { Panel } from '../../components/layout/Panel.js';
import { Menu } from '../../components/Menu.js';
import { ConfirmDialog } from '../../components/ConfirmDialog.js';
import { ErrorDisplay } from '../../components/ErrorDisplay.js';
import { ProgressIndicator } from '../../components/ProgressIndicator.js';
import { ScreenHeader } from '../../components/ScreenHeader.js';
import { CommandPanel } from '../../components/CommandPanel.js';
import { colors } from '../../theme/colors.js';
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

function CommitShell({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <Panel title="create commit" flexGrow={1} width="100%">
      {children}
    </Panel>
  );
}

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

  if (stagedFiles.length === 0 && step !== 'success' && step !== 'executing') {
    return (
      <CommitShell>
        <Text color={colors.yellow} bold>
          No staged changes
        </Text>
        <Text>Stage one or more files before creating a commit.</Text>
        <Box marginTop={1}>
          <Menu
            items={[
              { label: 'Go to staging', value: 'staging' },
            ]}
            onSelect={item => {
              if (item.value === 'staging') onGoToStaging();
            }}
            onCancel={() => onBack()}
          />
        </Box>
      </CommitShell>
    );
  }

  const StagedList = ({ max = 8 }: { max?: number }): React.ReactElement => (
    <Box flexDirection="column">
      {stagedFiles.slice(0, max).map(f => (
        <Box key={f.path} flexDirection="row">
          <Text color={colors.green}>{'  ' + (f.indexStatus || 'M')}</Text>
          <Text color={colors.white}> {f.path}</Text>
        </Box>
      ))}
      {stagedFiles.length > max && (
        <Text color={colors.grey}> …and {stagedFiles.length - max} more</Text>
      )}
    </Box>
  );

  if (step === 'styleSelect') {
    const styleItems: MenuItem[] = [
      { label: 'Conventional Commit', value: 'conventional' },
      { label: 'Custom Message', value: 'custom' },
      { label: 'Cancel', value: 'cancel' },
    ];

    return (
      <CommitShell>
        <ScreenHeader title="Commit Changes" subtitle={`${stagedFiles.length} staged`} />
        <StagedList />
        <Box marginTop={1}>
          <Text color={colors.pink} bold>
            Choose commit style:
          </Text>
          <Menu
            items={styleItems}
            onSelect={item => {
              if (item.value === 'conventional') {
                setCommitStyle('conventional');
                setStep('convType');
              } else if (item.value === 'custom') {
                setCommitStyle('custom');
                setStep('customMessage');
              } else onBack();
            }}
            onCancel={onBack}
          />
        </Box>
      </CommitShell>
    );
  }

  if (step === 'convType') {
    const typeItems: MenuItem[] = CONVENTIONAL_COMMIT_TYPES.map(t => ({
      label: `${t.type.padEnd(10)} ${t.description}`,
      value: t.type,
    }));
    typeItems.push({ label: 'Cancel', value: '__cancel__' });

    return (
      <CommitShell>
        <ScreenHeader title="Select commit type" />
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
      </CommitShell>
    );
  }

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
      <CommitShell>
        <ScopeInputStep
          type={selectedType}
          scopeInput={scopeInput}
          onChange={setScopeInput}
          onSubmit={handleScopeSubmit}
          onCancel={() => setStep('convType')}
          error={scopeError}
        />
      </CommitShell>
    );
  }

  if (step === 'convBreaking') {
    return (
      <CommitShell>
        <ScreenHeader title="Breaking Changes" />
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
      </CommitShell>
    );
  }

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
      <CommitShell>
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
      </CommitShell>
    );
  }

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
      <CommitShell>
        <CustomMessageInputStep
          message={customMsgInput}
          onChange={setCustomMsgInput}
          onSubmit={handleCustomSubmit}
          onCancel={() => setStep('styleSelect')}
          error={customMsgError}
        />
      </CommitShell>
    );
  }

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
        currentLogs.push({ message: 'Creating commit...', status: 'pending' });
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
      <CommitShell>
        <ScreenHeader title="Commit Preview" />
        <Box>
          <Text color={colors.grey}>message: </Text>
          <Text color={colors.white} bold>
            {finalCommitMessage}
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text color={colors.grey}>files ({stagedFiles.length}):</Text>
        </Box>
        <StagedList max={6} />
        <Box marginY={1}>
          <CommandPanel command={`git commit -m "${finalCommitMessage}"`} />
        </Box>
        <Menu
          items={previewItems}
          onSelect={item => {
            if (item.value === 'commit') void handleExecuteCommit();
            else if (item.value === 'edit') {
              if (commitStyle === 'conventional') setStep('convDesc');
              else setStep('customMessage');
            } else onBack();
          }}
        />
      </CommitShell>
    );
  }

  if (step === 'executing') {
    return (
      <CommitShell>
        <ScreenHeader title="Creating commit…" />
        <ProgressIndicator logs={logs} />
      </CommitShell>
    );
  }

  if (step === 'success') {
    const successItems: MenuItem[] = [
      { label: 'View status', value: 'status' },
      { label: 'Push changes', value: 'push' },
    ];

    return (
      <CommitShell>
        <Text color={colors.green} bold>
          ✓ Commit created successfully.
        </Text>
        <Box marginY={1}>
          {createdCommitHash ? <Text color={colors.yellow}>{createdCommitHash} </Text> : null}
          <Text>{finalCommitMessage}</Text>
        </Box>
        <Menu
          items={successItems}
          onSelect={item => {
            if (item.value === 'back') onBack();
            else if (item.value === 'status') onViewStatus();
            else if (item.value === 'push') onPushChanges();
          }}
          onCancel={onBack}
        />
      </CommitShell>
    );
  }

  if (step === 'error' && error) {
    return (
      <CommitShell>
        <ErrorDisplay title={error.title} message={error.message} hint={error.suggestion} />
        <Box marginTop={1}>
          <Menu
            items={[{ label: 'Try again', value: 'retry' }]}
            onSelect={item => {
              if (item.value === 'retry') setStep('preview');
            }}
            onCancel={onBack}
          />
        </Box>
      </CommitShell>
    );
  }

  return (
    <CommitShell>
      <Box />
    </CommitShell>
  );
}

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
  useInput((input, key) => {
    if (
      key.escape ||
      input === '\u001b' ||
      input === '\x1b' ||
      (input != null && input.charCodeAt(0) === 27)
    )
      onCancel();
  });

  return (
    <Box flexDirection="column" gap={1}>
      <Text color={colors.pink} bold>
        Scope (optional):
      </Text>
      <Text color={colors.grey}>
        Specify the module or area affected (e.g. ui, api, config) or press Enter to skip.
      </Text>
      <Box>
        <Text color={colors.coral}>{type}</Text>
        <Text>(</Text>
        <TextInput value={scopeInput} onChange={onChange} onSubmit={onSubmit} />
        <Text>): …</Text>
      </Box>
      {error && <Text color={colors.red}>⚠ {error}</Text>}
      <Text color={colors.grey}>Enter continue · Esc back</Text>
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
  useInput((input, key) => {
    if (
      key.escape ||
      input === '\u001b' ||
      input === '\x1b' ||
      (input != null && input.charCodeAt(0) === 27)
    )
      onCancel();
  });

  const prefix = scope.trim()
    ? `${type}(${scope.trim()})${isBreaking ? '!' : ''}: `
    : `${type}${isBreaking ? '!' : ''}: `;

  return (
    <Box flexDirection="column" gap={1}>
      <Text color={colors.pink} bold>
        Commit Description:
      </Text>
      <Text color={colors.grey}>
        Enter a clear, concise summary in the imperative mood (no ending period).
      </Text>
      <Box>
        <Text color={colors.coral}>{prefix}</Text>
        <TextInput value={description} onChange={onChange} onSubmit={onSubmit} />
      </Box>
      {error && <Text color={colors.red}>⚠ {error}</Text>}
      <Text color={colors.grey}>Enter continue · Esc back</Text>
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
  useInput((input, key) => {
    if (
      key.escape ||
      input === '\u001b' ||
      input === '\x1b' ||
      (input != null && input.charCodeAt(0) === 27)
    )
      onCancel();
  });

  return (
    <Box flexDirection="column" gap={1}>
      <Text color={colors.pink} bold>
        Commit Message:
      </Text>
      <Text color={colors.grey}>Enter your commit message:</Text>
      <Box borderStyle="single" borderColor={colors.coral} paddingX={1}>
        <TextInput value={message} onChange={onChange} onSubmit={onSubmit} />
      </Box>
      {error && <Text color={colors.red}>⚠ {error}</Text>}
      <Text color={colors.grey}>Enter continue · Esc cancel</Text>
    </Box>
  );
}
