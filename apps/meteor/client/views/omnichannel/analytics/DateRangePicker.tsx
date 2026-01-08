import { Box, InputBox, Label, Button, Icon } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { Moment } from 'moment';
import moment from 'moment';
import type { ComponentProps, FormEvent } from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

moment.locale('en');

type DateRangePickerProps = Omit<ComponentProps<typeof Box>, 'onChange'> & {
	onChange(range: { start: string; end: string }): void;
	onRangeTypeChange?: (type: string) => void;
	rangeType?: string;
	hideMenu?: boolean;
};

const formatToDateInput = (date: Moment) => date.format('YYYY-MM-DD');

const todayDate = formatToDateInput(moment());

const getWeekRange = (daysToSubtractFromStart: number, daysToSubtractFromEnd: number) => ({
	start: formatToDateInput(moment().subtract(daysToSubtractFromStart, 'day')),
	end: formatToDateInput(moment().subtract(daysToSubtractFromEnd, 'day')),
});

const DateRangePicker = ({ onChange = () => undefined, onRangeTypeChange, rangeType = 'last_7_days', hideMenu = false, ...props }: DateRangePickerProps) => {
	const { t } = useTranslation();
	const [range, setRange] = useState({ start: '', end: '' });

	const { start, end } = range;

	const handleStart = useEffectEvent(({ currentTarget }: FormEvent<HTMLInputElement>) => {
		const rangeObj = {
			start: currentTarget.value,
			end: range.end,
		};
		setRange(rangeObj);
		onChange(rangeObj);
	});

	const handleEnd = useEffectEvent(({ currentTarget }: FormEvent<HTMLInputElement>) => {
		const rangeObj = {
			end: currentTarget.value,
			start: range.start,
		};
		setRange(rangeObj);
		onChange(rangeObj);
	});

	const handleRange = useEffectEvent((range: { start: string; end: string }, type?: string) => {
		setRange(range);
		onChange(range);
		if (type && onRangeTypeChange) {
			onRangeTypeChange(type);
		}
	});

	useEffect(() => {
		if (rangeType === 'last_7_days' && !start && !end) {
			handleRange(getWeekRange(6, 0));
		}
	}, [handleRange, rangeType, start, end]);

	const items = useMemo(
		() => [
			{
				id: 'today',
				content: t('Today'),
				onClick: () => {
					handleRange(getWeekRange(0, 0), 'today');
				},
			},
			{
				id: 'yesterday',
				content: t('Yesterday'),
				onClick: () => {
					handleRange(getWeekRange(1, 1), 'yesterday');
				},
			},
			{
				id: 'last_7_days',
				content: t('Last_7_days'),
				onClick: () => {
					handleRange(getWeekRange(6, 0), 'last_7_days');
				},
			},
			{
				id: 'last_30_days',
				content: t('Last_30_days'),
				onClick: () => {
					handleRange(getWeekRange(29, 0), 'last_30_days');
				},
			},
			{
				id: 'all_time',
				content: t('All Time'),
				onClick: () => {
					handleRange({ start: formatToDateInput(moment(0)), end: todayDate }, 'all_time');
				},
			},
			{
				id: 'divider',
				type: 'divider' as const,
			},
			{
				id: 'customLabel',
				content: <Box fontScale='p2' color='annotation' mi='x12' mb='x4' style={{ cursor: 'default' }}>{t('Custom Range')}</Box>,
			},
			{
				id: 'customRange',
				content: (
					<Box onClick={(e: any) => e.stopPropagation()} style={{ cursor: 'default' }} mi='x12'>
						<Box display='flex' flexDirection='column' mi='neg-y4'>
							<Box mb='x8'>
								<Label mb='x4'>{t('Start')}</Label>
								<InputBox type='date' value={start} onChange={handleStart} max={todayDate} />
							</Box>
							<Box>
								<Label mb='x4'>{t('End')}</Label>
								<InputBox type='date' value={end} onChange={handleEnd} min={start} max={todayDate} />
							</Box>
						</Box>
					</Box>
				),
				disabled: true,
			},
		],
		[handleRange, t, start, end, handleStart, handleEnd],
	);

	const rangeOptions: Record<string, string> = useMemo(() => ({
		today: t('Today'),
		yesterday: t('Yesterday'),
		last_7_days: t('Last_7_days'),
		last_30_days: t('Last_30_days'),
		all_time: t('All Time'),
		custom: t('Custom Range'),
	}), [t]);

	return (
		<Box {...props}>
			<Box height='full' display='flex' flexDirection='row' width='224px'>
				{!hideMenu && (
					<GenericMenu
						items={items}
						title={rangeOptions[rangeType] || t('Custom Range')}
						placement='bottom-start'
						button={
							<Box
								display='flex'
								flexDirection='row'
								alignItems='center'
								paddingInline='x12'
								paddingBlock='x8'
								borderWidth='x1'
								borderStyle='solid'
								borderColor='extra-light'
								borderRadius='x4'
								backgroundColor='white'
								width='full'
								style={{ cursor: 'pointer' }}
							>
								<Box flexGrow={1} mie='x8' fontScale='p2' style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
									{rangeOptions[rangeType] || t('Custom Range')}
								</Box>
								<Icon name='chevron-down' size='x16' color='annotation' />
							</Box>
						}
					/>
				)}
				{hideMenu && (
					<Box display='flex' flexDirection='column' mi='neg-y4' width='full'>
						<Box mb='x8'>
							<Label mb='x4'>{t('Start')}</Label>
							<InputBox type='date' value={start} onChange={handleStart} max={todayDate} />
						</Box>
						<Box>
							<Label mb='x4'>{t('End')}</Label>
							<InputBox type='date' value={end} onChange={handleEnd} min={start} max={todayDate} />
						</Box>
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default DateRangePicker;
