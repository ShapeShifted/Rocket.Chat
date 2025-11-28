import React, { useEffect, useState } from 'react';
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
const MAX_HEIGHT = '70vh';

const titleCase = (s?: string) =>
  !s ? '' : s.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.substr(1).toLowerCase());

const safeString = (val: any): string | undefined => {
  try {
    if (val == null) return undefined;
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') {
      if (typeof val.$oid === 'string') return val.$oid;
      if (typeof val.toString === 'function') {
        const s = val.toString();
        if (typeof s === 'string' && s !== '[object Object]') return s;
      }
      try {
        const j = JSON.stringify(val);
        return j !== '{}' ? (j.length > 60 ? j.slice(0, 60) + '¡­' : j) : undefined;
      } catch {
        return undefined;
      }
    }
    return undefined;
  } catch {
    return undefined;
  }
};

const ConversationManager: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [boxes, setBoxes] = useState<ConversationBox[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [selectedBox, setSelectedBox] = useState<ConversationBox | null>(null);

  const load = async (page = 0) => {
    setLoading(true);
    setError(null);
    try {
      const resp: any = await ConversationService.getConversations(page + 1, PAGE_SIZE);
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

      const respSessionArray: any[] | undefined =
        resp?.sessionID ?? resp?.session_id ?? resp?.sessionIds ?? undefined;
      const respPhoneArray: any[] | undefined = resp?.phone_id ?? resp?.phoneId ?? resp?.phone_id ?? undefined;

      const mapped: ConversationBox[] = conversationsArray.map((item: any, idx: number) => {
        const rawSession =
          item?.sessionId ?? item?._id ?? item?.id ?? item?.session?.id ?? (respSessionArray ? respSessionArray[idx] : undefined);

        const rawPhone =
          item?.phoneId ??
          item?.msisdn ??
          item?.phone ??
          item?.context?.userInfo?.msisdn ??
          (respPhoneArray ? respPhoneArray[idx] : undefined);

        const conversation =
          item?.conversationHistory ??
          item?.context?.conversationHistory ??
          item?.conversation ??
          item?.messages ??
          item?.history ??
          (Array.isArray(item) ? item : []);

        return {
          sessionId: safeString(rawSession),
          phoneId: safeString(rawPhone),
          conversation: Array.isArray(conversation) ? conversation : [],
        };
      });

      const computedTotalPages =
        resp?.totalPages ??
        (resp?.total ? Math.max(1, Math.ceil(resp.total / PAGE_SIZE)) : Math.max(1, Math.ceil((resp.count ?? count) / PAGE_SIZE)));

      const serverPageZeroBased = typeof resp?.page === 'number' ? Math.max(0, resp.page - 1) : page;

      setBoxes(mapped);
      setTotalPages(Math.max(1, computedTotalPages ?? 1));
      setCurrentPage(serverPageZeroBased);
    } catch (err: any) {
      setError(err?.message ?? String(err) ?? 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToPage = (p: number) => {
    if (p < 0 || p >= totalPages) return;
    load(p);
  };

  return (
    <Box>
      <div
        className="flex flex-row"
        style={{
          minHeight: 700,
          maxHeight: 900,
          width: '100%',
        }}
      >
        {/* Conversation List */}
        <div
          className="flex flex-col border-r border-gray-200"
          style={{
            flex: '1 1 0%',
            padding: '2rem',
            overflowY: 'auto',
            maxHeight: '900px',
            minWidth: 350,
            maxWidth: 500,
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-green-700">Conversations</h1>
          </div>
          <div className="flex-1">
            <div className="space-y-4">
              {loading ? (
                <div className="text-gray-500">Loading conversations...</div>
              ) : !loading && boxes.length === 0 ? (
                <div className="text-gray-500">No conversations found.</div>
              ) : (
                boxes.map((box, idx) => (
                  <div
                    key={box.sessionId ?? `box-${idx}`}
                    className={`bg-white rounded-lg shadow border border-gray-200 p-5 flex items-center justify-between transition hover:shadow-md ${
                      selectedBox?.sessionId === box.sessionId ? 'ring-2 ring-green-500' : ''
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-green-700 text-lg mb-1">
                        {box.sessionId ?? '¡ª'}
                      </div>
                      <div className="text-gray-600 text-sm">
                        Phone: {box.phoneId ?? '¡ª'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 text-sm"
                        onClick={() => setSelectedBox(box)}
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <Box marginBlockStart="x8" display="flex" alignItems="center" justifyContent="space-between">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button small disabled={currentPage <= 0} onClick={() => load(currentPage - 1)}>
                Previous
              </Button>
              <span>Page</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage + 1}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(totalPages, Number(e.target.value)));
                  if (val - 1 !== currentPage) load(val - 1);
                }}
                style={{ width: 60, textAlign: 'center' }}
              />
              <span>of {totalPages}</span>
              <Button small disabled={currentPage >= totalPages - 1} onClick={() => load(currentPage + 1)}>
                Next
              </Button>
            </div>
          </Box>
        </div>
        {/* Conversation Details Side Panel */}
        <div
          className="flex flex-col"
          style={{
            flex: '1 1 0%',
            padding: '2rem',
            background: '#fff',
            overflowY: 'auto',
            maxHeight: '900px',
            minWidth: 350,
            maxWidth: 600,
            borderLeft: '1px solid #e5e7eb',
          }}
        >
          {selectedBox ? (
            <>
              <button
                onClick={() => setSelectedBox(null)}
                className="absolute top-4 right-5 text-gray-400 hover:text-gray-700"
                aria-label="Close"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  position: 'absolute',
                  right: 16,
                  top: 16,
                  zIndex: 10,
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <h2 className="text-xl font-bold text-green-700 mb-4">Conversation</h2>
              {Array.isArray(selectedBox.conversation) && selectedBox.conversation.length > 0 ? (
                <div style={{ maxHeight: MAX_HEIGHT, overflowY: 'auto', paddingRight: 8 }}>
                  {selectedBox.conversation.map((message, i) => (
                    <div className="mb-2 flex bg-gray-50 rounded p-2" key={`${message.timestamp ?? i}-${i}`}>
                      <div className="min-w-[80px] font-semibold text-green-700 flex-shrink-0">
                        {titleCase(message.role)}:
                      </div>
                      <div className="ml-2 break-words">{message.content}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">No messages in this conversation.</div>
              )}
            </>
          ) : (
            <div className="text-gray-400 flex items-center justify-center h-full">Select a conversation to view details.</div>
          )}
        </div>
      </div>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </Box>
  );
};

export default ConversationManager;