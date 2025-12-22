import { Pagination, States, StatesIcon, StatesTitle, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import { usePermission } from '@rocket.chat/ui-contexts';
import { hashKey } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import ChatFilterByText from './ChatsTableFilter';
import ChatsTableRow from './ChatsTableRow';
import { useChatsQuery } from './useChatsQuery';
import GenericNoResults from '../../../../../components/GenericNoResults/GenericNoResults';
import {
	GenericTable,
	GenericTableBody,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
} from '../../../../../components/GenericTable';
import { usePagination } from '../../../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../../components/GenericTable/hooks/useSort';
import { links } from '../../../../../lib/links';
import { useCurrentChats } from '../../../currentChats/hooks/useCurrentChats';
import { useOmnichannelPriorities } from '../../../hooks/useOmnichannelPriorities';
import { useChatsContext } from '../../contexts/ChatsContext';

const ChatsTable = () => {
	const { t } = useTranslation();
	const canRemoveClosedChats = usePermission('remove-closed-livechat-room');
	const { filtersQuery: filters } = useChatsContext();

	const { enabled: isPriorityEnabled } = useOmnichannelPriorities();
	const { data: priorities } = useOmnichannelPriorities();

	const chatsQuery = useChatsQuery();

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'fname' | 'ts'>('ts', 'desc');

	const effectiveItemsPerPage = filters.priority ? 100000 : itemsPerPage;

	const query = useMemo(
			() => chatsQuery(filters, [sortBy, sortDirection], filters.priority ? 0 : current, effectiveItemsPerPage as any),
			[effectiveItemsPerPage, filters, sortBy, sortDirection, current, chatsQuery],
		);

	const { data, isLoading, isSuccess, isError, refetch } = useCurrentChats(query);

	// Apply client-side priority filter when user selects a priority id
	let rooms = data?.rooms ?? [];
	if (filters.priority) {
		const selected = priorities?.find((p: any) => p._id === filters.priority);
		const weight = selected?.sortItem;
		if (typeof weight !== 'undefined') {
			rooms = rooms.filter((r: any) => r.priorityWeight === weight);
		}
	}

	const getSessionIdFromRoom = (room: any): string | undefined =>
		// New flow: the visitor's token is used as the session identifier.
		room?.v?.token ?? room?.visitor?.token ?? room?.sessionId ?? room?.v?.sessionId ?? room?.visitor?.sessionId ?? room?.livechatData?.sessionId ?? room?.livechatData?.sessionToken ?? undefined;

	const [defaultQuery] = useState(hashKey([query]));
	const queryHasChanged = defaultQuery !== hashKey([query]);

	const headers = (
		<>
			<GenericTableHeaderCell style={{ color: '#000', fontWeight: 'normal', fontSize: '0.95rem', fontFamily: 'Inter, sans-serif' }} key='fname' direction={sortDirection} active={sortBy === 'fname'} onClick={setSort} sort='fname'>
				<span style={{ color: '#000', fontFamily: 'Inter, sans-serif' }}>{t('Name')}</span>
			</GenericTableHeaderCell>
			<GenericTableHeaderCell style={{ color: '#000', fontWeight: 'normal', fontSize: '0.95rem', fontFamily: 'Inter, sans-serif' }} key='sessionId'><span style={{ color: '#000', fontFamily: 'Inter, sans-serif' }}>{t('Session_ID')}</span></GenericTableHeaderCell>
			{isPriorityEnabled && (
				<GenericTableHeaderCell style={{ color: '#000', fontWeight: 'normal', fontSize: '0.95rem', fontFamily: 'Inter, sans-serif' }} key='priorityWeight' alignItems='center'>
					<span style={{ color: '#000', fontFamily: 'Inter, sans-serif' }}>{t('Priority')}</span>
				</GenericTableHeaderCell>
			)}
			<GenericTableHeaderCell style={{ color: '#000', fontWeight: 'normal', fontSize: '0.95rem', fontFamily: 'Inter, sans-serif' }} key='servedBy'><span style={{ color: '#000', fontFamily: 'Inter, sans-serif' }}>{t('Agent')}</span></GenericTableHeaderCell>

			<GenericTableHeaderCell style={{ color: '#000', fontWeight: 'normal', fontSize: '0.95rem', fontFamily: 'Inter, sans-serif' }} key='department.name'><span style={{ color: '#000', fontFamily: 'Inter, sans-serif' }}>{t('Department')}</span></GenericTableHeaderCell>
			<GenericTableHeaderCell style={{ color: '#000', fontWeight: 'normal', fontSize: '0.95rem', fontFamily: 'Inter, sans-serif' }} key='ts' direction={sortDirection} active={sortBy === 'ts'} onClick={setSort} sort='ts'>
				<span style={{ color: '#000', fontFamily: 'Inter, sans-serif' }}>{t('Started_At')}</span>
			</GenericTableHeaderCell>
			<GenericTableHeaderCell style={{ color: '#000', fontWeight: 'normal', fontSize: '0.95rem', fontFamily: 'Inter, sans-serif' }} key='lm'><span style={{ color: '#000', fontFamily: 'Inter, sans-serif' }}>{t('Last_Message')}</span></GenericTableHeaderCell>
			<GenericTableHeaderCell style={{ color: '#000', fontWeight: 'normal', fontSize: '0.95rem', fontFamily: 'Inter, sans-serif' }} key='status'><span style={{ color: '#000', fontFamily: 'Inter, sans-serif' }}>{t('Status')}</span></GenericTableHeaderCell>
			{canRemoveClosedChats && <GenericTableHeaderCell key='remove' w='x60' data-qa='current-chats-header-remove' />}
		</>
	);

	return (
		<>
			<ChatFilterByText />
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={headers.props.children.filter(Boolean).length} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data?.rooms.length === 0 && queryHasChanged && <GenericNoResults />}
			{isSuccess && data?.rooms.length === 0 && !queryHasChanged && (
				<GenericNoResults
					icon='message'
					title={t('No_chats_yet')}
					description={t('No_chats_yet_description')}
					linkHref={links.go.omnichannelDocs}
					linkText={t('Learn_more_about_conversations')}
				/>
			)}
			{isSuccess && rooms.length > 0 && (
				<>
					<GenericTable fixed={false} style={{ color: '#000', fontFamily: 'Inter, sans-serif' }}>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{rooms.map((room: any) => (
								<ChatsTableRow key={room._id} {...room} sessionId={getSessionIdFromRoom(room)} />
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={filters.priority ? rooms.length : data?.total || 0}
						onSetItemsPerPage={onSetItemsPerPage}
						onSetCurrent={onSetCurrent}
						{...paginationProps}
					/>
				</>
			)}
			{isError && (
				<States>
					<StatesIcon name='warning' variation='danger' />
					<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
					<StatesActions>
						<StatesAction onClick={() => refetch()}>{t('Reload_page')}</StatesAction>
					</StatesActions>
				</States>
			)}
		</>
	);
};

export default ChatsTable;
