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
  getConversations: (page = 1, limit = 8): Promise<ConversationResponse> =>
    fetch(`${BASE}/archived-conversations`, { credentials: 'include' }).then(handleJsonResponse),
};