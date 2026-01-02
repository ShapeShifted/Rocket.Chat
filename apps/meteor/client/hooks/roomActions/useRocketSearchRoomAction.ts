import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const CombinedSearchTab = lazy(() => import('../../views/room/contextualBar/CombinedSearchTab'));

export const useRocketSearchRoomAction = () => {
	return useMemo(
		(): RoomToolboxActionConfig => ({
			id: 'rocket-search',
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'live', 'team'],
			title: 'Search',
			icon: 'magnifier',
			tabComponent: CombinedSearchTab,
			order: 5,
		}),
		[],
	);
};
