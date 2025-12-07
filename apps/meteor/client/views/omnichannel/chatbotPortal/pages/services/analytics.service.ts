const DEFAULT_BASE = '/knowledge';

const BASE = DEFAULT_BASE.replace(/\/$/, '');

export type AnalyticsResponse = any;
export type ConversationResponse = any;

async function handleJsonResponse(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

export const AnalyticsService = {
  getAnalytics: (page = 1, limit = 8): Promise<AnalyticsResponse> =>
    fetch(`${BASE}/analytics`, { credentials: 'include' }).then(handleJsonResponse),

  searchConversations: (query: string, page = 1, limit = 8): Promise<ConversationResponse> =>
      fetch(
        `${BASE}/conversations/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
        { credentials: 'include' }
      ).then(handleJsonResponse),

    searchAnalytics: (date: string): Promise<AnalyticsResponse> =>
    fetch(
      `${BASE}/analytics/search?date=${encodeURIComponent(date)}`,
      { credentials: 'include' }
    ).then(handleJsonResponse),
};
