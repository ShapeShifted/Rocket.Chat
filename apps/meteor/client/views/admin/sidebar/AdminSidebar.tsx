import { useTranslation, useLayout, useCurrentRoutePath } from '@rocket.chat/ui-contexts';
import { memo } from 'react';

import AdminSidebarPages from './AdminSidebarPages';
import PlanTag from '../../../components/PlanTag';
import Sidebar from '../../../components/Sidebar';
import SettingsProvider from '../../../providers/SettingsProvider';
import { Box } from '@rocket.chat/fuselage';

const AdminSidebar = () => {
	const t = useTranslation();

	const { sidebar } = useLayout();

	const currentPath = useCurrentRoutePath();

	// TODO: uplift this provider
	return (
		<SettingsProvider>
			<Sidebar style={{ backgroundColor: '#2B2D3A' }}>
				<Sidebar.Header
					onClose={sidebar.close}
					title={
						<Box color='white'>
							{t('Administration')} <PlanTag />
						</Box>
					}
				/>
				<Sidebar.Content>
					<AdminSidebarPages currentPath={currentPath || ''} />
				</Sidebar.Content>
			</Sidebar>
		</SettingsProvider>
	);
};

export default memo(AdminSidebar);
