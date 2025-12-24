import { useRoute, useRouteParameter } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import ChatInfo from './ChatInfo';
import RoomEdit from './RoomEdit';
import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarDialog,
} from '../../../../../components/Contextualbar';
import { useRoom } from '../../../../room/contexts/RoomContext';
import { useRoomToolbox } from '../../../../room/contexts/RoomToolboxContext';
import ContactHistoryMessagesList from '../../../contactHistory/MessageList/ContactHistoryMessagesList';

const PATH = 'live';

const HEADER_DATA = {
	info: { icon: 'info-circled', title: 'Room_Info' },
	edit: { icon: 'pencil', title: 'edit-room' },
	history: { icon: 'history', title: 'Conversation' },
} as const;

const ChatsContextualBar = () => {
	const { t } = useTranslation();

	const context = useRouteParameter('context') as 'edit' | 'info' | undefined;
	const tab = useRouteParameter('tab') as 'room-info' | undefined;
	const directoryRoute = useRoute(PATH);
	const room = useRoom();
	const { closeTab } = useRoomToolbox();

	const handleRoomEditBarCloseButtonClick = () => {
		directoryRoute.push({ id: room._id, tab: 'room-info' });
	};

	const handleOpenChat = () => {
		directoryRoute.push({ id: room._id, tab: 'room-info' });
	};

	const contextState = useMemo(() => {
		if (tab === 'room-info') {
			if (context === 'edit') {
				return 'edit';
			}
			return 'info';
		}
		if (context === 'info') {
			return 'history';
		}
		return 'history';
	}, [tab, context]);


	const { icon, title } = useMemo(() => HEADER_DATA[contextState] || HEADER_DATA.history, [contextState]);

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				<ContextualbarIcon name={icon} />
				<ContextualbarTitle>{t(title)}</ContextualbarTitle>
				<ContextualbarClose onClick={closeTab} />
			</ContextualbarHeader>
			{contextState === 'edit' && <RoomEdit id={room._id} onClose={handleRoomEditBarCloseButtonClick} />}
			{contextState === 'history' && <ContactHistoryMessagesList chatId={room._id} onClose={closeTab} onOpenRoom={handleOpenChat} />}
			{contextState === 'info' && <ChatInfo route={PATH} id={room._id} />}
		</ContextualbarDialog>
	);
};

export default ChatsContextualBar;
