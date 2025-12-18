import type { SelectOption } from '@rocket.chat/fuselage';
import { Box, Margins } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useEffect, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { subDays, startOfDay, endOfDay } from 'date-fns';

import { Page, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';
import { getDateRange } from '../../../lib/utils/getDateRange';
import AnalyticsOverview from './overviews/AnalyticsOverview';
import ChatDurationChart from './charts/ChatDurationChart';
import ChatsOverview from './overviews/ChatsOverview';
import ConversationOverview from './overviews/ConversationOverview';
import { omnichannelQueryKeys } from '../../../lib/queryKeys';

const today = new Date();
const dateRange = {
    start: startOfDay(subDays(today, 6)).toISOString(), // 6 days ago, start of day
    end: endOfDay(today).toISOString(),                 // today, end of day
};

const ConversationMonitoringRoute = () => {
    const { t } = useTranslation();

    const [reloadFrequency, setReloadFrequency] = useState(5);
    const [departmentId, setDepartment] = useState('');

    const queryClient = useQueryClient();

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
        <Page>
            <PageHeader title={t('Chatbot Conversation Monitoring')} />
            <PageScrollableContentWithShadow>
                <Margins block='x4'>
                    <Box flexDirection='row' display='flex' justifyContent='space-between' alignSelf='center' w='full'>
                        
                    </Box>
                    <Box display='flex' flexDirection='column' w='full' alignItems='stretch' flexShrink={1}>
                        <Box fontScale="h4" mb="x8" fontSize="22px" w="100%">
                            {t('Conversation Overview')}
                        </Box>
                        <ConversationOverview flexGrow={1} flexShrink={1} width='100%' departmentId={departmentId} dateRange={dateRange} />
                    </Box>
    
                    <Box display='flex' flexDirection='column' w='full' alignItems='stretch' flexShrink={1}>
                        <Box fontScale="h4" mb="x8" fontSize="22px" w="100%">
                            {t('Chat Durations Overview')}
                        </Box>
                        <ChatsOverview flexGrow={1} flexShrink={1} width='100%' departmentId={departmentId} dateRange={dateRange} />
                    </Box>

                    <Box display='flex' flexDirection='column' w='full' alignItems='stretch' flexShrink={1}>
                        <Box fontScale="h4" mb="x8" fontSize="22px" w="100%">
                            {t('Chat Durations Across One Week')}
                        </Box>
                        <ChatDurationChart flexGrow={1} flexShrink={1} w='100%' departmentId={departmentId} dateRange={dateRange} />
                    </Box>

                    <Box display='flex' flexDirection='column' w='full' alignItems='stretch' flexShrink={1}>
                        <Box fontScale="h4" mb="x8" fontSize="22px" w="100%">
                            {t('Types of Issues Reported')}
                        </Box>
                        <AnalyticsOverview flexGrow={1} flexShrink={1} width='100%' departmentId={departmentId} dateRange={dateRange} />
                    </Box>
                </Margins>
            </PageScrollableContentWithShadow>
        </Page>
    );
};

export default ConversationMonitoringRoute;
