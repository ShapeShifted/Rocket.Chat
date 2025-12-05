// lightweight fetch-based service for FAQs (translated from Angular)

const DEFAULT_BASE ='/knowledge';

const BASE = DEFAULT_BASE.replace(/\/$/, '');

export type QnaResponse = any;

async function handleJsonResponse(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

export const FaqService = {
  getFaqs: (page = 1, limit = 8): Promise<QnaResponse> =>
    fetch(`${BASE}/documents?page=${page}&limit=${limit}&type=qna`, { credentials: 'include' }).then(handleJsonResponse),

  getFaqsForTopic: (topicName: string): Promise<QnaResponse> =>
    fetch(`${BASE}/documents/topic/${encodeURIComponent(topicName)}`, { credentials: 'include' }).then(handleJsonResponse),

  deleteTopic: (topicName: string): Promise<QnaResponse> =>
    fetch(`${BASE}/documents/delete/${encodeURIComponent(topicName)}`, { method: 'DELETE', credentials: 'include' }).then(handleJsonResponse),

  updateQna: (qnaPayload: any): Promise<QnaResponse> =>
    fetch(`${BASE}/qna/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(qnaPayload),
      credentials: 'include',
    }).then(handleJsonResponse),

  ingestQna: (qnaPayload: any): Promise<QnaResponse> =>
    fetch(`${BASE}/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(qnaPayload),
      credentials: 'include',
    }).then(handleJsonResponse),

  searchFaqs: (query: string, type: string = 'qna', source?: string, page = 1, limit = 8): Promise<QnaResponse> =>
        fetch(`${BASE}/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            query,
            source,
            type:'qna',
            page,
            limit,
          }),
        }).then(handleJsonResponse),
      };