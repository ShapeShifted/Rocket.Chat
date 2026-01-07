import { Box } from '@rocket.chat/fuselage';
import type { MutableRefObject } from 'react';

type ChartProps = { canvasRef: MutableRefObject<HTMLCanvasElement | null> };

const style = {
	minHeight: '250px',
	overflow: 'hidden',
};
const Chart = ({ canvasRef, ...props }: ChartProps) => (
	<Box padding='x20' height='x300' {...props} style={{ overflow: 'hidden' }}>
		<canvas ref={canvasRef} style={style}></canvas>
	</Box>
);

export default Chart;
