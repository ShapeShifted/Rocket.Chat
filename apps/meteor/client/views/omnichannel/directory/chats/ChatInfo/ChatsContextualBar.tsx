import { useRoute, useRouteParameter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

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

const ChatsContextualBar = () => {
	const { t } = useTranslation();

	const context = useRouteParameter('context') as 'edit' | 'info' | undefined;
	const directoryRoute = useRoute(PATH);
	const liveRoute = useRoute('live');
	const room = useRoom();
	const { closeTab } = useRoomToolbox();

	const handleRoomEditBarCloseButtonClick = () => {
		directoryRoute.push({ id: room._id, tab: 'room-info' });
	};

	const handleOpenChat = () => {
		liveRoute.push({ id: room._id });
	};

	if (context === 'edit') {
		return (
			<ContextualbarDialog>
				<ContextualbarHeader>
					<ContextualbarIcon name='pencil' />
					<ContextualbarTitle>{t('edit-room')}</ContextualbarTitle>
					<ContextualbarClose onClick={closeTab} />
				</ContextualbarHeader>
				<RoomEdit id={room._id} onClose={handleRoomEditBarCloseButtonClick} />
			</ContextualbarDialog>
		);
	}

	return <ContactHistoryMessagesList chatId={room._id} onClose={closeTab} onOpenRoom={handleOpenChat} />;
};

export default ChatsContextualBar;
