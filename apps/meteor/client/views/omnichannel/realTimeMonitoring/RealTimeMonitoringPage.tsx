import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, Select, Margins, Option } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useQueryClient } from '@tanstack/react-query';
import type { Key } from 'react';
import { useState, useMemo, useEffect, Fragment } from 'react';
import { useTranslation } from 'react-i18next';

import { Page, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';
import { getDateRange } from '../../../lib/utils/getDateRange';
import AutoCompleteDepartment from '../components/AutoCompleteDepartment';
import Label from '../components/Label';
import AgentStatusChart from './charts/AgentStatusChart';
import ChatDurationChart from './charts/ChatDurationChart';
import ChatsChart from './charts/ChatsChart';
import ChatsPerAgentChart from './charts/ChatsPerAgentChart';
import ChatsPerDepartmentChart from './charts/ChatsPerDepartmentChart';
import ResponseTimesChart from './charts/ResponseTimesChart';
import AgentsOverview from './overviews/AgentsOverview';
import ChatsOverview from './overviews/ChatsOverview';
import ConversationOverview from './overviews/ConversationOverview';
import ProductivityOverview from './overviews/ProductivityOverview';
import { omnichannelQueryKeys } from '../../../lib/queryKeys';

const dateRange = getDateRange();

const RealTimeMonitoringPage = () => {
	const { t } = useTranslation();

	const [reloadFrequency, setReloadFrequency] = useState('5');
	const [departmentId, setDepartment] = useState('');

	const queryClient = useQueryClient();

	const reloadCharts = useEffectEvent(() => {
		queryClient.invalidateQueries({ queryKey: omnichannelQueryKeys.analytics.all(departmentId) });
	});

	useEffect(() => {
		const interval = setInterval(reloadCharts, Number(reloadFrequency) * 1000);

		return () => {
			clearInterval(interval);
		};
	}, [reloadCharts, reloadFrequency]);

	const reloadOptions = useMemo(
		() => [
			['5', <Fragment key='5 seconds'>5 {t('seconds')}</Fragment>] as unknown as SelectOption,
			['10', <Fragment key='10 seconds'>10 {t('seconds')}</Fragment>] as unknown as SelectOption,
			['30', <Fragment key='30 seconds'>30 {t('seconds')}</Fragment>] as unknown as SelectOption,
			['60', <Fragment key='1 minute'>1 {t('minute')}</Fragment>] as unknown as SelectOption,
		],
		[t],
	);

	return (
		<Page bg='#f8f8f8'>
			<PageHeader title={t('Agent Conversation Monitoring')}>
				<Box display='flex' flexDirection='row' mis='auto' alignItems='center'>
					<Label mie={4}>{t('Departments:')}</Label>
					<AutoCompleteDepartment
						mie={4}
						value={departmentId}
						onChange={setDepartment}
						placeholder={t('All')}
						label={t('All')}
						onlyMyDepartments
						haveAll
						withTitle={false}
						renderItem={({ label, ...props }) => <Option {...props} label={<span style={{ whiteSpace: 'normal' }}>{label}</span>} />}
					/>
					<Label mie={4} marginInlineStart='20px'>{t('Update every:')}</Label>
					<Select options={reloadOptions} onChange={useEffectEvent((val: Key) => setReloadFrequency(String(val)))} value={reloadFrequency} />
				</Box>
			</PageHeader>
			<Box borderBlockEndWidth='x2' borderBlockEndColor='#8e8e8e' w='full' />
			<PageScrollableContentWithShadow>
				<Margins block='x4'>

					<Box display='flex' flexDirection='row' alignItems='stretch' flexWrap='wrap' style={{ gap: '16px' }}>
						<Box
							display='flex'
							flexDirection='column'
							flexGrow={1}
							flexShrink={1}
							flexBasis='0'
							minWidth='250px'
							alignItems='stretch'
							bg='white'
							paddingBlockStart={12}
							pis={10}
							borderRadius='x8'
						>
							<Box fontScale='h3' color='black' style={{ lineHeight: 1 }}>
								Conversation Overview
							</Box>
							<Box flexGrow={1} flexShrink={1}>
								<ConversationOverview departmentId={departmentId} dateRange={dateRange} />
							</Box>
						</Box>
						<Box
							display='flex'
							flexDirection='column'
							flexGrow={1}
							flexShrink={1}
							flexBasis='0'
							minWidth='250px'
							alignItems='stretch'
							bg='white'
							paddingBlockStart={12}
							pis={10}
							borderRadius='x8'
						>
							<Box fontScale='h3' color='black' style={{ lineHeight: 1 }}>
								Abandonment Overview
							</Box>
							<Box flexGrow={1} flexShrink={1}>
								<ChatsOverview departmentId={departmentId} dateRange={dateRange} />
							</Box>
						</Box>
						<Box
							display='flex'
							flexDirection='column'
							flexGrow={2}
							flexShrink={1}
							flexBasis='0'
							minWidth='400px'
							alignItems='stretch'
							bg='white'
							paddingBlockStart={12}
							pis={10}
							borderRadius='x8'
						>
							<Box fontScale='h3' color='black' style={{ lineHeight: 1 }} mb='x1'>
								Conversation Status Overview
							</Box>
							<Box flexGrow={1} flexShrink={1}>
								<ChatsChart flexGrow={1} flexShrink={1} departmentId={departmentId} dateRange={dateRange} />
							</Box>
						</Box>
					</Box>
					
						<Box
							display='flex'
							flexDirection='column'
							flexGrow={1}
							flexShrink={1}
							minWidth='250px'
							alignItems='stretch'
							bg='white'
							paddingBlockStart={12}
							pis={10}
							borderRadius='x8'
						>
							<Box fontScale='h3' color='black' style={{ lineHeight: 1 }}>
								Service Time Analysis
							</Box>
							<Box flexGrow={1} flexShrink={1} display='flex' flexDirection='row' w='full' alignItems='stretch' bg='white'>
								<AgentsOverview departmentId={departmentId} dateRange={dateRange} />
								<ChatDurationChart flexGrow={1} flexShrink={1} w='100%' departmentId={departmentId} dateRange={dateRange} />
							</Box>
						</Box>
					<Box
							display='flex'
							flexDirection='column'
							flexGrow={1}
							flexShrink={1}
							minWidth='250px'
							alignItems='stretch'
							bg='white'
							paddingBlockStart={12}
							pis={10}
							borderRadius='x8'
						>
							<Box fontScale='h3' color='black' style={{ lineHeight: 1 }}>
								Response Time Analysis
							</Box>
						<Box display='flex' flexDirection='row' w='full' alignItems='stretch' flexShrink={1} bg='white'>
							<ProductivityOverview flexGrow={1} flexShrink={1} departmentId={departmentId} dateRange={dateRange} />
							<ResponseTimesChart flexGrow={1} flexShrink={1} w='100%' departmentId={departmentId} dateRange={dateRange} />
						</Box>
					</Box>
				</Margins>
			</PageScrollableContentWithShadow>
			<Box
          backgroundColor='#E4E7EA'
          color='#1F2329'
          paddingBlock='x4'
          marginBlockStart='x8'
          display='flex'
          justifyContent='center'
          alignItems='center'
          width='100%'
          style={{ fontSize: '12px' }}
        >
          &#169; 2026 by DB AI Technology Sdn. Bhd.
        </Box>
		</Page>
	);
};

export default RealTimeMonitoringPage;
