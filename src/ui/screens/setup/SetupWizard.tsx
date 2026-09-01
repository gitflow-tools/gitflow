import React, { useState } from 'react';
import { Box } from 'ink';
import { basename } from 'path';
import { DirectoryStep } from './DirectoryStep.js';
import { RepositoryDetailsStep } from './RepositoryDetailsStep.js';
import { ReadmeStep, type ReadmeStepData } from './ReadmeStep.js';
import { GitignoreStep, type GitignoreStepData } from './GitignoreStep.js';
import { CommitStep, type CommitStepData } from './CommitStep.js';
import { RemoteStep, type RemoteStepData } from './RemoteStep.js';
import { ReviewStep } from './ReviewStep.js';
import { ExecutionStep } from './ExecutionStep.js';
import type { SetupPlan } from '../../../setup/types.js';

export type WizardStepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'executing';

export interface SetupWizardProps {
  cwd: string;
  onComplete: () => void;
  onCancel: () => void;
}

interface WizardState {
  step: WizardStepNumber;
  directory: string;
  isAlreadyRepo: boolean;
  repoName: string;
  repoNameTouched: boolean;
  readmeData: ReadmeStepData;
  gitignoreData: GitignoreStepData;
  commitData: CommitStepData;
  remoteData: RemoteStepData;
}

export function SetupWizard({ cwd, onComplete, onCancel }: SetupWizardProps): React.ReactElement {
  const [state, setState] = useState<WizardState>({
    step: 1,
    directory: cwd,
    isAlreadyRepo: false,
    repoName: basename(cwd) || 'my-project',
    repoNameTouched: false,
    readmeData: { createReadme: true },
    gitignoreData: { gitignoreTemplate: 'nodejs' },
    commitData: { createInitialCommit: true, commitMessage: 'Initial commit' },
    remoteData: { addRemote: false, pushAfterSetup: false },
  });

  const handleDirectoryNext = (directory: string, isRepo: boolean): void => {
    setState(prev => ({
      ...prev,
      directory,
      isAlreadyRepo: isRepo,
      repoName: prev.repoNameTouched ? prev.repoName : basename(directory) || 'my-project',
      step: 2,
    }));
  };

  const handleRepoDetailsNext = (repoName: string): void => {
    setState(prev => ({
      ...prev,
      repoName,
      repoNameTouched: true,
      step: 3,
    }));
  };

  const handleReadmeNext = (readmeData: ReadmeStepData): void => {
    setState(prev => ({
      ...prev,
      readmeData,
      step: 4,
    }));
  };

  const handleGitignoreNext = (gitignoreData: GitignoreStepData): void => {
    setState(prev => ({
      ...prev,
      gitignoreData,
      step: 5,
    }));
  };

  const handleCommitNext = (commitData: CommitStepData): void => {
    setState(prev => ({
      ...prev,
      commitData,
      step: 6,
    }));
  };

  const handleRemoteNext = (remoteData: RemoteStepData): void => {
    setState(prev => ({
      ...prev,
      remoteData,
      step: 7,
    }));
  };

  const plan: SetupPlan = {
    directory: state.directory,
    repositoryName: state.repoName,
    createReadme: state.readmeData.createReadme,
    readmeDescription: state.readmeData.readmeDescription,
    existingReadmeAction: state.readmeData.existingReadmeAction,
    existingReadmeFilename: state.readmeData.existingReadmeFilename,
    gitignoreTemplate: state.gitignoreData.gitignoreTemplate,
    existingGitignoreAction: state.gitignoreData.existingGitignoreAction,
    createInitialCommit: state.commitData.createInitialCommit,
    commitMessage: state.commitData.commitMessage,
    defaultBranch: 'main',
    remote: state.remoteData.addRemote ? state.remoteData.remote : undefined,
    pushAfterSetup: state.remoteData.addRemote && state.remoteData.pushAfterSetup,
  };

  return (
    <Box flexDirection="column" paddingX={1}>
      {state.step === 1 && (
        <DirectoryStep
          initialDirectory={state.directory}
          onNext={handleDirectoryNext}
          onCancel={onCancel}
        />
      )}

      {state.step === 2 && (
        <RepositoryDetailsStep
          initialRepoName={state.repoName}
          isAlreadyRepo={state.isAlreadyRepo}
          onNext={handleRepoDetailsNext}
          onBack={() => setState(prev => ({ ...prev, step: 1 }))}
        />
      )}

      {state.step === 3 && (
        <ReadmeStep
          directory={state.directory}
          initialData={state.readmeData}
          onNext={handleReadmeNext}
          onBack={() => setState(prev => ({ ...prev, step: 2 }))}
        />
      )}

      {state.step === 4 && (
        <GitignoreStep
          directory={state.directory}
          initialData={state.gitignoreData}
          onNext={handleGitignoreNext}
          onBack={() => setState(prev => ({ ...prev, step: 3 }))}
        />
      )}

      {state.step === 5 && (
        <CommitStep
          initialData={state.commitData}
          onNext={handleCommitNext}
          onBack={() => setState(prev => ({ ...prev, step: 4 }))}
        />
      )}

      {state.step === 6 && (
        <RemoteStep
          initialData={state.remoteData}
          onNext={handleRemoteNext}
          onBack={() => setState(prev => ({ ...prev, step: 5 }))}
        />
      )}

      {state.step === 7 && (
        <ReviewStep
          plan={plan}
          onExecute={() => setState(prev => ({ ...prev, step: 'executing' }))}
          onBack={() => setState(prev => ({ ...prev, step: 6 }))}
          onCancel={onCancel}
        />
      )}

      {state.step === 'executing' && (
        <ExecutionStep
          plan={plan}
          onComplete={onComplete}
          onBackToReview={() => setState(prev => ({ ...prev, step: 7 }))}
          onCancel={onCancel}
        />
      )}
    </Box>
  );
}
