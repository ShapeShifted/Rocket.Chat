import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Button } from '@rocket.chat/fuselage';
import { AnalyticsService } from './services/analytics.service';

type Message = {
  role?: string;
  content?: string;
  timestamp?: string | number;
};

type Analytics = {
  sessionId?: string;
  phoneNumber?: string;
  classifiedIssueType?: string;
  _id?: string;
};

type ConversationBox = {
  sessionId?: string;
  phoneId?: string;
  conversation?: Message[];
};

type SessionGroup = {
  date: string;
  analytics: Analytics[];
};

const PAGE_SIZE = 8;
const LIST_MAX_HEIGHT = '70vh';

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionGroup[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionGroup | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState<string>('1');
  const [calendarDate, setCalendarDate] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<ConversationBox | null>(null);
  const [loadingConversation, setLoadingConversation] = useState(false);

  // Load analytics data
  const load = async (p = 1, date = '') => {
    setLoading(true);
    setError(null);
    try {
      let resp;
      console.log('Loading analytics for date:', date);
      if (date) {
        resp = await AnalyticsService.searchAnalytics(date);
      } else {
        resp = await AnalyticsService.getAnalytics(p, PAGE_SIZE);
      }
      let mapped: SessionGroup[] = [];
      if (resp?.analytics && Array.isArray(resp.analytics.sessions)) {
        mapped = [{
        date: resp.date ?? date,
        analytics: resp.analytics.sessions,
      }];
      } else if (Array.isArray(resp?.date) && Array.isArray(resp?.sessions)) {
        mapped = resp.date.map((dateStr: string, idx: number) => ({
        date: dateStr,
        analytics: Array.isArray(resp.sessions[idx]) ? resp.sessions[idx] : [],
      }));
      }
      setSessions(mapped);
      setTotalPages(resp?.totalPages ?? 1);
      setPage(p);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  // Calendar change handler
  const handleCalendarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCalendarDate(e.target.value);
  };

  // Calendar search handler
  const handleCalendarSearch = () => {
    if (calendarDate) {
      load(1, calendarDate);
    }
  };

  // Pagination
  const handlePageChange = (newPage: number) => {
    load(newPage, calendarDate);
  };

  const handleViewConversation = async (sessionId: string) => {
  setLoadingConversation(true);
  try {
    const res = await AnalyticsService.searchConversations(sessionId, 1, 1); // sessionID is unique
    if (res.sessionID && res.phone_id && res.conversations) {
      const idx = res.sessionID.findIndex((id: string) => id === sessionId);
      if (idx !== -1) {
        setSelectedConversation({
          sessionId: res.sessionID[idx],
          phoneId: res.phone_id[idx],
          conversation: res.conversations[idx],
        });
      }
    }
  } catch (err) {
    setSelectedConversation(null);
  } finally {
    setLoadingConversation(false);
  }
};

  return (
    <Box style={{ maxWidth: 1200, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
        gap: 32,
        paddingRight: 8,
      }}>
        <h2 style={{ margin: 0, fontWeight: 700, fontSize: '28px' }}>Analytics</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative' }}></div>
          <input
            type="date"
            value={calendarDate}
            onChange={e => {
              setCalendarDate(e.target.value);
              if (e.target.value) {
                load(1, e.target.value); // Automatically search when date changes
              }else {
                load(1, ''); // Reload default state when date is cleared
              }
            }}
            placeholder="yyyy-mm-dd"
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #ccc',
              fontSize: '16px',
              width: 160,
              boxSizing: 'border-box',
              marginRight: 8,
            }}
          />
        </div>
      </div>

      {loading && <div>Loading analytics...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && sessions.length === 0 && <div>No analytics data found.</div>}

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
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
            <thead>
              <tr style={{ background: '#fff', textAlign: 'center' }}>
                <th style={{
                  width: '20%',
                  minWidth: 120,
                  maxWidth: 180,
                  padding: '14px 8px',
                  fontWeight: 700,
                  borderBottom: '2px solid #000000',
                  fontSize: "16px",
                  textAlign: 'center'
                }}>Date</th>
                <th style={{
                  padding: '14px 8px',
                  fontWeight: 700,
                  borderBottom: '2px solid #000000',
                  fontSize: "16px",
                  textAlign: 'center'
                }}>Conversations</th>
                <th style={{
                  padding: '14px 8px',
                  fontWeight: 700,
                  borderBottom: '2px solid #000000',
                  fontSize: "16px",
                  textAlign: 'center'
                }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: 24, textAlign: 'center', color: '#888' }}>No analytics data found.</td>
                </tr>
              ) : (
                sessions.map((session, idx) => {
                  console.log('session.date:', session.date);
                  return (
                    <tr key={session.date ?? idx} style={{ borderBottom: '1px solid #e4e7ea', textAlign: 'center' }}>
                      <td style={{
                        padding: '14px 8px',
                        fontWeight: 500,
                        textAlign: 'center'
                      }}>{session.date
                          ? new Date(session.date).toISOString().slice(0, 10)
                          : '！'}</td>
                      <td style={{
                        padding: '14px 8px',
                        fontWeight: 500,
                        textAlign: 'center'
                      }}>
                        {session.analytics.length} Conversation{session.analytics.length !== 1 ? 's' : ''}
                      </td>
                      <td style={{
                        padding: '14px 8px',
                        textAlign: 'center'
                      }}>
                        <Button
                          primary
                          style={{
                            fontWeight: 600,
                            fontSize: '16px',
                            padding: '6px 22px',
                            borderRadius: 8,
                            background: '#156FF5',
                            border: 'none',
                            color: '#fff',
                            minWidth: 80,
                          }}
                          onClick={() => setSelectedSession(session)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })
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
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            min={1}
            max={totalPages}
            value={pageInput}
            onChange={e => {
              const val = e.target.value;
              if (val === '' || Number(val) >= 1) {
                setPageInput(val);
              }
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const val = Math.max(1, Math.min(totalPages, Number(pageInput) || 1));
                if (val !== page) handlePageChange(val);
              }
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

      {/* Modal for Session Details */}
      {selectedSession && createPortal(
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
            onClick={() => setSelectedSession(null)}
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
          onClick={() => setSelectedSession(null)}
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
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontWeight: 700, fontSize: '2rem' }}>
          Conversation on {selectedSession.date}
        </h2>
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
        {Array.isArray(selectedSession.analytics) && selectedSession.analytics.length > 0 ? (
          selectedSession.analytics.map((conv, idx) => (
            <div
              key={conv.sessionId ?? conv._id ?? idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: idx < selectedSession.analytics.length - 1 ? '1px solid #e4e7ea' : 'none',
                padding: '14px 0',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>
                  Session ID: <span style={{ fontWeight: 400 }}>{conv.sessionId ?? '！'}</span>
                </div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>
                  Phone Number: <span style={{ fontWeight: 400 }}>{conv.phoneNumber ?? '！'}</span>
                </div>
                <div style={{ fontWeight: 600 }}>
                  Classified Issue Type: <span style={{ fontWeight: 400 }}>{conv.classifiedIssueType ?? '！'}</span>
                </div>
              </div>
              <div>
                <Button
                  primary
                  style={{
                    fontWeight: 600,
                    fontSize: '16px',
                    padding: '8px 20px',
                    borderRadius: 8,
                    background: '#1677ff',
                    border: 'none',
                    minWidth: 120,
                  }}
                  onClick={() => handleViewConversation(conv.sessionId ?? '')}
                >
                  View Conversation
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ color: '#888' }}>No conversations found for this date.</div>
            )}
          </div>
        </div>
        </div>,
        document.body
      )}

      {selectedConversation && createPortal(
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
      onClick={() => {
        setSelectedConversation(null);
        setSelectedSession(null);
      }}  
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 0 }}>
        <button
          aria-label="Back"
          onClick={() => setSelectedConversation(null)}
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
          &lt; Back to Analytics
        </button>
        <button
          aria-label="Close"
          onClick={() => {setSelectedConversation(null); setSelectedSession(null);}}
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
      <div style={{ position: 'relative', marginBottom: 10 }}>
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
          <span>Mobile Number: {selectedConversation.phoneId ?? '！'}</span>
          <span>Session: {selectedConversation.sessionId ?? '！'}</span>
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
        {Array.isArray(selectedConversation.conversation) && selectedConversation.conversation.length > 0 ? (
          selectedConversation.conversation.map((message, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                marginBottom: 6,
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
              }}>
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
    </Box>
  );
};

export default Analytics;