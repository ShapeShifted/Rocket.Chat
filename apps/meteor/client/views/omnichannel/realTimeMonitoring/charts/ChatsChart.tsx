import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import type { Box } from '@rocket.chat/fuselage';
import { useEndpoint, type TranslationKey } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type * as chartjs from 'chart.js';
import type { TFunction } from 'i18next';
import type { ComponentPropsWithoutRef, MutableRefObject } from 'react';
import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Chart from './Chart';
import { useChartContext } from './useChartContext';
import { useUpdateChartData } from './useUpdateChartData';
import { drawDoughnutChart } from '../../../../../app/livechat/client/lib/chartHandler';
import { omnichannelQueryKeys } from '../../../../lib/queryKeys';

const labels = ['Open', 'Queued', 'On_Hold_Chats', 'Closed'];

const initialData = {
	open: 0,
	queued: 0,
	onhold: 0,
	closed: 0,
};

// Updated init function to be async and defensive
const init = async (canvas: HTMLCanvasElement, context: chartjs.Chart<'doughnut'> | undefined, t: TFunction) => {
	// 1. Clean up existing context passed from the hook
	context?.destroy();

	// 2. Fail-safe: Check the global Chart.js registry for this canvas
	const { default: ChartJs } = await import('chart.js/auto');
	const existingChart = ChartJs.getChart(canvas);
	if (existingChart) {
		existingChart.destroy();
	}

	// 3. Create the new chart
	return drawDoughnutChart(
		canvas,
		'',
		undefined, // Pass undefined because we've already handled destruction above
		labels.map((l) => t(l as TranslationKey)),
		Object.values(initialData),
	);
};

type ChatsChartProps = {
	departmentId: ILivechatDepartment['_id'];
	dateRange: { start: string; end: string };
} & ComponentPropsWithoutRef<typeof Box>;

const ChatsChart = ({ departmentId, dateRange, ...props }: ChatsChartProps) => {
	const { t } = useTranslation();

	const canvas: MutableRefObject<HTMLCanvasElement | null> = useRef(null);

	const getChats = useEndpoint('GET', '/v1/livechat/analytics/dashboards/charts/chats');
	const { isSuccess, data } = useQuery({
		queryKey: omnichannelQueryKeys.analytics.chats(departmentId, dateRange),
		queryFn: () => getChats({ departmentId, ...dateRange }),
		gcTime: 0,
	});

	const context = useChartContext({
		canvas,
		init,
		t,
	});

	// Note: updateChartData might be redundant now that you are handling 
	// the update logic directly in the useEffect below.
	const updateChartData = useUpdateChartData({
		context,
		canvas,
		init,
		t,
	});

	const { open, queued, closed, onhold } = data ?? initialData;

	useEffect(() => {
		if (!context || !isSuccess || !canvas.current) {
			return;
		}

		const dataWithLabels = [
			{ label: t('Open'), value: open },
			{ label: t('Closed'), value: closed },
			{ label: t('On_Hold_Chats'), value: onhold },
			{ label: t('Queued'), value: queued },
		];

		if (context.data.labels && context.data.datasets) {
			context.data.labels = dataWithLabels.map((d) => `${d.label} (${d.value})`);
			context.data.datasets[0].data = dataWithLabels.map((d) => d.value);
			context.update();
		}
	}, [context, closed, open, queued, onhold, isSuccess, t]);

	useEffect(() => {
		return () => {
			if (context) {
				context.destroy();
			}
		};
	}, [context]);

	return <Chart canvasRef={canvas} {...props} />;
};

export default ChatsChart;