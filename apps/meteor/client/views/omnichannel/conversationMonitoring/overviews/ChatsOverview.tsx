import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import type { Box } from '@rocket.chat/fuselage';
import { useQuery } from '@tanstack/react-query';
import CounterContainer from '../counter/CounterContainer';
import { ConversationMonitoringService } from '../ConversationMonitoring.service';
import type { ComponentPropsWithoutRef } from 'react';

// Reuse types from ConversationOverview.tsx
interface ConversationHistoryItem {
    [key: string]: any;
}

interface ConversationUserInfo {
    msisdn?: string;
    [key: string]: any;
}

interface ConversationContext {
    conversationHistory?: ConversationHistoryItem[];
    userInfo?: ConversationUserInfo;
    [key: string]: any;
}

interface Conversation {
    context?: ConversationContext;
    [key: string]: any;
}

interface AllConversationsResponse {
    conversations: Conversation[];
}

type ChatsOverviewProps = {
    departmentId: ILivechatDepartment['_id'];
    dateRange: { start: string; end: string };
} & ComponentPropsWithoutRef<typeof Box>;

function formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

const ChatsOverview = ({ departmentId, dateRange, ...props }: ChatsOverviewProps) => {
    const { data: allConversationsData = { conversations: [] } as AllConversationsResponse } = useQuery<AllConversationsResponse>({
        queryKey: ['allConversations'],
        queryFn: async (): Promise<AllConversationsResponse> => {
            const conversations = await ConversationMonitoringService.getAllConversations();
            return conversations;
        },
    });

    const conversations: Conversation[] = allConversationsData.conversations || [];

    // Calculate durations for each conversation
    const durations = conversations
        .map((conv: Conversation) => {
            const history: ConversationHistoryItem[] = conv.context?.conversationHistory || [];
            if (history.length < 2) return null;
            const first = history[0].timestamp ? new Date(history[0].timestamp).getTime() : null;
            const last = history[history.length - 1].timestamp
                ? new Date(history[history.length - 1].timestamp).getTime()
                : null;
            if (first !== null && last !== null && last >= first) {
                return last - first;
            }
            return null;
        })
        .filter((d): d is number => d !== null);

    const longestDuration = durations.length ? formatDuration(Math.max(...durations)) : '00:00:00';
    const shortestDuration = durations.length ? formatDuration(Math.min(...durations)) : '00:00:00';
    const averageDuration =
        durations.length ? formatDuration(durations.reduce((a, b) => a + b, 0) / durations.length) : '00:00:00';

    const totals = [
        { title: 'Longest chat duration', value: longestDuration },
        { title: 'Shortest chat duration', value: shortestDuration },
        { title: 'Average chat duration', value: averageDuration },
    ];

    return <CounterContainer totals={totals} {...props} />;
};

export default ChatsOverview;