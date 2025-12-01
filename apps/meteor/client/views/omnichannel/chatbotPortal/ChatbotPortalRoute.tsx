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
    <Box p='x24'>
      <h1>Chatbot Portal</h1>

      <Box mbe='x16'>
        <ButtonGroup>
          <Button primary={selected === 'FAQ'} type="button" onClick={() => setSelected('FAQ')}>
            FAQ
          </Button>
          <Button primary={selected === 'Fact'} type="button" onClick={() => setSelected('Fact')}>
            Fact
          </Button>
          <Button primary={selected === 'Conversation'} type="button" onClick={() => setSelected('Conversation')}>
            Conversation
          </Button>
          <Button primary={selected === 'Analytics'} type="button" onClick={() => setSelected('Analytics')}>
            Analytics
          </Button>
                    <Button primary={selected === 'Voice Processing'} type="button" onClick={() => setSelected('Voice Processing')}>
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