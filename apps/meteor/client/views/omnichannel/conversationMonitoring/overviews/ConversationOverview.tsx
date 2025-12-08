import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useQuery } from '@tanstack/react-query';
import { ConversationMonitoringService } from '../ConversationMonitoring.service';
import CounterContainer from '../counter/CounterContainer';
import type { ComponentPropsWithoutRef, FC } from 'react';

interface ConversationHistoryItem {
	// unknown shape; only length is used, so keep flexible
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

type ConversationOverviewProps = {
	departmentId: ILivechatDepartment['_id'];
	dateRange: { start: string; end: string };
} & ComponentPropsWithoutRef<typeof Box>;

const ConversationOverview: FC<ConversationOverviewProps> = ({ departmentId, dateRange, ...props }: ConversationOverviewProps) => {
	const { data: allConversationsData = { conversations: [] } as AllConversationsResponse } = useQuery<AllConversationsResponse>({
		queryKey: ['allConversations'],
		queryFn: async (): Promise<AllConversationsResponse> => {
			const conversations = await ConversationMonitoringService.getAllConversations();
			return conversations;
		},
	});

	const conversations: Conversation[] = allConversationsData.conversations || [];

	// Total Conversations
	const totalConversations = conversations.length;

	// Total Messages
	const totalMessages: number = conversations.reduce((sum: number, conv: Conversation) => {
		const history: ConversationHistoryItem[] = conv.context?.conversationHistory || [];
		return sum + history.length;
	}, 0);

	// Total Visitors (unique msisdn)
	const msisdnSet = new Set(
		conversations
			.map((conv: Conversation) => conv.context?.userInfo?.msisdn)
			.filter(Boolean)
	);
	const totalVisitors = msisdnSet.size;

	// Total Days (unique dates from conversations)
    const dateSet = new Set(
        conversations
            .map((conv: Conversation) => {
                const history: ConversationHistoryItem[] = conv.context?.conversationHistory || [];
                const firstTs = history[0]?.timestamp;
                if (!firstTs) return null;
                const date = new Date(firstTs);
                // Format as YYYY-MM-DD
                return date.toISOString().slice(0, 10);
            })
            .filter(Boolean)
    );
    const totalDays = dateSet.size;

	const totals = [
		{ title: 'Total days', value: totalDays },
		{ title: 'Total_conversations', value: totalConversations },
		{ title: 'Total_messages', value: totalMessages },
		{ title: 'Total_visitors', value: totalVisitors },
	];

	return <CounterContainer totals={totals} {...props} />;
};

export default ConversationOverview;
