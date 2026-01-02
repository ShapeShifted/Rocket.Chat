import { Callout, Select, Box } from '@rocket.chat/fuselage';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import type { ChangeEvent, Key } from 'react';
import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import RoomFiles from '../RoomFiles/RoomFiles';
import { useDeleteFile } from '../RoomFiles/hooks/useDeleteFile';
import { useFilesList } from '../RoomFiles/hooks/useFilesList';
import MessageSearch from '../MessageSearchTab/components/MessageSearch';
import MessageSearchForm from '../MessageSearchTab/components/MessageSearchForm';
import { useMessageSearchProviderQuery } from '../MessageSearchTab/hooks/useMessageSearchProviderQuery';
import {
	ContextualbarClose,
	ContextualbarContent,
	ContextualbarHeader,
	ContextualbarTitle,
	ContextualbarIcon,
	ContextualbarSection,
	ContextualbarDialog,
} from '../../../../components/Contextualbar';
import { useRecordList } from '../../../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useRoom } from '../../contexts/RoomContext';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';

const CombinedSearchTab = () => {
	const providerQuery = useMessageSearchProviderQuery();
	const { closeTab } = useRoomToolbox();
	const room = useRoom();
	const { t } = useTranslation();

	const [searchState, setSearchState] = useState<{ searchText: string; globalSearch: boolean }>({ searchText: '', globalSearch: false });
	const [fileType, setFileType] = useLocalStorage('file-list-type', 'all');
	const [text, setText] = useState('');

	const handleTextChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		setText(event.currentTarget.value);
	}, []);

	const query = useMemo(
		() => ({
			rid: room._id,
			type: fileType,
			text,
		}),
		[room._id, fileType, text],
	);

	const { filesList, loadMoreItems, reload } = useFilesList(query);
	const { phase, items: filesItems, itemCount: totalItemCount } = useRecordList(filesList);
	const handleDeleteFile = useDeleteFile(reload);

	const fileTypeOptions: [string, string][] = useMemo(
		() => [
			['all', t('All')],
			['images', t('Images')],
			['videos', t('Videos')],
			['audios', t('Audios')],
			['documents', t('Documents')],
		],
		[t],
	);

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				<ContextualbarIcon name='magnifier' />
				<ContextualbarTitle>{t('Search')}</ContextualbarTitle>
				<ContextualbarClose onClick={closeTab} />
			</ContextualbarHeader>
			<ContextualbarSection>
				<Box display='flex' flexDirection='row' mbe={8} mi={4} alignItems='center'>
					{/* Search form - takes available space */}
					<Box flexGrow={1} flexShrink={1} minWidth={0} marginInlineEnd={15}>  {/* Changed mis to mr */}
						{providerQuery.data && <MessageSearchForm provider={providerQuery.data} onSearch={setSearchState} />}
					</Box>
					
					{/* Dropdown - stays fixed width */}
					<Box flexShrink={0} width='40px' style={{ minWidth: '40px', maxWidth: '40px' }}>  {/* Removed mis, added flexShrink={0} */}
						<Select width='100%' options={fileTypeOptions} value={fileType} onChange={(value) => setFileType(value as string)} style={{ width: '100%', minWidth: '100%' }}/>
					</Box>
				</Box>
			</ContextualbarSection>
			<ContextualbarContent flexShrink={1} flexGrow={1} paddingInline={0}>
				{fileType === 'all' && providerQuery.isSuccess && (
					<MessageSearch searchText={searchState.searchText} globalSearch={searchState.globalSearch} />
				)}
				{fileType !== 'all' && (
					<RoomFiles
						loading={phase === AsyncStatePhase.LOADING}
						type={fileType}
						text={text}
						filesItems={filesItems}
						loadMoreItems={loadMoreItems}
						setType={setFileType}
						setText={handleTextChange}
						total={totalItemCount}
						onClickClose={closeTab}
						onClickDelete={handleDeleteFile}
					/>
				)}
				{providerQuery.isError && (
					<Callout m={24} type='danger'>
						{t('Search_current_provider_not_active')}
					</Callout>
				)}
			</ContextualbarContent>
		</ContextualbarDialog>
	);
};

export default CombinedSearchTab;
