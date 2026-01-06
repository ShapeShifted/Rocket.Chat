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
  _id?: string;
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

  const handleViewConversation = async (conv: Analytics) => {
    if (!conv.sessionId) {
      return;
    }
    setLoadingConversation(true);
    try {
    const res = await AnalyticsService.searchConversations(conv.sessionId, 1, 1); // sessionID is unique
      if (res.sessionID && res.phone_id && res.conversations) {
        const idx = res.sessionID.findIndex((id: string) => id === conv.sessionId);
        if (idx !== -1) {
          setSelectedConversation({
            _id: conv._id,
            sessionId: res.sessionID[idx],
            phoneId: res.phone_id[idx],
            conversation: res.conversations[idx],
          });
        }
      }
			console.log('conv', conv);
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
                  return (
                    <tr key={session.date ?? idx} style={{ borderBottom: '1px solid #f8f8f8', backgroundColor: idx % 2 === 0 ? '#fff' : '#f8f8f8' , textAlign: 'center' }}>
                      <td style={{
                        padding: '14px 8px',
                        fontWeight: 500,
                        textAlign: 'center'
                      }}>{session.date
                          ? new Date(session.date).toISOString().slice(0, 10)
                          : '??'}</td>
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
                        <svg width="23" height="24" viewBox="0 0 23 24" fill="none" xmlns="http://www.w3.org/2000/svg" cursor="pointer" onClick={() => setSelectedSession(session)}>
                    <path d="M2.33293 2.33293V9.36087V9.33171V20.9964V2.33293ZM2.33293 23.3293C1.69137 23.3293 1.14236 23.101 0.685881 22.6446C0.229405 22.1881 0.000777643 21.6387 0 20.9964V2.33293C0 1.69137 0.228627 1.14236 0.685881 0.685881C1.14313 0.229405 1.69215 0.000777643 2.33293 0H10.7023C11.0134 0 11.31 0.0583233 11.5923 0.17497C11.8746 0.291616 12.1223 0.456865 12.3354 0.670717L17.9927 6.32807C18.2066 6.54192 18.3718 6.78999 18.4885 7.07227C18.6051 7.35456 18.6634 7.65084 18.6634 7.96112V8.77764C18.6634 9.10814 18.5514 9.38032 18.3275 9.59417C18.1035 9.80802 17.8267 9.91494 17.497 9.91494C17.1672 9.91494 16.8904 9.80296 16.6664 9.579C16.4425 9.35504 16.3305 9.0782 16.3305 8.74848V8.16525H11.6646C11.3341 8.16525 11.0573 8.05327 10.8341 7.82931C10.6109 7.60535 10.499 7.32851 10.4982 6.99878V2.33293H2.33293V20.9964H8.74848C9.07898 20.9964 9.35621 21.1083 9.58017 21.3323C9.80413 21.5563 9.91572 21.8331 9.91494 22.1628C9.91417 22.4925 9.80219 22.7698 9.579 22.9945C9.35582 23.2192 9.07898 23.3308 8.74848 23.3293H2.33293ZM15.7473 19.8299C16.5638 19.8299 17.2539 19.548 17.8177 18.9842C18.3815 18.4204 18.6634 17.7303 18.6634 16.9137C18.6634 16.0972 18.3815 15.407 17.8177 14.8433C17.2539 14.2795 16.5638 13.9976 15.7473 13.9976C14.9307 13.9976 14.2406 14.2795 13.6768 14.8433C13.113 15.407 12.8311 16.0972 12.8311 16.9137C12.8311 17.7303 13.113 18.4204 13.6768 18.9842C14.2406 19.548 14.9307 19.8299 15.7473 19.8299ZM22.5128 23.6792C22.2989 23.8931 22.0267 24 21.6962 24C21.3657 24 21.0936 23.8931 20.8797 23.6792L18.5468 21.3463C18.1385 21.6185 17.6964 21.8226 17.2205 21.9587C16.7446 22.0948 16.2535 22.1628 15.7473 22.1628C14.2892 22.1628 13.05 21.6527 12.0297 20.6324C11.0095 19.6121 10.499 18.3726 10.4982 16.9137C10.4974 15.4549 11.0079 14.2157 12.0297 13.1962C13.0516 12.1767 14.2907 11.6662 15.7473 11.6646C17.2038 11.6631 18.4433 12.1736 19.466 13.1962C20.4886 14.2188 20.9987 15.458 20.9964 16.9137C20.9964 17.4192 20.9283 17.9103 20.7922 18.387C20.6561 18.8637 20.452 19.3058 20.1798 19.7132L22.5128 22.0462C22.7266 22.26 22.8335 22.5322 22.8335 22.8627C22.8335 23.1932 22.7266 23.4654 22.5128 23.6792Z" fill="#156FF5"/>
                    </svg>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.5rem' }}>
          Conversation on {selectedSession.date}
        </h2>
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
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000' }}>
                <th style={{ padding: '14px 8px', textAlign: 'left', fontWeight: 600 }}>Session ID</th>
                <th style={{ padding: '14px 8px', textAlign: 'left', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '14px 8px', textAlign: 'left', fontWeight: 600 }}>Issue</th>
                <th style={{ padding: '14px 8px', textAlign: 'left', fontWeight: 600 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {selectedSession.analytics.map((conv, idx) => (
                <tr key={conv.sessionId ?? conv._id ?? idx} style={{ borderBottom: '1px solid #f8f8f8', backgroundColor: idx % 2 === 0 ? '#fff' : '#f8f8f8' }}>
                  <td style={{ padding: '14px 8px' }}>{conv.sessionId ?? '?C'}</td>
                  <td style={{ padding: '14px 8px' }}>{conv.phoneNumber ?? '?C'}</td>
                  <td style={{ padding: '14px 8px' }}>{conv.classifiedIssueType ?? '?C'}</td>
                  <td style={{ padding: '14px 8px 0px 24px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" cursor="pointer" onClick={() => handleViewConversation(conv)} fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21.2571 8.98055C21.7005 8.98109 22.0804 9.13931 22.3969 9.4552C22.7133 9.77109 22.8715 10.151 22.8715 10.595V23.1677C22.872 23.5314 22.7074 23.7838 22.3776 23.9248C22.0477 24.0658 21.7549 24.0085 21.4993 23.7529L19.6427 21.8962H8.34149C7.89699 21.8967 7.51675 21.7388 7.20086 21.4224C6.88497 21.1059 6.7269 20.7257 6.7269 20.2818V10.595C6.72637 10.1515 6.88443 9.77163 7.20086 9.4552C7.51729 9.13878 7.89752 8.98055 8.34149 8.98055H21.2571ZM8.34149 20.2818H20.3288L21.2571 21.1899V10.595H8.34149V20.2818ZM18.8354 16.2456C19.0641 16.2456 19.2558 16.3231 19.4102 16.4781C19.5646 16.6331 19.6421 16.8246 19.6427 17.0528C19.6432 17.2809 19.5658 17.4729 19.4102 17.6285C19.2547 17.784 19.063 17.8611 18.8354 17.8601H13.992C13.7633 17.86 13.5715 17.7826 13.4165 17.6276C13.2615 17.4726 13.1843 17.2809 13.1849 17.0528C13.1854 16.8246 13.2629 16.6331 13.4174 16.4781C13.5718 16.3231 13.7633 16.2457 13.992 16.2456H18.8354ZM13.0522 1.71545C12.6667 2.20246 12.3379 2.74049 12.066 3.32986H1.61441V13.9248L2.54288 13.0167H5.38159C5.8274 13.0167 6.18871 13.3781 6.18871 13.8239C6.18869 14.2697 5.82738 14.631 5.38159 14.6311H3.22899L1.3724 16.4877C1.11679 16.7433 0.82396 16.8007 0.494098 16.6597C0.164236 16.5187 -0.000516539 16.2663 1.21651e-06 15.9026V3.32986C4.56049e-06 2.8859 0.158238 2.50599 0.474654 2.1901C0.791074 1.87422 1.171 1.716 1.61441 1.71545H13.0522ZM18.8354 13.0167C19.0641 13.0167 19.2558 13.0941 19.4102 13.2491C19.5647 13.4041 19.6422 13.5958 19.6427 13.8239C19.6432 14.0521 19.5657 14.244 19.4102 14.3995C19.2547 14.555 19.063 14.6321 18.8354 14.6311H10.7632C10.5345 14.6311 10.3425 14.5536 10.1875 14.3986C10.0325 14.2436 9.95537 14.0521 9.9559 13.8239C9.95643 13.5958 10.0339 13.4041 10.1884 13.2491C10.3428 13.0941 10.5345 13.0167 10.7632 13.0167H18.8354ZM5.38159 8.98055C5.82737 8.98057 6.18867 9.34189 6.18871 9.78766C6.18871 10.2335 5.8274 10.5949 5.38159 10.595H4.03611C3.8085 10.596 3.6168 10.5189 3.46128 10.3634C3.30578 10.2078 3.22845 10.0158 3.22899 9.78766C3.22955 9.55952 3.30685 9.36781 3.46128 9.21284C3.61572 9.05787 3.80742 8.98056 4.03611 8.98055H5.38159ZM12.1085 5.75156C12.3372 5.75156 12.5289 5.82904 12.6833 5.98402C12.8378 6.13901 12.9152 6.33068 12.9158 6.55885C12.9163 6.78701 12.839 6.9787 12.684 7.13367C12.529 7.28861 12.3372 7.36596 12.1085 7.36597H4.03611C3.8085 7.36703 3.6168 7.28988 3.46128 7.13437C3.30581 6.97886 3.22846 6.78697 3.22899 6.55885C3.22953 6.3307 3.30687 6.139 3.46128 5.98402C3.61572 5.82905 3.80742 5.75157 4.03611 5.75156H12.1085Z" fill="#156FF5"/>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M18.6666 7.82222C17.4815 7.82222 16.4075 7.4662 15.4447 6.75418C14.482 6.04216 13.7782 5.09447 13.3333 3.91111C13.7778 2.72775 14.4816 1.78006 15.4447 1.06803C16.4079 0.356011 17.4819 0 18.6666 0C19.8514 0 20.9256 0.356011 21.8892 1.06803C22.8527 1.78006 23.5563 2.72775 24 3.91111C23.5555 5.09447 22.8519 6.04216 21.8892 6.75418C20.9264 7.4662 19.8522 7.82222 18.6666 7.82222ZM18.6666 6.6188C19.5358 6.6188 20.3308 6.37811 21.0518 5.89675C21.7728 5.41538 22.3259 4.7535 22.7111 3.91111C22.3259 3.06872 21.7728 2.40684 21.0518 1.92547C20.3308 1.4441 19.5358 1.20342 18.6666 1.20342C17.7975 1.20342 17.0025 1.4441 16.2815 1.92547C15.5605 2.40684 15.0074 3.06872 14.6222 3.91111C15.0074 4.7535 15.5605 5.41538 16.2815 5.89675C17.0025 6.37811 17.7975 6.6188 18.6666 6.6188ZM18.6666 6.01709C19.2395 6.01709 19.7284 5.8115 20.1333 5.40034C20.5383 4.98917 20.7407 4.49276 20.7407 3.91111C20.7407 3.32946 20.5383 2.83305 20.1333 2.42188C19.7284 2.01071 19.2395 1.80513 18.6666 1.80513C18.0938 1.80513 17.6049 2.01071 17.2 2.42188C16.795 2.83305 16.5926 3.32946 16.5926 3.91111C16.5926 4.49276 16.795 4.98917 17.2 5.40034C17.6049 5.8115 18.0938 6.01709 18.6666 6.01709ZM18.6666 4.81367C18.4197 4.81367 18.2098 4.72602 18.0367 4.55072C17.8637 4.37543 17.7774 4.16222 17.7778 3.91111C17.7782 3.65999 17.8647 3.44699 18.0373 3.27209C18.21 3.0972 18.4197 3.00935 18.6666 3.00854C18.9136 3.00774 19.1235 3.09559 19.2966 3.27209C19.4696 3.44859 19.5559 3.6616 19.5555 3.91111C19.5551 4.16062 19.4688 4.37382 19.2966 4.55072C19.1243 4.72763 18.9144 4.81528 18.6666 4.81367Z" fill="#156FF5"/>
                  </svg>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            fontSize: 18,
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
            fontSize: 18,
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 10 }}>
          <div style={{ fontWeight: 500, fontSize: '1.1rem' }}>
            Session ID: {selectedConversation.sessionId ?? '??'}
          </div>
          {/* <div style={{ fontWeight: 500, fontSize: '1.1rem', color: '#156FF5', cursor: 'pointer' }}>
            <svg width="20" height="24" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px', verticalAlign: 'middle' }} xmlns="http://www.w3.org/2000/svg">
            <path d="M2.66667 24C1.93333 24 1.30578 23.7391 0.784 23.2173C0.262222 22.6956 0.000888889 22.0676 0 21.3333V2.66667C0 1.93333 0.261333 1.30578 0.784 0.784C1.30667 0.262222 1.93422 0.000888889 2.66667 0H10.6667C11.0444 0 11.3613 0.128 11.6173 0.384C11.8733 0.64 12.0009 0.956444 12 1.33333C11.9991 1.71022 11.8711 2.02711 11.616 2.284C11.3609 2.54089 11.0444 2.66844 10.6667 2.66667H2.66667V21.3333H21.3333V13.3333C21.3333 12.9556 21.4613 12.6391 21.7173 12.384C21.9733 12.1289 22.2898 12.0009 22.6667 12C23.0436 11.9991 23.3604 12.1271 23.6173 12.384C23.8742 12.6409 24.0018 12.9573 24 13.3333V21.3333C24 22.0667 23.7391 22.6947 23.2173 23.2173C22.6956 23.74 22.0676 24.0009 21.3333 24H2.66667ZM21.3333 4.53333L9.86666 16C9.62222 16.2444 9.31111 16.3667 8.93333 16.3667C8.55555 16.3667 8.24444 16.2444 8 16C7.75555 15.7556 7.63333 15.4444 7.63333 15.0667C7.63333 14.6889 7.75555 14.3778 8 14.1333L19.4667 2.66667H16C15.6222 2.66667 15.3058 2.53867 15.0507 2.28267C14.7956 2.02667 14.6676 1.71022 14.6667 1.33333C14.6658 0.956444 14.7938 0.64 15.0507 0.384C15.3076 0.128 15.624 0 16 0H22.6667C23.0444 0 23.3613 0.128 23.6173 0.384C23.8733 0.64 24.0009 0.956444 24 1.33333V8C24 8.37778 23.872 8.69467 23.616 8.95067C23.36 9.20667 23.0436 9.33422 22.6667 9.33333C22.2898 9.33244 21.9733 9.20444 21.7173 8.94933C21.4613 8.69422 21.3333 8.37778 21.3333 8V4.53333Z" fill="#156FF5"/>
            </svg>
              Open Conversation
          </div> */}
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
