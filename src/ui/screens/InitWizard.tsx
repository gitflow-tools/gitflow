import React from 'react';
import { SetupWizard, type SetupWizardProps } from './setup/SetupWizard.js';

export type InitWizardProps = SetupWizardProps;

export function InitWizard(props: InitWizardProps): React.ReactElement {
  return <SetupWizard {...props} />;
}

export { SetupWizard };
