import { Skeleton } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ComponentPropsWithoutRef } from 'react';
import { useTranslation } from 'react-i18next';

import CounterItem from './CounterItem';
import CounterRow from './CounterRow';

type CounterContainerProps = {
	totals: {
		title: string;
		value: number | string;
		icon: JSX.Element;
	}[];
	variant?: 'row' | 'column' | 'small-box';
} & Omit<ComponentPropsWithoutRef<typeof CounterRow>, 'data'>;

const CounterContainer = ({ totals, variant = 'row', ...props }: CounterContainerProps) => {
	const { t } = useTranslation();

	return (
		<CounterRow flexDirection={variant === 'small-box' ? 'column' : 'row'} 
		style={{ gap: variant === 'small-box' ? '12px': '8px' }} {...props}>
			{totals.map(({ title, value, icon }, i) => (
				<CounterItem
					key={i}
					title={title ? t(title as TranslationKey) : <Skeleton width='x60' />}
					count={value}
					icon={icon}
					variant={variant === 'small-box' ? 'small-box' : undefined}
				/>
			))}
		</CounterRow>
	);
};

export default CounterContainer;
