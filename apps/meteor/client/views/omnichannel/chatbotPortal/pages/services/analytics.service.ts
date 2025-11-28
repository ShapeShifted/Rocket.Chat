const DEFAULT_BASE = '/knowledge';

const BASE = DEFAULT_BASE.replace(/\/$/, '');

export type AnalyticsResponse = any;

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
};