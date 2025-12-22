import type { IOmnichannelRoomWithDepartment } from '@rocket.chat/core-typings';
import { Tag, Box } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { usePermission, useRoute } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { GenericTableCell, GenericTableRow } from '../../../../../components/GenericTable';
import { OmnichannelRoomIcon } from '../../../../../components/RoomIcon/OmnichannelRoomIcon';
import { useTimeFromNow } from '../../../../../hooks/useTimeFromNow';
import OmnichannelVerificationTag from '../../../components/OmnichannelVerificationTag';
import RoomActivityIcon from '../../../components/RoomActivityIcon';
import RemoveChatButton from '../../../currentChats/RemoveChatButton';
import { useOmnichannelPriorities } from '../../../hooks/useOmnichannelPriorities';
import { useOmnichannelSource } from '../../../hooks/useOmnichannelSource';
import { PriorityIcon } from '../../../priorities/PriorityIcon';

const ChatsTableRow = (room: IOmnichannelRoomWithDepartment & { sessionId?: string }) => {
	const { t } = useTranslation();
	const { _id, fname, tags, servedBy, ts, department, open, priorityWeight, lm, onHold, source, verified, sessionId } = room as any;
	const { enabled: isPriorityEnabled } = useOmnichannelPriorities();
	const getTimeFromNow = useTimeFromNow(true);

	const formatDate = (date?: string | Date | number): string => {
		if (!date) {
			return '-';
		}
		try {
			return new Date(date).toLocaleString();
		} catch {
			return String(date);
		}
	};
	const { getSourceLabel } = useOmnichannelSource();

	const canRemoveClosedChats = usePermission('remove-closed-livechat-room');
	const directoryRoute = useRoute('omnichannel-directory');

	const getStatusText = (open = false, onHold = false): string => {
		if (!open) {
			return t('Closed');
		}

		if (open && !servedBy) {
			return t('Queued');
		}

		return onHold ? t('On_Hold_Chats') : t('Room_Status_Open');
	};

	const onRowClick = useEffectEvent((id: string) =>
		directoryRoute.push({
			tab: 'chats',
			context: 'info',
			id,
		}),
	);

	return (
		<GenericTableRow key={_id} tabIndex={0} role='link' onClick={() => onRowClick(_id)} action qa-user-id={_id}>
			<GenericTableCell style={{ color: '#000' }} withTruncatedText>
				<Box display='flex' flexDirection='column'>
					<Box withTruncatedText>{fname}</Box>
					{tags && (
						<Box style={{ color: '#000' }} display='flex' flex-direction='row'>
							{tags.map((tag: string) => (
								<Box mbs={4} mie={4} withTruncatedText overflow={tag.length > 10 ? 'hidden' : 'visible'} key={tag}>
									<Tag style={{ display: 'inline', color: '#000' }} disabled>
										{tag}
									</Tag>
								</Box>
							))}
						</Box>
					)}
				</Box>
			</GenericTableCell>
			<GenericTableCell style={{ color: '#000' }} withTruncatedText>{sessionId ?? '-'}</GenericTableCell>
		{isPriorityEnabled && (
					<GenericTableCell style={{ color: '#000' }}>
					<PriorityIcon level={priorityWeight} />
				</GenericTableCell>
			)}
			<GenericTableCell style={{ color: '#000' }} withTruncatedText>
				<Box display='flex' alignItems='center'>
					<OmnichannelRoomIcon size='x20' source={source} />
					<Box mis={8}>{getSourceLabel(source)}</Box>
				</Box>
			</GenericTableCell>
			<GenericTableCell style={{ color: '#000' }} withTruncatedText>{servedBy?.username}</GenericTableCell>
			<GenericTableCell style={{ color: '#000' }}>
				<Box display='flex'>
					<OmnichannelVerificationTag verified={verified} />
				</Box>
			</GenericTableCell>
			<GenericTableCell style={{ color: '#000' }} withTruncatedText>{department?.name}</GenericTableCell>
			<GenericTableCell style={{ color: '#000' }} withTruncatedText>{formatDate(ts)}</GenericTableCell>
			<GenericTableCell style={{ color: '#000' }} withTruncatedText>{getTimeFromNow(lm)}</GenericTableCell>
			<GenericTableCell style={{ color: '#000' }} withTruncatedText>
				<RoomActivityIcon room={room} />
				{getStatusText(open, onHold)}
			</GenericTableCell>
			{canRemoveClosedChats && <GenericTableCell style={{ color: '#000' }}>{!open && <RemoveChatButton _id={_id} />}</GenericTableCell>}
		</GenericTableRow>
	);
};

export default ChatsTableRow;
