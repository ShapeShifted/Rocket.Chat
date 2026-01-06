import { Box, Divider } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Fragment } from 'react';
import flattenChildren from 'react-keyed-flatten-children';

type CounterRowProps = {
	children?: ReactNode[];
} & ComponentPropsWithoutRef<typeof Box>;

const CounterRow = ({ children, ...props }: CounterRowProps) => {
	const { flexDirection = 'row' } = props;
	return (
		<Box
			pb={8}
			pi={20}
			display='flex'
			flexDirection={flexDirection}
			justifyContent='space-around'
			alignItems={flexDirection === 'column' ? 'stretch' : 'center'}
			flexGrow={1}
			borderRadius='x16'
			{...props}
		>
			{children &&
				flattenChildren(children).reduce(
					(acc, child, i) =>
						children.length - 1 !== i
							? [
									...acc,
									<Fragment key={i}>{child}</Fragment>,
									<Divider key={(i + 1) * children.length} width='x2' m='none' alignSelf='stretch' />,
								]
							: [...acc, child],
					[] as ReactNode[],
				)}
		</Box>
	);
};

export default CounterRow;
