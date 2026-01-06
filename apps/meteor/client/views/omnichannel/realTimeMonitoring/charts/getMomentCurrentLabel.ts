import moment from 'moment-timezone';

export const getMomentCurrentLabel = (timestamp = Date.now()) => {
	const m = moment(timestamp).startOf('hour');
	const hour = m.hour();
	m.hour(hour - (hour % 2));

	return m.format('HH:mm');
};
