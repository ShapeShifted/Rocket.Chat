 import type { Box } from '@rocket.chat/fuselage';
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
		icon?: JSX.Element;
	}[];
	variant?: 'row' | 'column' | 'small-box';
} & Omit<ComponentPropsWithoutRef<typeof Box>, 'data'>;

const CounterContainer = ({ totals, variant, ...props }: CounterContainerProps) => {
	const { t } = useTranslation();

	return (
		<CounterRow
			flexDirection={variant === 'small-box' ? 'column' : 'row'}
			style={{ gap: variant === 'small-box' ? '12px' : '8px' }}
			justifyContent={variant === 'small-box' ? 'flex-start' : 'space-around'}
			alignItems={variant === 'small-box' ? 'flex-start' : 'center'}
			pi={variant === 'small-box' ? 0 : 20}
			{...props}
		>
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
