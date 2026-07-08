const DEFAULT_BASE = '/knowledge';

const BASE = DEFAULT_BASE.replace(/\/$/, '');

export type FactResponse = any;

async function handleJsonResponse(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

export const FactService = {
  getFacts: (page = 1, limit = 8): Promise<FactResponse> =>
    fetch(`${BASE}/documents?page=${page}&limit=${limit}&type=fact`, { credentials: 'include' }).then(handleJsonResponse),

  ingestFact: (factPayload: any): Promise<FactResponse> =>
    fetch(`${BASE}/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(factPayload),
      credentials: 'include',
    }).then(handleJsonResponse),

  updateFact: (factPayload: any): Promise<FactResponse> =>
    fetch(`${BASE}/fact/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(factPayload),
      credentials: 'include',
    }).then(handleJsonResponse),

  deleteFact: (factId: string): Promise<FactResponse> =>
    fetch(`${BASE}/fact/delete/${encodeURIComponent(factId)}`, { method: 'DELETE', credentials: 'include' }).then(handleJsonResponse),

  searchFacts: (query: string, type: string = 'fact', page = 1, limit = 8, source?: string): Promise<FactResponse> =>
    fetch(`${BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        query,
        type: 'fact',
        page,
        limit,
        source,
      }),
    }).then(handleJsonResponse),

  getExportUrl: (type: 'qna' | 'fact'): string => {
    return `${BASE}/documents/export?type=${type}`;
  },

  importCsv: (file: File): Promise<{ imported: number; skipped: number; errors: string[] }> => {
    const formData = new FormData();
    formData.append('file', file);

    // Point to your new auto-detecting route and drop the '?type=' query string parameter
    return fetch(`${BASE}/documents/import-file`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    }).then(handleJsonResponse);
  },
};

