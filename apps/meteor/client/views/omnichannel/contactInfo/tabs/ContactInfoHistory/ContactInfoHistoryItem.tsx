import type { Serialized } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import type { ContactSearchChatsResult } from '@rocket.chat/rest-typings';

import { useTimeFromNow } from '../../../../../hooks/useTimeFromNow';
import { AnalyticsService } from '../../../chatbotPortal/pages/services/analytics.service';
import { useOmnichannelPriorities } from '../../../hooks/useOmnichannelPriorities';
import { PriorityIcon } from '../../../priorities/PriorityIcon';

type ContactInfoHistoryItemProps = Serialized<ContactSearchChatsResult> & {
	onClick: () => void;
	sessionId?: string;
};

const ContactInfoHistoryItem = (props: ContactInfoHistoryItemProps) => {
	const {
		_id,
		ts,
		servedBy,
		department,
		open,
		priorityWeight,
		lm,
		onHold,
		onClick,
		sessionId: sessionIdProp,
		livechatData,
		v,
	} = props as any;

	const sessionId = sessionIdProp ?? livechatData?.sessionId ?? v?.token ?? v?.sessionId ?? livechatData?.sessionToken;

	const { t } = useTranslation();
	const getTimeFromNow = useTimeFromNow(true);
	const { enabled: isPriorityEnabled } = useOmnichannelPriorities();

	const formatDate = (date?: string | Date | number): string => {
		if (!date) {
			return '-';
		}
		try {
			return new Date(date).toLocaleString('en-GB', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false,
			});
		} catch {
			return String(date);
		}
	};

	const { data: analyticsData } = useQuery({
		queryKey: ['analytics-all'],
		queryFn: () => AnalyticsService.getAllAnalytics(),
		staleTime: 5 * 60 * 1000,
	});

	// Note: sessionId and issue mapping might need more context if they are not directly in the room object
	const issue = analyticsData?.analytics?.reduce((acc: string | null, entry: any) => {
		if (acc) return acc;
		const session = entry.sessions?.find((s: any) => s.sessionId === sessionId);
		return session ? session.classifiedIssueType : null;
	}, null) || '-';

	const getStatusText = (open = false, onHold = false): string => {
		if (!open) {
			return t('Closed');
		}

		if (open && !servedBy) {
			return t('Queued');
		}

		return onHold ? t('On_Hold_Chats') : t('Room_Status_Open');
	};

	const getPriorityText = (weight: number): string => {
		switch (weight) {
			case 1:
				return 'Highest';
			case 2:
				return 'High';
			case 3:
				return 'Medium';
			case 4:
				return 'Low';
			case 5:
				return 'Lowest';
			default:
				return 'Unprioritized';
		}
	};

	const statusText = getStatusText(open, onHold);

	const InfoRow = ({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) => (
		<Box display='flex' flexDirection='row' mb={4}>
			<Box width='120px' color='hint' fontScale='p2' style={{ flexShrink: 0 }}>
				{label}:
			</Box>
			<Box fontScale='p2' style={{ 
				wordBreak: 'break-word',
				color: color || 'inherit',
			}}>
				{value}
			</Box>
		</Box>
	);

	return (
		<Box
			role='listitem'
			onClick={onClick}
			m={12}
			p={16}
			bg='light'
			borderRadius='x4'
			borderWidth='default'
			borderColor='extra-light'
			borderStyle='solid'
			style={{ cursor: 'pointer' }}
			className='rcx-box--animated'
		>
			<InfoRow label={t('Session_ID')} value={sessionId || _id} />
			<InfoRow label={t('Issue')} value={issue} />
			{isPriorityEnabled && (
				<InfoRow
					label={t('Priority')}
					value={
						<>
							<PriorityIcon level={priorityWeight} /> {getPriorityText(priorityWeight)}
						</>
					}
				/>
			)}
			<InfoRow label={t('Agent')} value={servedBy?.username || '-'} />
			<InfoRow label={t('Department')} value={department?.name || '-'} />
			<InfoRow label={t('Created_at')} value={formatDate(ts)} />
			<InfoRow label={t('LastInteraction')} value={getTimeFromNow(lm || ts)} />
			<InfoRow 
				label={t('Status')} 
				value={statusText}
				color={
					statusText === t('Room_Status_Open') ? '#156FF5' : 
					statusText === t('Closed') ? '#000' : 
					statusText === t('Queued') ? '#FF8C00' : 
					statusText === t('On_Hold_Chats') ? '#FF6B6B' : '#000'
				}
			/>
		</Box>
	);
};

export default ContactInfoHistoryItem;
