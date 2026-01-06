import type * as chartjs from 'chart.js';

import { t } from '../../../utils/lib/i18n';

type LineChartConfigOptions = Partial<{
	legends: boolean;
	anim: boolean;
	displayColors: boolean;
	smallTicks: boolean;
	tooltipCallbacks: any;
}>;

const lineChartConfiguration = ({
	legends = false,
	anim = false,
	tooltipCallbacks = {},
}: LineChartConfigOptions): Partial<chartjs.ChartConfiguration<'line', number, string>['options']> => {
	const config: chartjs.ChartConfiguration<'line', number, string>['options'] = {
		layout: {
			padding: {
				top: 10,
				bottom: 0,
			},
		},
		plugins: {
			legend: {
				display: legends,
				...(legends && {
					labels: {
						boxWidth: 16,
						font: {
							size: 11,
							weight: 'bold',
						},
						color: '#000000',
					},
				}),
			},
			tooltip: {
				usePointStyle: true,
				enabled: true,
				mode: 'point',
				yAlign: 'bottom',
				displayColors: true,
				...tooltipCallbacks,
			},
		},
		scales: {
			xAxis: {
				title: {
					display: true,
					text: t('Time (24 hour system)'),
					font: {
						weight: 'bold',
					},
					color: '#000000',
				},
				grid: {
					display: true,
					color: 'rgba(0, 0, 0, 0.03)',
				},
				ticks: {
					color: '#000000',
				},
			},
			yAxis: {
				title: {
					display: true,
					text: t('Duration'),
					font: {
						weight: 'bold',
					},
					color: '#000000',
				},
				grid: {
					display: true,
					color: 'rgba(0, 0, 0, 0.03)',
				},
				ticks: {
					color: '#000000',
					callback(val: any) {
						return val;
					},
				},
			},
		},
		hover: {
			intersect: false, // duration of animations when hovering an item
			mode: 'index',
		},
		responsive: true,
		maintainAspectRatio: false,
		...(!anim ? { animation: { duration: 0 } } : {}),
	};
	return config;
};

const doughnutChartConfiguration = (
	title: string,
	tooltipCallbacks = {},
): Partial<chartjs.ChartConfiguration<'doughnut', number, string>['options']> => ({
	layout: {
		padding: {
			top: 0,
			bottom: 0,
		},
	},
	plugins: {
		legend: {
			display: true,
			position: 'right',
			labels: {
				boxWidth: 20,
				color: '#000000',
			},
		},
		title: {
			display: true,
			text: title,
			color: '#000000',
		},
		tooltip: {
			enabled: true,
			mode: 'point',
			displayColors: true, // hide color box
			...tooltipCallbacks,
		},
	},
	// animation: {
	// 	duration: 0 // general animation time
	// },
	hover: {
		intersect: true, // duration of animations when hovering an item
	},
	responsive: true,
	maintainAspectRatio: false,
});

type ChartDataSet = {
	label: string;
	data: number[];
	backgroundColor: string;
	borderColor: string;
	borderWidth: number;
	fill: boolean;
};

export const drawLineChart = async (
	chart: HTMLCanvasElement,
	chartContext: chartjs.Chart<'line'> | undefined,
	chartLabels: string[],
	dataLabels: string[],
	dataSets: number[][],
	options: LineChartConfigOptions = {},
) => {
	if (!chart) {
		throw new Error('No chart element');
	}
	chartContext?.destroy();

	const colors = ['#2de0a5', '#ffd21f', '#f5455c', '#cbced1'];

	const datasets: ChartDataSet[] = [];

	chartLabels.forEach((chartLabel: string, index: number) => {
		datasets.push({
			label: t(chartLabel), // chart label
			data: dataSets[index], // data points corresponding to data labels, x-axis points
			backgroundColor: colors[index],
			borderColor: colors[index],
			borderWidth: 3,
			fill: false,
		});
	});

	const { default: Chart } = await import('chart.js/auto');
	return new Chart(chart, {
		type: 'line',
		data: {
			labels: dataLabels, // data labels, y-axis points
			datasets,
		},
		options: lineChartConfiguration(options),
	});
};

export const drawDoughnutChart = async (
	chart: chartjs.ChartItem,
	title: string,
	chartContext: chartjs.Chart<'doughnut'> | undefined,
	dataLabels: string[],
	dataPoints: number[],
	tooltipCallbacks = {},
) => {
	if (!chart) {
		throw new Error('No chart element');
	}
	chartContext?.destroy();

	const { default: Chart } = await import('chart.js/auto');
	return new Chart(chart, {
		type: 'doughnut',
		data: {
			labels: dataLabels, // data labels, y-axis points
			datasets: [
				{
					data: dataPoints, // data points corresponding to data labels, x-axis points
					backgroundColor: [
					'#2de0a5', // green
					'#3b82f6', // blue
					'#f5455c', // red
					'#ffd21f', // yellow
					'#a259f7', // purple
					'#ff8c42', // orange
					'#00bcd4', // cyan
					'#ff6f91', // pink
					],
					borderWidth: 0,
				},
			],
		},
		options: doughnutChartConfiguration(title, tooltipCallbacks),
	});
};

export const updateChart = async <TChartType extends chartjs.ChartType>(
	chart: chartjs.Chart<TChartType>,
	label: string,
	data: chartjs.DefaultDataPoint<TChartType>,
): Promise<void> => {
	if (chart.data?.labels?.indexOf(label) === -1) {
		// insert data
		chart.data.labels.push(label);
		chart.data.datasets.forEach((dataset: { data: any[] }, idx: number) => {
			dataset.data.push(data[idx]);
		});
	} else {
		// update data
		const index = chart.data?.labels?.indexOf(label);
		if (typeof index === 'undefined') {
			return;
		}

		chart.data.datasets.forEach((dataset: { data: { [x: string]: any } }, idx: number) => {
			dataset.data[index] = data[idx];
		});
	}

	chart.update();
};

export const resetChart = <TChartType extends chartjs.ChartType>(chart: chartjs.Chart<TChartType>): void => {
	chart.data.labels = [];
	chart.data.datasets.forEach((dataset) => {
		dataset.data = [];
	});

	chart.update();
};
