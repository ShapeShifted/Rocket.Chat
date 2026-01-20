import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

import { useSetupWizardContext } from './contexts/SetupWizardContext';
import AdminInfoStep from './steps/AdminInfoStep';
import CloudAccountConfirmation from './steps/CloudAccountConfirmation';
import OrganizationInfoStep from './steps/OrganizationInfoStep';
import RegisterServerStep from './steps/RegisterServerStep';

const logoStyle = css`
	div:has(> svg[viewBox='0 0 180 30']) {
		background-image: url('/images/logo/logo_text_dark.svg') !important;
		background-repeat: no-repeat !important;
		background-size: contain !important;
		background-position: left center !important;
		width: 200px !important;
		height: 45px !important;
		display: block !important;
	}

	svg[viewBox='0 0 180 30'] {
		display: none !important;
	}

	@media (max-width: 1440px) {
		div:has(> svg[viewBox='0 0 180 30']) {
			background-position: center !important;
			margin: 0 auto !important;
		}
	}
`;

const SetupWizardPage = (): ReactElement => {
	const { currentStep } = useSetupWizardContext();

	return (
		<Box className={logoStyle}>
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
