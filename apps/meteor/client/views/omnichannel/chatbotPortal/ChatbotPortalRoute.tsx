import React, { useState } from 'react';
import { Box, Button, ButtonGroup, Margins } from '@rocket.chat/fuselage';

import FAQ from './pages/faq';
import Fact from './pages/fact';
import Conversation from './pages/conversation';
import Analytics from './pages/analytics';
import VoiceProcessing from './pages/voice';
import WebScraping from './pages/webscraping';

type Selected = 'FAQ' | 'Fact' | 'Conversation' | 'Analytics' | 'Voice Processing'| 'Web Scraping';

const ChatbotPortalRoute = () => {
  const [selected, setSelected] = useState<Selected>('FAQ');

  return (
    <Box style={{ fontFamily: 'Inter, sans-serif' }}>
      <Box p='x12'>
        <h1 style={{ fontWeight: 700, fontSize: '2.25rem', marginLeft: '5px', marginBottom: 0 }}>Chatbot Portal</h1>
      </Box>

      <Box display='flex' flexDirection='row' pis='x12' pie='x12' pbs='0'>
          <Box position='relative' display='flex' flexDirection='column' margin='0 8px'>
            <Button
              primary={selected === 'FAQ'}
              type='button'
              onClick={() => setSelected('FAQ')}
              style={{
                padding: '8px 16px',
                fontSize: '16px',
                border: 'none',
                background: 'none',
                color: selected === 'FAQ' ? '#1d74f5' : '#1F2329',
              }}
            >
              FAQs
            </Button>
            {selected === 'FAQ' && (
              <Box position='absolute' insetBlockEnd='-1px' width='100%' height='2px' backgroundColor='#1d74f5' />
            )}
          </Box>
          <Box position='relative' display='flex' flexDirection='column' margin='0 8px'>
            <Button
              primary={selected === 'Fact'}
              type='button'
              onClick={() => setSelected('Fact')}
              style={{
                padding: '8px 16px',
                fontSize: '16px',
                border: 'none',
                background: 'none',
                color: selected === 'Fact' ? '#1d74f5' : '#1F2329',
              }}
            >
              Facts
            </Button>
            {selected === 'Fact' && (
              <Box position='absolute' insetBlockEnd='0px' width='100%' height='2px' backgroundColor='#1d74f5' />
            )}
          </Box>
          <Box position='relative' display='flex' flexDirection='column' margin='0 8px'>
            <Button
              primary={selected === 'Analytics'}
              type='button'
              onClick={() => setSelected('Analytics')}
              style={{
                padding: '8px 16px',
                fontSize: '16px',
                border: 'none',
                background: 'none',
                color: selected === 'Analytics' ? '#1d74f5' : '#1F2329',
              }}
            >
              Analytics
            </Button>
            {selected === 'Analytics' && (
              <Box position='absolute' insetBlockEnd='0px' width='100%' height='2px' backgroundColor='#1d74f5' />
            )}
          </Box>
          <Box position='relative' display='flex' flexDirection='column' margin='0 8px'>
            <Button
              primary={selected === 'Voice Processing'}
              type='button'
              onClick={() => setSelected('Voice Processing')}
              style={{
                padding: '8px 16px',
                fontSize: '16px',
                border: 'none',
                background: 'none',
                color: selected === 'Voice Processing' ? '#1d74f5' : '#1F2329',
              }}
            >
              Voice Processing
            </Button>
            {selected === 'Voice Processing' && (
              <Box position='absolute' insetBlockEnd='0px' width='100%' height='2px' backgroundColor='#1d74f5' />
            )}
          </Box>
          <Box position='relative' display='flex' flexDirection='column' margin='0 8px'>
            <Button
              primary={selected === 'Web Scraping'}
              type='button'
              onClick={() => setSelected('Web Scraping')}
              style={{
                padding: '8px 16px',
                fontSize: '16px',
                border: 'none',
                background: 'none',
                color: selected === 'Web Scraping' ? '#1d74f5' : '#1F2329',
              }}
            >
              Web Scraping
            </Button>
            {selected === 'Web Scraping' && (
              <Box position='absolute' insetBlockEnd='0px' width='100%' height='2px' backgroundColor='#1d74f5' />
            )}
          </Box>
        </Box>
        <hr style={{ border: '1px solid #e0e0e0', marginTop: '-1px', width: '100%' }} />

        <Box>
          {selected === 'FAQ' && <FAQ />}
          {selected === 'Fact' && <Fact />}
          {selected === 'Conversation' && <Conversation />}
          {selected === 'Analytics' && <Analytics />}
          {selected === 'Voice Processing' && <VoiceProcessing />}
          {selected === 'Web Scraping' && <WebScraping />}
        </Box>
    </Box>
  );
};

export default ChatbotPortalRoute;