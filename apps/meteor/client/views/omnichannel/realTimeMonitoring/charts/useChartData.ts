import { useMemo } from 'react';
import { getMomentChartLabelsAndData } from './getMomentChartLabelsAndData';

export const useChartData = (allConversationsData: any) => {
    return useMemo(() => {
        const { labels, data: dataMap } = getMomentChartLabelsAndData('HH:mm');
        const conversations = allConversationsData?.conversations || [];

        for (const conv of conversations) {
            const history = conv.context?.conversationHistory || [];
            if (history.length < 2) continue;

            const firstTs = history[0].timestamp ? new Date(history[0].timestamp) : null;
            const lastTs = history[history.length - 1].timestamp ? new Date(history[history.length - 1].timestamp) : null;

            if (firstTs && lastTs && lastTs >= firstTs) {
                const hour = firstTs.getHours();
                const bucketHour = hour % 2 === 0 ? hour : hour - 1;
                const bucket = bucketHour.toString().padStart(2, '0') + ':00';
                
                const duration = lastTs.getTime() - firstTs.getTime();

                if (dataMap[bucket] !== undefined) {
                    dataMap[bucket] += duration;
                }
            }
        }

        const rawData = labels.map((label) => Math.floor(dataMap[label] / 1000));
        const max = Math.max(...rawData);
        const min = Math.min(...rawData);
        const normalizedData = rawData.map((val) => (max === min ? 0 : (val - min) / (max - min)));

        return { labels, data: normalizedData, rawData };
    }, [allConversationsData]);
};
