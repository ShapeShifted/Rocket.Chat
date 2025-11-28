import React, { useEffect, useState } from 'react';
import { Box } from '@rocket.chat/fuselage';
import { AnalyticsService } from './services/analytics.service';

type Analytics = {
  sessionId?: string;
  phoneNumber?: string;
  classifiedIssueType?: string;
  _id?: string;
};

type SessionGroup = {
  date: string;
  analytics: Analytics[];
};

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionGroup[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionGroup | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    AnalyticsService.getAnalytics(1, 100)
      .then((resp) => {
        // Map API response to SessionGroup[]
        let mapped: SessionGroup[] = [];
        if (Array.isArray(resp?.date) && Array.isArray(resp?.sessions)) {
          mapped = resp.date.map((dateStr: string, idx: number) => ({
            date: dateStr,
            analytics: Array.isArray(resp.sessions[idx]) ? resp.sessions[idx] : [],
          }));
        }
        setSessions(mapped);
      })
      .catch((err) => setError(err?.message ?? String(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <h2 className="text-3xl font-bold text-green-700 mb-6">Analytics</h2>
      {loading && <div className="text-gray-500">Loading analytics...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && !error && (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="text-gray-500">No analytics data found.</div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.date}
                className="bg-white rounded-lg shadow border border-gray-200 p-5 flex items-center justify-between transition hover:shadow-md cursor-pointer"
                onClick={() => setSelectedSession(session)}
              >
                <div>
                  <div className="font-semibold text-green-700 text-lg mb-1">
                    {session.date}
                  </div>
                  <div className="text-gray-600 text-sm">
                    {session.analytics.length} conversation{session.analytics.length > 1 ? 's' : ''}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSession(session);
                    }}
                  >
                    View
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {/* Modal for Session Details */}
      {selectedSession && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: '2rem',
              maxWidth: 600,
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              position: 'relative',
              boxShadow: '0 4px 32px rgba(0,0,0,0.15)',
            }}
          >
            <button
              onClick={() => setSelectedSession(null)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                fontSize: 24,
                color: '#888',
                cursor: 'pointer',
              }}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold text-green-700 mb-4">
              Conversations on {selectedSession.date}
            </h2>
            {selectedSession.analytics.length === 0 ? (
              <div className="text-gray-500">No conversations found for this date.</div>
            ) : (
              selectedSession.analytics.map((conv, idx) => (
                <div key={conv.sessionId ?? conv._id ?? idx}>
                  <div className="mb-1">
                    <span className="font-semibold text-green-700">Session ID:</span>{' '}
                    <span>{conv.sessionId ?? '¡ª'}</span>
                  </div>
                  <div className="mb-1">
                    <span className="font-semibold text-green-700">Phone Number:</span>{' '}
                    <span>{conv.phoneNumber ?? '¡ª'}</span>
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold text-green-700">Classified Issue Type:</span>{' '}
                    <span>{conv.classifiedIssueType ?? '¡ª'}</span>
                  </div>
                  {idx < selectedSession.analytics.length - 1 && (
                    <hr className="my-3 border-t border-gray-300" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Box>
  );
};

export default Analytics;