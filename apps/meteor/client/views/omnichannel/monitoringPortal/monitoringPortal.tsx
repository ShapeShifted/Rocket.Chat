import React, { useState } from 'react';
import { Box, Button } from '@rocket.chat/fuselage';
import { Page, PageHeader, PageScrollableContentWithShadow } from '../../../components/Page';
import RealTimeMonitoringPage from '../realTimeMonitoring/RealTimeMonitoringPage';
import ConversationMonitoringRoute from '../conversationMonitoring/ConversationMonitoringRoute';

const MonitoringPortal = () => {
    const [view, setView] = useState<'realtime' | 'archived'>('realtime');

    return (
        <Page>
            <PageHeader title="Agent & Chatbot Performance">
                {/* Add a Toggle Group in the Header for a clean look */}
                <Box display='flex' pb='x8'>
                    <Button 
                        small 
                        primary={view === 'realtime'} 
                        onClick={() => setView('realtime')}
                        mis='x8'
                        fontSize={16}
                    >
                        Agent Conversations
                    </Button>
                    <Button 
                        small 
                        primary={view === 'archived'} 
                        onClick={() => setView('archived')}
                        mis='x8'
                        fontSize={16}
                    >
                        Chatbot Conversations
                    </Button>
                </Box>
            </PageHeader>

            {/* This renders the selected component without changing its internal logic */}
            {view === 'realtime' ? <RealTimeMonitoringPage /> : <ConversationMonitoringRoute />}
        </Page>
    );
};

export default MonitoringPortal;