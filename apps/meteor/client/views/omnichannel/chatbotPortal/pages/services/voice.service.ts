const DEFAULT_BASE = '/voice-to-chat';

const BASE = DEFAULT_BASE.replace(/\/$/, '');

export type VoiceResponse = any;

async function handleJsonResponse(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

export const VoiceService = {
    voiceProcess: (file: File): Promise<VoiceResponse> => {
        const formData = new FormData();
        formData.append('audio', file);

        return fetch(`${BASE}/VoiceToChat`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
        }).then(handleJsonResponse);
    },

    getTranscriptions: (page = 1, limit = 8): Promise<VoiceResponse> =>
        fetch(`${BASE}/paginatedTranscriptions?page=${page}&limit=${limit}`, { credentials: 'include' }).then(handleJsonResponse),

    getAllTranscriptions: (): Promise<VoiceResponse> =>
        fetch(`${BASE}/allTranscriptions`, { credentials: 'include' }).then(handleJsonResponse),

    searchTranscriptions: (query: string, page = 1, limit = 8): Promise<VoiceResponse> =>
        fetch(
            `${BASE}/searchTranscription?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
            { credentials: 'include' }
        ).then(handleJsonResponse),
};