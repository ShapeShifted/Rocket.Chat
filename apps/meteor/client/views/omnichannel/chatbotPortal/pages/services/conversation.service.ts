const DEFAULT_BASE = '/knowledge';

const BASE = DEFAULT_BASE.replace(/\/$/, '');

export type ConversationResponse = any;

async function handleJsonResponse(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

export const ConversationService = {
  // preferred correct name
  getAllConversations: (): Promise<ConversationResponse> =>
    fetch(`${BASE}/archived-conversations/all`, { credentials: 'include' }).then(handleJsonResponse),

  getConversations: (page = 1, limit = 8): Promise<ConversationResponse> =>
    fetch(`${BASE}/archived-conversations?page=${page}&limit=${limit}`, { credentials: 'include' }).then(handleJsonResponse),

  searchConversations: (query: string, page = 1, limit = 8): Promise<ConversationResponse> =>
    fetch(
      `${BASE}/conversations/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
      { credentials: 'include' }
    ).then(handleJsonResponse),

    
};