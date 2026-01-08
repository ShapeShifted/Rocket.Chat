import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import type { Box } from '@rocket.chat/fuselage';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { isWithinInterval } from 'date-fns';

import CounterContainer from '../counter/CounterContainer';
import { ConversationMonitoringService } from '../ConversationMonitoring.service';
import type { ComponentPropsWithoutRef } from 'react';

const iconMap: { [key: string]: JSX.Element } = {
    longestDuration: (
        <svg width="32" height="30" viewBox="0 0 32 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.4 25.6L2.72 29.28C2.21334 29.7867 1.63307 29.9003 0.979202 29.6208C0.325336 29.3413 -0.00106406 28.8411 2.60586e-06 28.12V3.2C2.60586e-06 2.32 0.313603 1.56693 0.940803 0.9408C1.568 0.314667 2.32107 0.00106667 3.2 0H28.8C29.68 0 30.4336 0.3136 31.0608 0.9408C31.688 1.568 32.0011 2.32107 32 3.2V22.4C32 23.28 31.6869 24.0336 31.0608 24.6608C30.4347 25.288 29.6811 25.6011 28.8 25.6H6.4ZM5.04 22.4H28.8V3.2H3.2V24.2L5.04 22.4ZM8 19.2H17.6C18.0533 19.2 18.4336 19.0464 18.7408 18.7392C19.048 18.432 19.2011 18.0523 19.2 17.6C19.1989 17.1477 19.0453 16.768 18.7392 16.4608C18.4331 16.1536 18.0533 16 17.6 16H8C7.54667 16 7.16693 16.1536 6.8608 16.4608C6.55467 16.768 6.40107 17.1477 6.4 17.6C6.39893 18.0523 6.55254 18.4325 6.8608 18.7408C7.16907 19.0491 7.5488 19.2021 8 19.2ZM8 14.4H24C24.4533 14.4 24.8336 14.2464 25.1408 13.9392C25.448 13.632 25.6011 13.2523 25.6 12.8C25.5989 12.3477 25.4453 11.968 25.1392 11.6608C24.8331 11.3536 24.4533 11.2 24 11.2H8C7.54667 11.2 7.16693 11.3536 6.8608 11.6608C6.55467 11.968 6.40107 12.3477 6.4 12.8C6.39893 13.2523 6.55254 13.6325 6.8608 13.9408C7.16907 14.2491 7.5488 14.4021 8 14.4ZM8 9.6H24C24.4533 9.6 24.8336 9.4464 25.1408 9.1392C25.448 8.832 25.6011 8.45227 25.6 8C25.5989 7.54773 25.4453 7.168 25.1392 6.8608C24.8331 6.5536 24.4533 6.4 24 6.4H8C7.54667 6.4 7.16693 6.5536 6.8608 6.8608C6.55467 7.168 6.40107 7.54773 6.4 8C6.39893 8.45227 6.55254 8.83253 6.8608 9.1408C7.16907 9.44907 7.5488 9.60213 8 9.6Z" fill="#8E8E8E"/>
        </svg>
    ),
    shortestDuration: (
        <svg width="32" height="30" viewBox="0 0 32 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.4 25.6L2.72 29.28C2.21334 29.7867 1.63307 29.9003 0.979202 29.6208C0.325336 29.3413 -0.00106406 28.8411 2.60586e-06 28.12V3.2C2.60586e-06 2.32 0.313603 1.56693 0.940803 0.9408C1.568 0.314667 2.32107 0.00106667 3.2 0H28.8C29.68 0 30.4336 0.3136 31.0608 0.9408C31.688 1.568 32.0011 2.32107 32 3.2V22.4C32 23.28 31.6869 24.0336 31.0608 24.6608C30.4347 25.288 29.6811 25.6011 28.8 25.6H6.4ZM5.04 22.4H28.8V3.2H3.2V24.2L5.04 22.4ZM8 19.2H17.6C18.0533 19.2 18.4336 19.0464 18.7408 18.7392C19.048 18.432 19.2011 18.0523 19.2 17.6C19.1989 17.1477 19.0453 16.768 18.7392 16.4608C18.4331 16.1536 18.0533 16 17.6 16H8C7.54667 16 7.16693 16.1536 6.8608 16.4608C6.55467 16.768 6.40107 17.1477 6.4 17.6C6.39893 18.0523 6.55254 18.4325 6.8608 18.7408C7.16907 19.0491 7.5488 19.2021 8 19.2ZM8 14.4H24C24.4533 14.4 24.8336 14.2464 25.1408 13.9392C25.448 13.632 25.6011 13.2523 25.6 12.8C25.5989 12.3477 25.4453 11.968 25.1392 11.6608C24.8331 11.3536 24.4533 11.2 24 11.2H8C7.54667 11.2 7.16693 11.3536 6.8608 11.6608C6.55467 11.968 6.40107 12.3477 6.4 12.8C6.39893 13.2523 6.55254 13.6325 6.8608 13.9408C7.16907 14.2491 7.5488 14.4021 8 14.4ZM8 9.6H24C24.4533 9.6 24.8336 9.4464 25.1408 9.1392C25.448 8.832 25.6011 8.45227 25.6 8C25.5989 7.54773 25.4453 7.168 25.1392 6.8608C24.8331 6.5536 24.4533 6.4 24 6.4H8C7.54667 6.4 7.16693 6.5536 6.8608 6.8608C6.55467 7.168 6.40107 7.54773 6.4 8C6.39893 8.45227 6.55254 8.83253 6.8608 9.1408C7.16907 9.44907 7.5488 9.60213 8 9.6Z" fill="#8E8E8E"/>
        </svg>
    ),
    averageDuration: (
        <svg width='32' height='23' viewBox='0 0 32 23' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path
                d='M15.9788 11.0199C14.4636 11.0199 13.1665 10.4804 12.0874 9.40134C11.0084 8.32231 10.4689 7.02518 10.4689 5.50994C10.4689 3.99471 11.0084 2.69758 12.0874 1.61855C13.1665 0.539515 14.4636 0 15.9788 0C17.4941 0 18.7912 0.539515 19.8702 1.61855C20.9493 2.69758 21.4888 3.99471 21.4888 5.50994C21.4888 7.02518 20.9493 8.32231 19.8702 9.40134C18.7912 10.4804 17.4941 11.0199 15.9788 11.0199ZM4.95895 19.2848V18.1828C4.95895 17.4022 5.16006 16.685 5.56229 16.0312C5.96451 15.3773 6.49806 14.8778 7.16293 14.5325C8.58633 13.8208 10.0327 13.2872 11.502 12.9318C12.9713 12.5764 14.4636 12.3983 15.9788 12.3974C17.4941 12.3965 18.9863 12.5746 20.4557 12.9318C21.925 13.2891 23.3713 13.8226 24.7947 14.5325C25.4605 14.8768 25.9945 15.3764 26.3968 16.0312C26.799 16.6859 26.9996 17.4032 26.9987 18.1828V19.2848C26.9987 20.0424 26.7292 20.6912 26.1901 21.2312C25.6511 21.7712 25.0023 22.0407 24.2437 22.0398H7.71392C6.9563 22.0398 6.30797 21.7702 5.76891 21.2312C5.22985 20.6921 4.95987 20.0433 4.95895 19.2848ZM7.71392 19.2848H24.2437V18.1828C24.2437 17.9303 24.1808 17.7007 24.055 17.4941C23.9292 17.2874 23.7625 17.1267 23.555 17.0119C22.3153 16.3921 21.0641 15.9274 19.8014 15.6179C18.5387 15.3085 17.2645 15.1533 15.9788 15.1523C14.6932 15.1514 13.419 15.3066 12.1563 15.6179C10.8936 15.9292 9.6424 16.3939 8.40266 17.0119C8.19604 17.1267 8.02936 17.2874 7.90264 17.4941C7.77591 17.7007 7.713 17.9303 7.71392 18.1828V19.2848ZM15.9788 8.26491C16.7365 8.26491 17.3852 7.99539 17.9252 7.45633C18.4652 6.91727 18.7347 6.26848 18.7338 5.50994C18.7329 4.75141 18.4634 4.10307 17.9252 3.56493C17.3871 3.02679 16.7383 2.75681 15.9788 2.75497C15.2194 2.75313 14.571 3.02312 14.0338 3.56493C13.4966 4.10674 13.2266 4.75508 13.2239 5.50994C13.2211 6.2648 13.4911 6.9136 14.0338 7.45633C14.5766 7.99906 15.2249 8.26859 15.9788 8.26491Z'
                fill='#8E8E8E'
            />
            <path
                d='M9.18324 11.6168C10.3776 11.6161 11.5549 11.749 12.715 12.0153C12.0614 12.103 11.4121 12.2249 10.7673 12.3809C9.29803 12.7363 7.85167 13.2698 6.42827 13.9815C6.22876 14.0851 6.04129 14.2029 5.86543 14.3343C4.85813 14.5931 3.85951 14.9689 2.86976 15.4623C2.69758 15.5579 2.55871 15.6919 2.45311 15.864C2.3475 16.0362 2.29504 16.2275 2.29581 16.438V17.3563H4.23308C4.2274 17.4473 4.22429 17.5391 4.22429 17.6318V18.7338C4.22468 19.0603 4.27506 19.3663 4.37513 19.6521H2.29581C1.66446 19.6521 1.12415 19.4275 0.674932 18.9783C0.225742 18.5291 0.000765829 17.9884 0 17.3563V16.438C0 15.7875 0.167558 15.1898 0.502746 14.6449C0.837934 14.1001 1.2826 13.6838 1.83665 13.396C3.02282 12.803 4.22812 12.3583 5.45255 12.0621C6.67698 11.766 7.92055 11.6176 9.18324 11.6168Z'
                fill='#8E8E8E'
            />
            <path
                d='M8.99957 1.83665C9.60708 1.83665 10.1724 1.94095 10.6958 2.14909C10.1983 2.77844 9.86327 3.47342 9.68993 4.2338C9.47349 4.2338 9.24339 4.13305 8.99957 4.13246C8.36669 4.13093 7.82638 4.35588 7.3787 4.80739C6.93101 5.2589 6.70606 5.79922 6.70376 6.42827C6.70147 7.0573 6.92644 7.59795 7.3787 8.05022C7.83097 8.50249 8.37129 8.72714 8.99957 8.72408C9.49117 8.72408 9.92762 8.58767 10.3093 8.31532C10.5422 8.699 10.8288 9.06104 11.1691 9.40134C11.3943 9.62648 11.6291 9.8278 11.8733 10.006C11.0519 10.6817 10.0942 11.0199 8.99957 11.0199C7.73688 11.0199 6.65593 10.5703 5.75674 9.6711C4.85755 8.77191 4.40795 7.69096 4.40795 6.42827C4.40795 5.16557 4.85755 4.08463 5.75674 3.18544C6.65593 2.28624 7.73688 1.83665 8.99957 1.83665Z'
                fill='#8E8E8E'
            />
            <path
                d='M22.8168 11.6168C21.6224 11.6161 20.4451 11.749 19.285 12.0153C19.9386 12.103 20.5879 12.2249 21.2327 12.3809C22.702 12.7363 24.1483 13.2698 25.5717 13.9815C25.7712 14.0851 25.9587 14.2029 26.1346 14.3343C27.1419 14.5931 28.1405 14.9689 29.1302 15.4623C29.3024 15.5579 29.4413 15.6919 29.5469 15.864C29.6525 16.0362 29.705 16.2275 29.7042 16.438V17.3563H27.7669C27.7726 17.4473 27.7757 17.5391 27.7757 17.6318V18.7338C27.7753 19.0603 27.7249 19.3663 27.6249 19.6521H29.7042C30.3355 19.6521 30.8759 19.4275 31.3251 18.9783C31.7743 18.5291 31.9992 17.9884 32 17.3563V16.438C32 15.7875 31.8324 15.1898 31.4973 14.6449C31.1621 14.1001 30.7174 13.6838 30.1634 13.396C28.9772 12.803 27.7719 12.3583 26.5475 12.0621C25.323 11.766 24.0795 11.6176 22.8168 11.6168Z'
                fill='#8E8E8E'
            />
            <path
                d='M23.0004 1.83665C22.3929 1.83665 21.8276 1.94095 21.3042 2.14909C21.8017 2.77844 22.1367 3.47342 22.3101 4.2338C22.5265 4.16688 22.7566 4.13305 23.0004 4.13246C23.6333 4.13093 24.1736 4.35588 24.6213 4.80739C25.069 5.2589 25.2939 5.79922 25.2962 6.42827C25.2985 7.0573 25.0736 7.59795 24.6213 8.05022C24.169 8.50249 23.6287 8.72714 23.0004 8.72408C22.5088 8.72408 22.0724 8.58767 21.6907 8.31532C21.4578 8.699 21.1712 9.06104 20.8309 9.40134C20.6057 9.62648 20.3709 9.8278 20.1267 10.006C20.9481 10.6817 21.9058 11.0199 23.0004 11.0199C24.2631 11.0199 25.3441 10.5703 26.2433 9.6711C27.1424 8.77191 27.592 7.69096 27.592 6.42827C27.592 5.16557 27.1424 4.08463 26.2433 3.18544C25.3441 2.28624 24.2631 1.83665 23.0004 1.83665Z'
                fill='#8E8E8E'
            />
        </svg>
    )
};

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

    const conversations: Conversation[] = useMemo(() => {
        const all = allConversationsData.conversations || [];
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);

        return all.filter((conv: Conversation) => {
            const history: ConversationHistoryItem[] = conv.context?.conversationHistory || [];
            const firstTs = history[0]?.timestamp;
            if (!firstTs) return false;
            const date = new Date(firstTs);
            return isWithinInterval(date, { start, end });
        });
    }, [allConversationsData, dateRange]);

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
        { title: 'Longest chat duration', value: longestDuration, icon: iconMap.longestDuration },
        { title: 'Shortest chat duration', value: shortestDuration, icon: iconMap.shortestDuration },
        { title: 'Average chat duration', value: averageDuration, icon: iconMap.averageDuration },
    ];

    return <CounterContainer totals={totals} variant='small-box' {...props} />;
};

export default ChatsOverview;