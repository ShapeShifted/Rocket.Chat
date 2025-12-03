import React, { useState } from 'react';
import { Box, Button, ButtonGroup, Margins } from '@rocket.chat/fuselage';

import FAQ from './pages/faq';
import Fact from './pages/fact';
import Conversation from './pages/conversation';
import Analytics from './pages/analytics';
import VoiceProcessing from './pages/voice';

type Selected = 'FAQ' | 'Fact' | 'Conversation' | 'Analytics' | 'Voice Processing';

const ChatbotPortalRoute = () => {
  const [selected, setSelected] = useState<Selected>('FAQ');

  return (
    <Box p='x24' style={{ fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontWeight: 700, fontSize: '2.25rem', marginBottom: 0 }}>Chatbot Portal</h1>
      <div style={{ height: '1rem' }} />

      <Box mbe='x16'>
        <ButtonGroup>
          <Button primary={selected === 'FAQ'} type="button" onClick={() => setSelected('FAQ')}
            style={{ minWidth: 120, paddingLeft: 24, paddingRight: 24 , fontSize: '16px'}}>
            FAQs
          </Button>
          <Button primary={selected === 'Fact'} type="button" onClick={() => setSelected('Fact')}
            style={{ minWidth: 120, paddingLeft: 24, paddingRight: 24 , fontSize: '16px'}}>
            Facts
          </Button>
          <Button primary={selected === 'Conversation'} type="button" onClick={() => setSelected('Conversation')}
            style={{ minWidth: 120, paddingLeft: 24, paddingRight: 24 , fontSize: '16px'}}>
            Conversations
          </Button>
          <Button primary={selected === 'Analytics'} type="button" onClick={() => setSelected('Analytics')}
            style={{ minWidth: 120, paddingLeft: 24, paddingRight: 24 , fontSize: '16px'}}>
            Analytics
          </Button>
          <Button primary={selected === 'Voice Processing'} type="button" onClick={() => setSelected('Voice Processing')}
            style={{ minWidth: 120, paddingLeft: 24, paddingRight: 24 , paddingBottom: 12, lineHeight: 1.5, fontSize: '16px'}}>
            Voice Processing
          </Button>
        </ButtonGroup>
      </Box>

      <Margins block='x16'>
        <Box>
          {selected === 'FAQ' && <FAQ />}
          {selected === 'Fact' && <Fact />}
          {selected === 'Conversation' && <Conversation />}
          {selected === 'Analytics' && <Analytics />}
          {selected === 'Voice Processing' && <VoiceProcessing />}
        </Box>
      </Margins>
    </Box>
  );
};

export default ChatbotPortalRoute;