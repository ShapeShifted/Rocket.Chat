const DEFAULT_BASE = '/chat';

const BASE = DEFAULT_BASE.replace(/\/$/, '');

export interface WelcomeConfig {
  message: string;
  options: string[];
}

async function handleJsonResponse(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

export const AnnouncementService = {
  getWelcomeConfig: (): Promise<WelcomeConfig> =>
    fetch(`${BASE}/welcome`, { credentials: 'include' }).then(handleJsonResponse),

  updateWelcomeConfig: (payload: WelcomeConfig): Promise<WelcomeConfig> =>
    fetch(`${BASE}/welcome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    }).then(handleJsonResponse),
};
