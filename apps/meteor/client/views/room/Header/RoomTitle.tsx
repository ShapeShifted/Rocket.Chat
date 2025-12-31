import { isTeamRoom, type IRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useButtonPattern, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useDocumentTitle } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import HeaderIconWithRoom from './HeaderIconWithRoom';
import { HeaderTitle, HeaderTitleButton } from '../../../components/Header';
import { useRoomToolbox } from '../contexts/RoomToolboxContext';

const getSessionIdFromRoom = (room: any): string | undefined =>
	room?.livechatData?.sessionId ??
	room?.v?.token ??
	room?.visitor?.token ??
	room?.sessionId ??
	room?.v?.sessionId ??
	room?.visitor?.sessionId ??
	room?.livechatData?.sessionToken ??
	undefined;

const RoomTitle = ({ room }: { room: IRoom }): ReactElement => {
	useDocumentTitle(room.name, false);
	const { openTab } = useRoomToolbox();
	const { t } = useTranslation();

	const handleOpenRoomInfo = useEffectEvent(() => {
		if (isTeamRoom(room)) {
			return openTab('team-info');
		}

		switch (room.t) {
			case 'l':
				openTab('room-info');
				break;

			case 'v':
				openTab('voip-room-info');
				break;

			case 'd':
				(room.uids?.length ?? 0) > 2 ? openTab('user-info-group') : openTab('user-info');
				break;

			default:
				openTab('channel-settings');
				break;
		}
	});

	const buttonProps = useButtonPattern(handleOpenRoomInfo);

	const sessionId = getSessionIdFromRoom(room);

	return (
		<HeaderTitleButton {...buttonProps} mie={4}>
			<HeaderIconWithRoom room={room} />
			<HeaderTitle is='h1'>
				{room.name}
				{sessionId && (
					<Box is='span' fontScale='p2' color='default' style={{ fontWeight: 'bold', fontFamily: 'Inter, sans-serif' }}>
						{' '}
						Session ID: {sessionId || t('N/A')}
					</Box>
				)}
			</HeaderTitle>
		</HeaderTitleButton>
	);
};

export default RoomTitle;
