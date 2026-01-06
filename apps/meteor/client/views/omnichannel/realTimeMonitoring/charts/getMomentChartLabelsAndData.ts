import moment from 'moment-timezone';

export const getMomentChartLabelsAndData = (timestamp = Date.now()) => {
	const timingLabels = [];
	const initData = [];
	const today = moment(timestamp).startOf('day');
	for (let m = today; m.diff(moment(timestamp), 'hours') <= 0; m.add(2, 'hours')) {
		timingLabels.push(m.format('HH:mm'));
		initData.push(0);
	}

	return [timingLabels, initData] as const;
};
