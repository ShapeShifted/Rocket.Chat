import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Button } from '@rocket.chat/fuselage';
import { ConversationService } from './services/conversation.service';

type Message = {
  role?: string;
  content?: string;
  timestamp?: string | number;
};

type ConversationBox = {
  sessionId?: string;
  phoneId?: string;
  conversation?: Message[];
};

const PAGE_SIZE = 8;
const LIST_MAX_HEIGHT = '70vh';

const ConversationManager: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationBox[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedBox, setSelectedBox] = useState<ConversationBox | null>(null);

  const load = async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const resp: any = await ConversationService.getConversations(p, PAGE_SIZE);
      let conversationsArray: any[] = [];
      let count = 0;

      if (Array.isArray(resp?.conversations)) {
        conversationsArray = resp.conversations;
        count = resp.count ?? conversationsArray.length;
      } else if (Array.isArray(resp?.documents)) {
        conversationsArray = resp.documents;
        count = resp.total ?? conversationsArray.length;
      } else if (Array.isArray(resp)) {
        conversationsArray = resp;
        count = conversationsArray.length;
      }

      let mapped: ConversationBox[] = [];
      if (resp.sessionID && resp.phone_id && resp.conversations) {
        // Combine arrays into objects
        mapped = resp.sessionID.map((sessionId: string, i: number) => ({
          sessionId,
          phoneId: resp.phone_id[i],
          conversation: resp.conversations[i],
        }));
      } else if (Array.isArray(conversationsArray)) {
        // ...your existing mapping for other formats...
        mapped = conversationsArray.map((item: any) => ({
          sessionId: item?.sessionId ?? item?._id ?? item?.id,
          phoneId: item?.phoneId ?? item?.msisdn ?? item?.phone ?? item?.context?.userInfo?.msisdn,
          conversation:
            item?.conversationHistory ??
            item?.context?.conversationHistory ??
            item?.conversation ??
            item?.messages ??
            item?.history ??
            [],
        }));
      }

      setConversations(mapped);
      setTotalPages(resp?.totalPages ?? Math.max(1, Math.ceil((resp.total ?? count) / PAGE_SIZE)));
      setPage(p);
    } catch (err: any) {
      setError(err?.message ?? String(err) ?? 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    load(newPage);
  };

  return (
    <Box style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 32, paddingRight: 8 }}>
        <h2 style={{ margin: 0, fontWeight: 700, fontSize: '28px' }}>Conversations</h2>
        <div style={{ width: 260 }} />
      </div>

      <div
        aria-live="polite"
        style={{
          maxHeight: LIST_MAX_HEIGHT,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingRight: 8,
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <table style={{ width: '100%', maxHeight: 350, overflowY: 'auto', borderCollapse: 'collapse', fontSize: '1rem' }}>
          <thead>
            <tr style={{ background: '#fff', textAlign: 'center' }}>
              <th style={{ width: '10%', minWidth: 120, maxWidth: 180, padding: '14px 0px 14px 72px', fontWeight: 700, borderBottom: '2px solid #000000', fontSize: "16px", textAlign: 'center'}}>Session</th>
              <th style={{ padding: '14px 0px 14px 72px', fontWeight: 700, borderBottom: '2px solid #000000', fontSize: "16px", textAlign: 'center'}}>Phone Number</th>
              <th style={{ padding: '14px 8px', fontWeight: 700, borderBottom: '2px solid #000000', fontSize: "16px", textAlign: 'center'}}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} style={{ padding: 24, textAlign: 'center', color: '#888' }}>Loading conversations...</td>
              </tr>
            ) : conversations.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: 24, textAlign: 'center', color: '#888' }}>No conversations found.</td>
              </tr>
            ) : (
              conversations.map((box, idx) => (
                <tr key={box.sessionId ?? `box-${idx}`} style={{ borderBottom: '1px solid #8e8e8e', textAlign: 'center' }}>
                  <td style={{ padding: '14px 0px 14px 72px', fontWeight: 500, textAlign: 'center' }}>{box.sessionId ?? '！'}</td>
                  <td style={{ padding: '14px 0px 14px 72px', fontWeight: 500, textAlign: 'center' }}>{box.phoneId ?? '！'}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <Button
                      primary
                      style={{
                        fontWeight: 600,
                        fontSize: '18px',
                        padding: '6px 22px',
                        borderRadius: 8,
                        background: '#156FF5',
                        border: 'none',
                        color: '#fff',
                        minWidth: 80,
                      }}
                      onClick={() => setSelectedBox(box)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* Pagination */}
      <Box marginBlockStart="x8" display="flex" alignItems="center" justifyContent="space-between">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '16px' }}>
          <Button small disabled={page <= 1} onClick={() => handlePageChange(page - 1)}
            style={{ fontSize: '16px' }}>
            Previous
          </Button>
          <span>Page</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={page}
            onChange={(e) => {
              const val = Math.max(1, Math.min(totalPages, Number(e.target.value)));
              if (val !== page) handlePageChange(val);
            }}
            style={{ width: 40, textAlign: 'center', fontSize: '16px' }}
          />
          <span>of {totalPages}</span>
          <Button small disabled={page >= totalPages} onClick={() => handlePageChange(page + 1)}
            style={{ fontSize: '16px' }}>
            Next
          </Button>
        </div>
      </Box>

      {/* Modal for Conversation Details */}
      {selectedBox && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10002,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          {/* backdrop */}
          <div
            onClick={() => setSelectedBox(null)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.55)',
            }}
          />
          {/* modal panel */}
          <div
            style={{
              position: 'relative',
              zIndex: 10003,
              background: '#fff',
              width: 'min(900px, 96%)',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: 12,
              padding: 32,
              boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
              minWidth: 400,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', marginBottom: 0 }}>
              
              <button
                aria-label="Close"
                onClick={() => setSelectedBox(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 22,
                  cursor: 'pointer',
                  padding: 6,
                  color: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 120 120" fill="#1f2329" xmlns="http://www.w3.org/2000/svg">
                <path d="M60 77.9348L21.9522 116.087C19.5435 118.478 16.4826 119.674 12.7696 119.674C9.05652 119.674 5.99565 118.478 3.58696 116.087C1.19565 113.696 0 110.652 0 106.957C0 103.261 1.19565 100.217 3.58696 97.8261L41.7391 59.6739L3.58696 21.9522C1.19565 19.5435 0 16.4826 0 12.7696C0 9.05652 1.19565 5.99565 3.58696 3.58695C5.97826 1.19565 9.02174 0 12.7174 0C16.413 0 19.4565 1.19565 21.8478 3.58695L60 41.7391L97.7217 3.58695C100.13 1.19565 103.191 0 106.904 0C110.617 0 113.678 1.19565 116.087 3.58695C118.696 6.19565 120 9.29565 120 12.887C120 16.4783 118.696 19.4652 116.087 21.8478L77.9348 59.6739L116.087 97.7217C118.478 100.13 119.674 103.191 119.674 106.904C119.674 110.617 118.478 113.678 116.087 116.087C113.478 118.696 110.383 120 106.8 120C103.217 120 100.226 118.696 97.8261 116.087L60 77.9348Z"/>
                </svg> Close
              </button>
            </div>
            <div style={{  position: 'relative', marginBottom: 10}}>
              <h2 style={{ margin: 0, fontWeight: 700, fontSize: '2rem' }}>Conversation</h2>
              <div style={{
                position: 'absolute',
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                gap: 18,
                fontWeight: 500,
                fontSize: '1.1rem',
                whiteSpace: 'nowrap'
              }}>
                <span>Mobile Number: {selectedBox.phoneId ?? '！'}</span>
                <span>Session: {selectedBox.sessionId ?? '！'}</span>
              </div>
            </div>
            <div style={{
        background: '#fff',
        borderRadius: 4,
        padding: '18px 5px',
        fontSize: '1.05rem',
        color: '#222',
        maxHeight: '60vh',
        overflowY: 'auto',
      }}>
        {Array.isArray(selectedBox.conversation) && selectedBox.conversation.length > 0 ? (
          selectedBox.conversation.map((message, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                marginBottom: 6, // reduced gap
              }}
            >
              <div
                style={{
                  minWidth: 90,
                  fontWeight: 700,
                  color: '#222',
                  fontSize: '1.08rem',
                  textAlign: 'right',
                  marginRight: 8,
                  marginTop: 0,
                  lineHeight: 1.5,
                  flexShrink: 0,
                }}
              >
                {message.role ? `${message.role.charAt(0).toUpperCase() + message.role.slice(1)}:` : ''}
              </div>
            <div style={{
                  background: 'transparent',
                  borderRadius: 6,
                  padding: 0,
                  fontWeight: 400,
                  color: '#222',
                  flex: 1,
                  wordBreak: 'break-word',
                  textAlign: 'left',
                  lineHeight: 1.5,
                }}
              >
                {message.content}
              </div>
            </div>
          ))
                ) : (
                  <div style={{ color: '#888' }}>No messages in this conversation.</div>
                )}
              </div>
          </div>
        </div>,
        document.body
      )}

      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </Box>
  );
};

export default ConversationManager;