import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type * as chartjs from 'chart.js';
import type { TFunction } from 'i18next';
import { type MutableRefObject } from 'react';

import { updateChart } from '../../../../../app/livechat/client/lib/chartHandler';

type UseUpdateChartDataOptions<TChart> = {
	context: TChart | undefined;
	canvas: MutableRefObject<HTMLCanvasElement | null>;
	init: (canvas: HTMLCanvasElement, context: TChart | undefined, t: TFunction) => Promise<TChart>;
	t: TFunction;
};

export function useUpdateChartData<TChartType extends chartjs.ChartType>({
    canvas: canvasRef,
    context,
    init,
    t,
}: UseUpdateChartDataOptions<chartjs.Chart<TChartType>>) {
    return useEffectEvent(async (label: string, data: number[]) => {
        // 1. Initial check
        if (!canvasRef.current) {
            return;
        }

        try {
            // 2. If context doesn't exist, init it. 
            // Note: If this takes time, the component might unmount!
            const chartContext = context ?? (await init(canvasRef.current, undefined, t));

            // 3. POST-AWAIT CHECK (Crucial)
            // Verify the canvas hasn't been wiped from the DOM while we were waiting
            if (!canvasRef.current || !chartContext) {
                return;
            }

            // 4. Validate the chart internal state
            // Chart.js stores the canvas in chartContext.canvas
            if (!chartContext.canvas || !document.body.contains(chartContext.canvas)) {
                return;
            }

            await updateChart(chartContext, label, data);
        } catch (error) {
            console.error('Failed to update chart data:', error);
        }
    });
}
