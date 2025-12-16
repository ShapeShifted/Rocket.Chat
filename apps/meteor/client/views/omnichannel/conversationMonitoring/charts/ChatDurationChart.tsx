import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import type { Box } from '@rocket.chat/fuselage';
import { useQuery } from '@tanstack/react-query';
import type * as chartjs from 'chart.js';
import type { TFunction } from 'i18next';
import type { ComponentPropsWithoutRef } from 'react';
import { useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';


import Chart from './Chart';
import { drawLineChart } from '../../../../../app/livechat/client/lib/chartHandler';
import { secondsToHHMMSS } from '../../../../../lib/utils/secondsToHHMMSS';
import { ConversationMonitoringService } from '../ConversationMonitoring.service';

type ChatDurationChartProps = {
    departmentId: ILivechatDepartment['_id'];
    dateRange: { start: string; end: string };
} & ComponentPropsWithoutRef<typeof Box>;

function getTimeFromTimestamp(ts: string | number): string {
    const date = new Date(ts);
    return date.toISOString().substr(11, 5); // "HH:MM"
}

const tooltipCallbacks = {
    callbacks: {
        title([ctx]: [chartjs.TooltipItem<'line'>]) {
            return ctx.label;
        },
        label(ctx: chartjs.TooltipItem<'line'>) {
            const { dataset, dataIndex } = ctx;
            // Access the original (raw) durations in seconds
            const rawDataset = (dataset as any).rawDataset;
            if (rawDataset && rawDataset[dataIndex] !== undefined) {
                // Format as MM:SS
                const seconds = rawDataset[dataIndex];
                const hhmmss = secondsToHHMMSS(seconds); // "HH:MM:SS"
                return `${dataset.label}: ${hhmmss}`;
            }
            // fallback to normalized value
            return `${dataset.label}: ${Number(ctx.raw).toFixed(2)}`;
        },
    },
};

const ChatDurationChart = ({ departmentId, dateRange, ...props }: ChatDurationChartProps) => {
    const { t } = useTranslation();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const chartRef = useRef<chartjs.Chart | null>(null);

    const { data: allConversationsData } = useQuery({
        queryKey: ['allConversations', departmentId, dateRange],
        queryFn: () => ConversationMonitoringService.getAllConversations(),
    });

	const getBucketLabel = (date: Date): string => {
    const hour = date.getHours();
    // Find the nearest odd hour less than or equal to current hour
    const bucketHour = hour % 2 === 0 ? hour - 1 : hour;
    // Clamp to 0 if negative
    const finalHour = bucketHour < 0 ? 0 : bucketHour;
    return finalHour.toString().padStart(2, '0') + ':00';
	};

    const { labels, data, rawData } = useMemo(() => {
        const timeDurations: Record<string, number> = {};
        const conversations = allConversationsData?.conversations || [];

        for (const conv of conversations) {
            const history = conv.context?.conversationHistory || [];
            if (history.length < 2) continue;
            const firstTs = history[0].timestamp ? new Date(history[0].timestamp) : null;
            const lastTs = history[history.length - 1].timestamp ? new Date(history[history.length - 1].timestamp): null;
            if (firstTs !== null && lastTs !== null && lastTs >= firstTs) {
                const bucket = getBucketLabel(firstTs);
                const duration = lastTs.getTime() - firstTs.getTime();
                timeDurations[bucket] = (timeDurations[bucket] || 0) + duration;
            }
        }

        const sortedLabels = Object.keys(timeDurations).sort();
        const rawData = sortedLabels.map((label) => Math.floor(timeDurations[label] / 1000));

        const max = Math.max(...rawData);
        const min = Math.min(...rawData);
        const normalizedData = rawData.map((val) => (max === min ? 0 : (val - min) / (max - min)));

        return { labels: sortedLabels, data: normalizedData, rawData };
    }, [allConversationsData]);

    useEffect(() => {
        let cancelled = false;

        if (!canvasRef.current) {
            return;
        }

        const canvas = canvasRef.current!;

        const createChart = async () => {
            // If a chart instance exists, destroy it before creating a new one.
            if (chartRef.current) {
                chartRef.current.destroy();
                chartRef.current = null;
            }

            const chart = await drawLineChart(
                canvas,
                undefined, // Pass undefined to create a new chart
                [t('Chat Duration')],
                labels,
                [data],
                {
                    legends: true,
                    anim: false, // Disable animation to prevent "wiggling" on update
                    smallTicks: true,
                    displayColors: false,
                    tooltipCallbacks,
                    scales: {
                        y: {
                            min: 0,
                            max: 1,
                        },
                    },
					rawDatasets: rawData,
                } as any,
            );

            // Attach rawDataset to the dataset for tooltip access
            if (chart && chart.data && chart.data.datasets && chart.data.datasets[0]) {
                (chart.data.datasets[0] as any).rawDataset = rawData;
            }

            if (cancelled) {
                chart.destroy();
                return;
            }

            chartRef.current = chart;
        };

        createChart();

        // Cleanup function to destroy the chart when the component unmounts
        return () => {
            cancelled = true;
            chartRef.current?.destroy();
            chartRef.current = null;
        };
    }, [data, labels, rawData, t]); // Re-create the chart only when data actually changes

    return <Chart canvasRef={canvasRef} {...props} />;
};

export default ChatDurationChart;