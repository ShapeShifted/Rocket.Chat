import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

import { useSetupWizardContext } from './contexts/SetupWizardContext';
import AdminInfoStep from './steps/AdminInfoStep';
import CloudAccountConfirmation from './steps/CloudAccountConfirmation';
import OrganizationInfoStep from './steps/OrganizationInfoStep';
import RegisterServerStep from './steps/RegisterServerStep';

const hideLogoStyle = css`
	svg[viewBox='0 0 180 30'] {
		display: none !important;
	}
`;

const SetupWizardPage = (): ReactElement => {
	const { currentStep } = useSetupWizardContext();

	return (
		<Box className={hideLogoStyle}>
			{(() => {
				switch (currentStep) {
					case 1:
						return <AdminInfoStep />;
					case 2:
						return <OrganizationInfoStep />;
					case 3:
						return <RegisterServerStep />;
					case 4:
						return <CloudAccountConfirmation />;

					default:
						throw new Error('Wrong wizard step');
				}
			})()}
		</Box>
	);
};

export default SetupWizardPage;
