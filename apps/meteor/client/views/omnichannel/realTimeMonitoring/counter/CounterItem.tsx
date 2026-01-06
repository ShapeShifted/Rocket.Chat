import { Box } from '@rocket.chat/fuselage';

const CounterItem = ({
	title = '',
	count = '-',
	icon,
	variant,
	...props
}: {
	title: string | JSX.Element;
	count: string | number;
	icon: JSX.Element;
	variant?: 'small-box';
	flexShrink?: number;
	pb?: number;
	flexBasis?: string;
}) => {
	if (variant === 'small-box') {
		return (
			<Box display='flex' flexDirection='row' alignItems='center' pb='x4' {...props}>
				<Box display='flex' alignItems='center' justifyContent='center' marginInlineEnd={8}>
					{icon}
				</Box>
				<Box display='flex' flexDirection='column' alignItems='flex-start'>
					<Box fontScale='p2b' color='hint'>
						{title}
					</Box>
					<Box fontScale='h3' color='default'>
						{count}
					</Box>
				</Box>
			</Box>
		);
	}

	return (
		<Box display='flex' flexDirection='column' justifyContent='space-between' alignItems='center' flexGrow={1} {...props}>
			<Box fontScale='h4' textTransform='uppercase' color='hint' textAlign='center' pi={8}>
				{title}
			</Box>
			<Box fontScale='h2'>{count}</Box>
		</Box>
	);
};

export default CounterItem;
