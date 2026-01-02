import type { ILivechatContact, Serialized } from '@rocket.chat/core-typings';
import { OmnichannelSourceType } from '@rocket.chat/core-typings';
import { Box, Margins, Throbber, States, StatesIcon, StatesTitle, Select } from '@rocket.chat/fuselage';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useSetModal, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { Key } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import ContactInfoHistoryItem from './ContactInfoHistoryItem';
import { ContextualbarContent, ContextualbarEmptyContent } from '../../../../../components/Contextualbar';
import { VirtualizedScrollbars } from '../../../../../components/CustomScrollbars';
import { useHasLicenseModule } from '../../../../../hooks/useHasLicenseModule';
import { useOmnichannelSource } from '../../../hooks/useOmnichannelSource';
import AdvancedContactModal from '../../AdvancedContactModal';
import ContactInfoHistoryMessages from './ContactInfoHistoryMessages';

type ContactInfoHistoryProps = {
	contact: Serialized<ILivechatContact>;
};

const isFilterBlocked = (hasLicense: boolean, fieldValue: Key) => !hasLicense && fieldValue !== 'all';

const ContactInfoHistory = ({ contact }: ContactInfoHistoryProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const router = useRouter();
	const [storedType, setStoredType] = useLocalStorage<string>('contact-history-type', 'all');
	const [chat, setChat] = useState<{ id: string; sessionId: string } | null>(null);

	const hasLicense = useHasLicenseModule('contact-id-verification') as boolean;
	const type = isFilterBlocked(hasLicense, storedType) ? 'all' : storedType;

	const { getSourceName } = useOmnichannelSource();

	const getContactHistory = useEndpoint('GET', '/v1/omnichannel/contacts.history');
	const { data, isLoading, isError } = useQuery({
		queryKey: ['getContactHistory', contact._id, type],
		queryFn: () => getContactHistory({ contactId: contact._id, source: type === 'all' ? undefined : type }),
	});

	const handleChangeFilter = (value: Key) => {
		if (isFilterBlocked(hasLicense, value)) {
			return setModal(<AdvancedContactModal onCancel={() => setModal(null)} />);
		}

		setStoredType(value as string);
	};

	const historyFilterOptions: [string, string][] = useMemo(
		() =>
			Object.values(OmnichannelSourceType).reduce(
				(acc, cv) => {
					let sourceName;
					const hasSourceType = contact.channels?.find((item) => {
						sourceName = getSourceName(item.details, false);
						return item.details.type === cv;
					});

					if (hasSourceType && sourceName) {
						acc.push([cv, sourceName]);
					}

					return acc;
				},
				[['all', t('All')]],
			),
		[contact.channels, getSourceName, t],
	);

	return (
		<ContextualbarContent paddingInline={0}>
			{isLoading && (
				<Box pi={24} pb={12}>
					<Throbber size='x12' />
				</Box>
			)}
			{isError && (
				<States>
					<StatesIcon name='warning' variation='danger' />
					<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
				</States>
			)}
			{data?.history.length === 0 && (
				<ContextualbarEmptyContent icon='history' title={t('No_history_yet')} subtitle={t('No_history_yet_description')} />
			)}
			{!isError && data?.history && data.history.length > 0 && !chat && (
				<>
					<Box pi={24} pb={12}>
						<Box is='span' color='hint' fontScale='p2'>
							{t('Showing_current_of_total', { current: data?.history.length, total: data?.total })}
						</Box>
					</Box>
					<Box role='list' height='100%' overflow='hidden' flexShrink={1}>
						<VirtualizedScrollbars>
							<Virtuoso
								totalCount={data.history.length}
								overscan={25}
								data={data?.history}
								itemContent={(index, data) => (
									<ContactInfoHistoryItem
										key={index}
										onClick={() => router.navigate(`/live/${data._id}`)}
										// onClick={() =>
										// 	setChat({
										// 		id: data._id,
										// 		sessionId:
										// 			data.sessionId ||
										// 			data.livechatData?.sessionId ||
										// 			data.v?.token ||
										// 			data.livechatData?.sessionToken,
										// 	})
										// }
										{...data}
									/>
								)}
							/>
						</VirtualizedScrollbars>
					</Box>
				</>
			)}
			{chat && <ContactInfoHistoryMessages chatId={chat.id} sessionId={chat.sessionId} onBack={() => setChat(null)} />}
		</ContextualbarContent>
	);
};

export default ContactInfoHistory;
