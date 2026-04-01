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
import DateRangePicker from '../analytics/DateRangePicker';
import { subDays, startOfDay, endOfDay } from 'date-fns';


const RealTimeMonitoringPage = () => {

	
	const { t } = useTranslation();
	const [reloadFrequency, setReloadFrequency] = useState('5');
	const [departmentId, setDepartment] = useState('');

	const [rangeType, setRangeType] = useState('last_7_days');
    const [customRange, setCustomRange] = useState({ start: '', end: '' });

	const getSafeCustomDate = (dateStr: string, defaultDate: Date) => 
        dateStr ? new Date(dateStr) : defaultDate;

	const dateRange = useMemo(() => {
			const today = new Date();

	// Helper to keep code clean
		const formatStart = (d: Date) => startOfDay(d).toISOString();
		const formatEnd = (d: Date) => endOfDay(d).toISOString();

		if (rangeType === 'custom') {
			return {
				// Use customRange if it exists, otherwise fallback to last 7 days but STAY in custom mode
				start: formatStart(customRange.start ? new Date(customRange.start) : subDays(today, 6)),
				end: formatEnd(customRange.end ? new Date(customRange.end) : today),
			};
		}

		switch (rangeType) {
			case 'today':
				return { start: formatStart(today), end: formatEnd(today) };
			case 'yesterday':
				return { start: formatStart(subDays(today, 1)), end: formatEnd(subDays(today, 1)) };
			case 'last_30_days':
				return { start: formatStart(subDays(today, 29)), end: formatEnd(today) };
			case 'all_time':
				return { start: new Date(0).toISOString(), end: formatEnd(today) };
			default: // last_7_days
				return { start: formatStart(subDays(today, 6)), end: formatEnd(today) };
				}
		}, [rangeType, customRange]);

	const queryClient = useQueryClient();

	const reloadCharts = useEffectEvent(() => {
		queryClient.invalidateQueries({ queryKey: omnichannelQueryKeys.analytics.all(departmentId) });
	});

	// Change when there's change in the date range
	useEffect(() => {
		queryClient.invalidateQueries({ 
			queryKey: omnichannelQueryKeys.analytics.all(departmentId) 
		});
	}, [dateRange, departmentId, queryClient]);

	// Interval-based automatic background update
	useEffect(() => {
		const interval = setInterval(() => {
			queryClient.invalidateQueries({ 
				queryKey: omnichannelQueryKeys.analytics.all(departmentId) 
			});
		}, Number(reloadFrequency) * 1000);

		return () => {
			clearInterval(interval);
		};
	}, [reloadFrequency, departmentId, queryClient]);

	const reloadOptions = useMemo(
		() => [
			['5', <Fragment key='5 seconds'>5 {t('seconds')}</Fragment>] as unknown as SelectOption,
			['10', <Fragment key='10 seconds'>10 {t('seconds')}</Fragment>] as unknown as SelectOption,
			['30', <Fragment key='30 seconds'>30 {t('seconds')}</Fragment>] as unknown as SelectOption,
			['60', <Fragment key='1 minute'>1 {t('minute')}</Fragment>] as unknown as SelectOption,
		],
		[t],
	);

	const viewId = `${rangeType}-${dateRange.start}-${dateRange.end}-${departmentId}`;

	return (
		<Page bg='#f8f8f8'>
			<PageHeader title={t('Agent Conversation Monitoring')}>
				<Box display='flex' flexDirection='row' mis='auto' alignItems='center'>
					<Box mie='x8'>{t('Show analysis from')}</Box>
						<Box borderBlockWidth='x1' borderBlockColor='#d3d3d3' borderInlineWidth='x1' 
    					borderInlineColor='#d3d3d3' mie='x16'> 
						<DateRangePicker 
							onChange={(range) => {
										setCustomRange(range);
										setRangeType('custom'); 
									}}
							onRangeTypeChange={(val) => setRangeType(String(val))} 
							rangeType={rangeType} 
						/>
					</Box>
					
					<Label mie={4} marginInlineStart='20px'>{t('Update every:')}</Label>
					<Select options={reloadOptions} onChange={useEffectEvent((val: Key) => setReloadFrequency(String(val)))} value={reloadFrequency} />
				</Box>
			</PageHeader>
			<Box borderBlockEndWidth='x2' borderBlockEndColor='#8e8e8e' w='full' />
			<PageScrollableContentWithShadow key={viewId}>
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
