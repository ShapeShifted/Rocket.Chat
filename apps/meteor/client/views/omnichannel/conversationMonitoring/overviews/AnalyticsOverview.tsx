import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import type { Box } from '@rocket.chat/fuselage';
import { useQuery } from '@tanstack/react-query';
import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ConversationMonitoringService } from '../ConversationMonitoring.service';
import Chart from '../../realTimeMonitoring/charts/Chart';
import { drawDoughnutChart } from '../../../../../app/livechat/client/lib/chartHandler';
import type { ComponentPropsWithoutRef, MutableRefObject, FC } from 'react';

type AnalyticsOverviewProps = {
    departmentId: ILivechatDepartment['_id'];
    dateRange: { start: string; end: string };
} & ComponentPropsWithoutRef<typeof Box>;

const AnalyticsOverview: FC<AnalyticsOverviewProps> = ({ departmentId, dateRange, ...props }) => {
    const { t } = useTranslation();
    const canvas: MutableRefObject<HTMLCanvasElement | null> = useRef(null);
    const chartInstance = useRef<any>(null);

    const { data: analyticsData = { analytics: [] } } = useQuery({
        queryKey: ['allAnalytics', departmentId, dateRange],
        queryFn: () => ConversationMonitoringService.getAllAnalytics(),
        gcTime: 0,
    });

    // Count sessions per classifiedIssueType across all days
    const issueTypeCounts: Record<string, number> = {};
    for (const day of analyticsData.analytics || []) {
        for (const session of day.sessions || []) {
            const issueType = session.classifiedIssueType || 'Unclassified';
            issueTypeCounts[issueType] = (issueTypeCounts[issueType] || 0) + 1;
        }
    }

    const labels = Object.keys(issueTypeCounts).map((type) => type.replace(/_/g, ' '));
    const data = Object.values(issueTypeCounts);

    useEffect(() => {

        // Destroy previous chart instance if exists
        if (chartInstance.current) {
            chartInstance.current.destroy();
            chartInstance.current = null;
        }

		if (!canvas.current || !labels.length || !data.length) return;

        // Draw new chart and store the instance
        drawDoughnutChart(
            canvas.current,
            t(' '),
            undefined,
            labels,
            data,
        ).then((chart) => {
            chartInstance.current = chart;
        });

        // Cleanup on unmount
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }
        };
    }, [labels, data, t]);

	if (!labels.length || !data.length) {
        return (
            <div style={{ textAlign: 'center', padding: '2em' }}>
                {t('No data to display')}
            </div>
        );
    }

    return <Chart canvasRef={canvas} {...props} />;
};

export default AnalyticsOverview;