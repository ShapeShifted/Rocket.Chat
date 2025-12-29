import type { IOmnichannelRoomWithDepartment } from '@rocket.chat/core-typings';
import { Tag, Box, Icon } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { usePermission, useRoute } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { GenericTableCell, GenericTableRow } from '../../../../../components/GenericTable';
import { useTimeFromNow } from '../../../../../hooks/useTimeFromNow';
import RoomActivityIcon from '../../../components/RoomActivityIcon';
import RemoveChatButton from '../../../currentChats/RemoveChatButton';
import { useOmnichannelPriorities } from '../../../hooks/useOmnichannelPriorities';

import { PriorityIcon } from '../../../priorities/PriorityIcon';
import { AnalyticsService } from '../../../chatbotPortal/pages/services/analytics.service';

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

	const issue = analyticsData?.analytics?.reduce((acc: string | null, entry: any) => {
		if (acc) return acc;
		const session = entry.sessions?.find((s: any) => s.sessionId === sessionId);
		return session ? session.classifiedIssueType : null;
	}, null) || sessionId || '-';

	// Determine if the chat is from the knowledge import (API) or direct
	// Assuming source.alias === 'knowledge-import' identifies fetched conversations
	const isImported = source?.alias === 'knowledge-import';

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
			{/* Type Icon Column */}
			<GenericTableCell style={{ width: '40px', minWidth: '40px', maxWidth: '40px', padding: '0 8px' }}>
				{isImported ? (
					<svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M16.2712 15.4576V17.4915H7.72881V15.4576H16.2712ZM20.7458 10.983C20.7458 8.51181 18.7424 6.50847 16.2712 6.50847H7.72881C5.25757 6.50847 3.25424 8.51181 3.25424 10.983C3.25424 13.4543 5.25757 15.4576 7.72881 15.4576V17.4915C4.13428 17.4915 1.22034 14.5776 1.22034 10.983C1.22034 7.38852 4.13428 4.47458 7.72881 4.47458H16.2712L16.4392 4.47676C19.9561 4.56589 22.7797 7.4447 22.7797 10.983C22.7797 14.5214 19.9561 17.4002 16.4392 17.4893L16.2712 17.4915V15.4576C18.7424 15.4576 20.7458 13.4543 20.7458 10.983Z" fill="#1F2329"/>
					<path d="M10.1695 10.983C10.1695 12.1063 9.25888 13.0169 8.13559 13.0169C7.0123 13.0169 6.10169 12.1063 6.10169 10.983C6.10169 9.85976 7.0123 8.94915 8.13559 8.94915C9.25888 8.94915 10.1695 9.85976 10.1695 10.983Z" fill="#1F2329"/>
					<path d="M17.4915 10.983C17.4915 12.1063 16.5809 13.0169 15.4576 13.0169C14.3343 13.0169 13.4237 12.1063 13.4237 10.983C13.4237 9.85976 14.3343 8.94915 15.4576 8.94915C16.5809 8.94915 17.4915 9.85976 17.4915 10.983Z" fill="#1F2329"/>
					<path d="M10.9831 1.01695C10.9831 0.455304 11.4384 2.45504e-08 12 0C12.5616 -2.45502e-08 13.0169 0.455304 13.0169 1.01695V4.47458H10.9831V1.01695Z" fill="#1F2329"/>
					<path d="M17.0847 4.44524e-08C17.6464 4.44524e-08 18.1017 0.455304 18.1017 1.01695C18.1017 1.57859 17.6464 2.0339 17.0847 2.0339H12V0L17.0847 4.44524e-08Z" fill="#1F2329"/>
					<path d="M0 11.0847C0 9.5683 1.22932 8.33898 2.74576 8.33898H3.25424V13.8305H2.74576C1.22932 13.8305 0 12.6012 0 11.0847Z" fill="#1F2329"/>
					<path d="M24 11.0847C24 9.5683 22.7707 8.33898 21.2542 8.33898H20.7458V13.8305H21.2542C22.7707 13.8305 24 12.6012 24 11.0847Z" fill="#1F2329"/>
					</svg>
				) : (
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M11.1061 13.2444C10.4262 13.8523 9.74939 14.4141 9.08573 14.9248H6.87313C6.21577 14.9248 5.68287 15.4577 5.68287 16.115V17.1631C5.58989 17.2127 5.49783 17.2612 5.4065 17.3079C4.90164 17.5657 4.43183 17.7716 4.00249 17.9278V16.115C4.00249 14.5544 5.24786 13.2846 6.79901 13.2453L6.87313 13.2444H11.1061ZM9.60374 3.58223C12.0785 3.58223 14.0847 5.58844 14.0847 8.06323C14.0847 10.538 12.0785 12.5442 9.60374 12.5442C7.12895 12.5442 5.12274 10.538 5.12274 8.06323C5.12274 5.58844 7.12895 3.58223 9.60374 3.58223ZM9.67375 0.361518C13.4541 0.361518 16.8307 2.6427 17.475 5.87415C16.9544 6.70557 16.3323 7.58109 15.6208 8.47689C15.8067 8.0056 15.9051 7.50863 15.9051 6.99905C15.9051 4.40972 13.2791 2.04189 9.67375 2.04189C6.26109 2.04189 3.72615 4.16345 3.46493 6.5862C3.96668 7.03493 4.28256 7.6872 4.28256 8.41331C4.28256 9.74553 3.21946 10.8294 1.89533 10.863L1.83201 10.8638H1.58969C1.14352 10.8638 0.781779 10.5021 0.781779 10.0559V6.77067C0.781779 6.3245 1.14352 5.96276 1.58969 5.96276H1.83201L1.8554 5.96303C2.45497 2.6846 5.85879 0.361518 9.67375 0.361518ZM9.60374 5.26261C8.057 5.26261 6.80312 6.51649 6.80312 8.06323C6.80312 9.60997 8.057 10.8638 9.60374 10.8638C11.1505 10.8638 12.4044 9.60997 12.4044 8.06323C12.4044 6.51649 11.1505 5.26261 9.60374 5.26261ZM2.18209 9.40351C2.58995 9.25931 2.88224 8.87055 2.88224 8.41331C2.88224 7.95604 2.58997 7.56715 2.18209 7.42297V9.40351Z" fill="#1F2329"/>
				<path d="M13.1174 13.1173C15.6729 10.5618 17.6302 7.93228 18.7375 5.76431C19.2931 4.67669 19.6159 3.74151 19.7127 3.01205C19.8113 2.26972 19.6629 1.87475 19.466 1.67793C19.3169 1.52877 19.0606 1.40869 18.6152 1.4007C18.1655 1.39264 17.5806 1.50216 16.8724 1.75306C16.5079 1.88219 16.1077 1.69141 15.9786 1.32692C15.8495 0.962449 16.0403 0.562284 16.4047 0.433159C17.2033 0.150259 17.9635 -0.0114922 18.6403 0.000636797C19.3214 0.0128442 19.973 0.204555 20.4562 0.68776C21.099 1.33053 21.225 2.26088 21.1008 3.19625C20.9749 4.14451 20.5779 5.2395 19.9845 6.40115C18.7941 8.73178 16.7375 11.4775 14.1075 14.1075C11.4776 16.7374 8.73186 18.794 6.40123 19.9845C5.23956 20.5778 4.14459 20.9748 3.19633 21.1007C2.26094 21.2249 1.33061 21.0989 0.687832 20.4561C0.172122 19.9404 -0.0110993 19.2346 0.000515729 18.5031C0.0121003 17.7737 0.215606 16.9494 0.553811 16.0806C0.694099 15.7203 1.1 15.5419 1.46034 15.6822C1.82064 15.8225 1.99899 16.2283 1.85873 16.5886C1.55407 17.3711 1.40866 18.0228 1.40068 18.5253C1.39273 19.0256 1.51941 19.3074 1.678 19.466C1.87482 19.6628 2.26979 19.8112 3.01212 19.7126C3.74158 19.6158 4.67679 19.293 5.76438 18.7375C7.93235 17.6301 10.5619 15.6728 13.1174 13.1173Z" fill="#1F2329"/>
				<path d="M16.4383 14.3646H18.6788L18.7945 14.3661C20.6268 14.4126 22.1854 15.559 22.8354 17.1696C23.5192 17.4542 24 18.1288 24 18.9156C24 19.7297 23.4853 20.4235 22.7637 20.6897C22.0756 22.2114 20.5624 23.2803 18.7945 23.3251L18.6788 23.3266H12.7975C10.98 23.3266 9.41526 22.2446 8.71227 20.6895C8.4684 20.5995 8.24808 20.4609 8.0634 20.285C8.60681 19.9915 9.17021 19.6543 9.74691 19.2761C9.95634 20.7737 11.2422 21.9263 12.7975 21.9263H18.6788C20.3802 21.9263 21.7595 20.547 21.7595 18.8456C21.7595 17.1442 20.3802 15.7649 18.6788 15.7649H14.1941C14.6063 15.385 15.0176 14.9903 15.426 14.5819C15.7736 14.2343 16.1112 13.8843 16.4383 13.5337V14.3646Z" fill="#1F2329"/>
				<path d="M13.0776 17.4453C13.8509 17.4453 14.4779 18.0723 14.4779 18.8456C14.4779 19.619 13.8509 20.2459 13.0776 20.2459C12.3042 20.2459 11.6773 19.619 11.6773 18.8456C11.6773 18.0723 12.3042 17.4453 13.0776 17.4453Z" fill="#1F2329"/>
				<path d="M18.1187 17.4453C18.8921 17.4453 19.519 18.0723 19.519 18.8456C19.519 19.619 18.8921 20.2459 18.1187 20.2459C17.3453 20.2459 16.7184 19.619 16.7184 18.8456C16.7184 18.0723 17.3453 17.4453 18.1187 17.4453Z" fill="#1F2329"/>
				<path d="M19.2389 11.2839C19.6256 11.2839 19.9391 11.5974 19.9391 11.9841C19.9391 12.3708 19.6256 12.6843 19.2389 12.6843H17.2089C17.6214 12.2163 18.0141 11.7486 18.3854 11.2839H19.2389Z" fill="#1F2329"/>
				</svg>
				)}
			</GenericTableCell>
			
			{/* Name Column */}
			<GenericTableCell style={{ width: '180px', minWidth: '150px', maxWidth: '200px' }} withTruncatedText>
				<Box display='flex' flexDirection='column'>
					<Box withTruncatedText title={fname} style={{ 
						color: '#000', 
						fontFamily: 'Inter, sans-serif',
						fontSize: '14px',
						lineHeight: '1.4'
					}}>
						{fname}
					</Box>
					{tags && tags.length > 0 && (
						<Box display='flex' flexWrap='wrap' style={{ gap: '4px' , marginTop: 4}}>
							{tags.slice(0, 2).map((tag: string) => (
								<Tag 
									key={tag}
									style={{ 
										display: 'inline-flex',
										color: '#000', 
										fontFamily: 'Inter, sans-serif',
										fontSize: '12px',
										padding: '2px 6px',
										maxWidth: '100px',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap'
									}} 
									disabled
									title={tag}
								>
									{tag}
								</Tag>
							))}
							{tags.length > 2 && (
								<Tag 
									style={{ 
										display: 'inline-flex',
										color: '#000', 
										fontFamily: 'Inter, sans-serif',
										fontSize: '12px',
										padding: '2px 6px'
									}} 
									disabled
								>
									+{tags.length - 2}
								</Tag>
							)}
						</Box>
					)}
				</Box>
			</GenericTableCell>
			
			{/* Issue Column */}
			<GenericTableCell style={{ 
				width: '140px', 
				minWidth: '120px', 
				maxWidth: '160px',
				color: '#000', 
				fontFamily: 'Inter, sans-serif',
				fontSize: '14px'
			}} withTruncatedText title={issue}>
				{issue}
			</GenericTableCell>
			
			{/* Priority Column */}
			{isPriorityEnabled && (
				<GenericTableCell style={{ 
					width: '100px', 
					minWidth: '80px', 
					maxWidth: '120px',
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center'
				}}>
					<PriorityIcon level={priorityWeight} />
				</GenericTableCell>
			)}
			
			{/* Agent Column */}
			<GenericTableCell style={{ 
				width: '120px', 
				minWidth: '100px', 
				maxWidth: '140px',
				color: '#000', 
				fontFamily: 'Inter, sans-serif',
				fontSize: '14px'
			}} withTruncatedText title={isImported ? 'DB Engage' : servedBy?.username}>
				{isImported ? 'DB Engage' : servedBy?.username || '-'}
			</GenericTableCell>

			{/* Department Column */}
			<GenericTableCell style={{ 
				width: '120px', 
				minWidth: '100px', 
				maxWidth: '140px',
				color: '#000', 
				fontFamily: 'Inter, sans-serif',
				fontSize: '14px'
			}} withTruncatedText title={department?.name}>
				{department?.name || '-'}
			</GenericTableCell>
			
			{/* Started At Column */}
			<GenericTableCell style={{ 
				width: '160px', 
				minWidth: '140px', 
				maxWidth: '180px',
				color: '#000', 
				fontFamily: 'Inter, sans-serif',
				fontSize: '14px'
			}} withTruncatedText title={formatDate(ts)}>
				{formatDate(ts)}
			</GenericTableCell>
			
			{/* Last Message Column */}
			<GenericTableCell style={{ 
				width: '160px', 
				minWidth: '140px', 
				maxWidth: '180px',
				color: '#000', 
				fontFamily: 'Inter, sans-serif',
				fontSize: '14px'
			}} withTruncatedText title={formatDate(lm)}>
				{formatDate(lm)}
			</GenericTableCell>
			
			{/* Status Column */}
			<GenericTableCell style={{ 
				width: '120px', 
				minWidth: '100px', 
				maxWidth: '140px'
			}} withTruncatedText>
				{(() => {
					const statusText = getStatusText(open, onHold);
					return (
						<Box display='flex' alignItems='center' justifyContent='flex-start' >
							<Box style={{ 
								color: statusText === t('Room_Status_Open') ? '#156FF5' : 
									   statusText === t('Closed') ? '#000' : 
									   statusText === t('Queued') ? '#FF8C00' : 
									   statusText === t('On_Hold_Chats') ? '#FF6B6B' : '#000', 
								fontFamily: 'Inter, sans-serif',
								fontSize: '14px',
								fontWeight: statusText === t('Room_Status_Open') ? '500' : '400'
							}}>
								{statusText}
							</Box>
							<RoomActivityIcon room={room} />
						</Box>
					);
				})()}
			</GenericTableCell>

			
			
			{/* Actions Column */}
			{canRemoveClosedChats && (
				<GenericTableCell style={{ 
					width: '80px', 
					minWidth: '60px', 
					maxWidth: '100px',
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center'
				}}>
					{!open && <RemoveChatButton _id={_id} />}
				</GenericTableCell>
			)}
		</GenericTableRow>
	);
};

export default ChatsTableRow;