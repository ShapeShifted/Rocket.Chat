import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, Margins, Select } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useEffect, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { subDays, startOfDay, endOfDay } from 'date-fns';

import { Page, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';
import AnalyticsOverview from './overviews/AnalyticsOverview';
import ChatDurationChart from './charts/ChatDurationChart';
import ChatsOverview from './overviews/ChatsOverview';
import ConversationOverview from './overviews/ConversationOverview';
import { omnichannelQueryKeys } from '../../../lib/queryKeys';
import DateRangePicker from '../analytics/DateRangePicker';

const ConversationMonitoringRoute = () => {
    const { t } = useTranslation();

    const [reloadFrequency, setReloadFrequency] = useState(5);
    const [departmentId, setDepartment] = useState('');
    const [rangeType, setRangeType] = useState('last_7_days');
    const [customRange, setCustomRange] = useState({ start: '', end: '' });

    const dateRange = useMemo(() => {
        const today = new Date();
        switch (rangeType) {
            case 'today':
                return { start: startOfDay(today).toISOString(), end: endOfDay(today).toISOString() };
            case 'yesterday':
                const yesterday = subDays(today, 1);
                return { start: startOfDay(yesterday).toISOString(), end: endOfDay(yesterday).toISOString() };
            case 'last_30_days':
                return { start: startOfDay(subDays(today, 29)).toISOString(), end: endOfDay(today).toISOString() };
            case 'all_time':
                return { start: new Date(0).toISOString(), end: endOfDay(today).toISOString() };
            case 'custom':
                return { 
                    start: customRange.start ? startOfDay(new Date(customRange.start)).toISOString() : startOfDay(subDays(today, 6)).toISOString(), 
                    end: customRange.end ? endOfDay(new Date(customRange.end)).toISOString() : endOfDay(today).toISOString() 
                };
            case 'last_7_days':
            default:
                return { start: startOfDay(subDays(today, 6)).toISOString(), end: endOfDay(today).toISOString() };
        }
    }, [rangeType, customRange]);

    const queryClient = useQueryClient();

    const rangeOptions: SelectOption[] = useMemo(() => [
        ['today', t('Today')],
        ['yesterday', t('Yesterday')],
        ['last_7_days', t('Last_7_days')],
        ['last_30_days', t('Last_30_days')],
        ['all_time', t('All Time')],
        ['custom', t('Custom Range')],
    ], [t]);

    const reloadCharts = useEffectEvent(() => {
        queryClient.invalidateQueries({ queryKey: omnichannelQueryKeys.analytics.all(departmentId) });
    });

    useEffect(() => {
        const interval = setInterval(reloadCharts, reloadFrequency * 1000);

        return () => {
            clearInterval(interval);
        };
    }, [reloadCharts, reloadFrequency]);

    const reloadOptions = useMemo(
        () => [
            [5, <Fragment key='5 seconds'>5 {t('seconds')}</Fragment>] as unknown as SelectOption,
            [10, <Fragment key='10 seconds'>10 {t('seconds')}</Fragment>] as unknown as SelectOption,
            [30, <Fragment key='30 seconds'>30 {t('seconds')}</Fragment>] as unknown as SelectOption,
            [60, <Fragment key='1 minute'>1 {t('minute')}</Fragment>] as unknown as SelectOption,
        ],
        [t],
    );

    return (
        <Page bg='#f8f8f8'>
            <PageHeader title={t('Chatbot Conversation Monitoring')}>
                <Box display='flex' flexDirection='row' mis='auto' alignItems='center'>
                    <Box mie='x8'>{t('Show analysis from')}</Box>
                    <DateRangePicker 
                        onChange={setCustomRange} 
                        onRangeTypeChange={(val) => setRangeType(String(val))} 
                        rangeType={rangeType} 
                    />
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
                            paddingBlockEnd={12}
                            pis={10}
                            borderRadius='x8'
                        >
                        <Box fontScale="h3" color='black' mb="x8" style={{ lineHeight: 1 }}>
                            {t('Conversation Overview')}
                        </Box>
                        <ConversationOverview flexGrow={1} flexShrink={1} departmentId={departmentId} dateRange={dateRange} />
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
                    paddingBlockEnd={12}
                    pis={10}
                    paddingInlineEnd={6}
                    borderRadius='x8'
                >
                    <Box display='flex' flexDirection='column' w='full' alignItems='stretch' flexShrink={1}>
                        <Box fontScale="h3" mb="x8" fontSize="22px" w="100%" style={{ lineHeight: 1 }}>
                            {t('Chat Durations Overview')}
                        </Box>
                        <ChatsOverview flexGrow={1} flexShrink={1} width='100%' departmentId={departmentId} dateRange={dateRange} />
                    </Box>
                </Box>

                <Box
                display='flex'
                flexDirection='column'
                flexGrow={2}
                flexShrink={1}
                flexBasis='0'
                minWidth='250px'
                alignItems='stretch'
                bg='white'
                paddingBlockStart={12}
                pis={10}
                borderRadius='x8'
                >
                    <Box display='flex' flexDirection='column' w='full' alignItems='stretch' flexShrink={1}>
                        <Box fontScale="h4" mb="x8" fontSize="22px" w="100%">
                            {t('Issues Reported')}
                        </Box>
                        <AnalyticsOverview flexGrow={1} flexShrink={1} width='100%' departmentId={departmentId} dateRange={dateRange} />
                    </Box>
                </Box>

            </Box>
                         <Box display='flex'
							flexDirection='column'
							flexGrow={1}
							flexShrink={1}
							minWidth='250px'
							alignItems='stretch'
							bg='white'
							paddingBlockStart={12}
							pis={10}
							borderRadius='x8'>
                        <Box fontScale="h4" mb="x8" fontSize="22px" w="100%">
                            {t('Chat Duration Analysis')}
                        </Box>
                        <ChatDurationChart flexGrow={1} flexShrink={1} w='100%' departmentId={departmentId} dateRange={dateRange} />
                    </Box>
                    
                </Margins>
            </PageScrollableContentWithShadow>
        </Page>
    );
};

export default ConversationMonitoringRoute;
