const DEFAULT_BASE = '/chat';

const BASE = DEFAULT_BASE.replace(/\/$/, '');

export interface WelcomeConfig {
  message: string;
  options: string[];
}

export type ConfigType = 'welcome' | 'troubleshoot-welcome';

export interface ConfigOption {
  key: string;
  label: string;
  type: ConfigType;
  lang?: string;
  fileName: string;
}

export const CONFIG_FILES: ConfigOption[] = [
  { key: 'welcome-default', label: 'Main Welcome (Default)', type: 'welcome', fileName: 'chatbot-welcome.json' },
  { key: 'welcome-en', label: 'Main Welcome (English)', type: 'welcome', lang: 'en', fileName: 'chatbot-welcome-en.json' },
  { key: 'welcome-ms', label: 'Main Welcome (Malay)', type: 'welcome', lang: 'ms', fileName: 'chatbot-welcome-ms.json' },
  { key: 'welcome-zh', label: 'Main Welcome (Chinese)', type: 'welcome', lang: 'zh', fileName: 'chatbot-welcome-zh.json' },
  { key: 'welcome-ta', label: 'Main Welcome (Tamil)', type: 'welcome', lang: 'ta', fileName: 'chatbot-welcome-ta.json' },
  { key: 'troubleshoot-default', label: 'Troubleshoot (Default)', type: 'troubleshoot-welcome', fileName: 'troubleshoot-welcome.json' },
  { key: 'troubleshoot-en', label: 'Troubleshoot (English)', type: 'troubleshoot-welcome', lang: 'en', fileName: 'troubleshoot-welcome-en.json' },
  { key: 'troubleshoot-ms', label: 'Troubleshoot (Malay)', type: 'troubleshoot-welcome', lang: 'ms', fileName: 'troubleshoot-welcome-ms.json' },
  { key: 'troubleshoot-zh', label: 'Troubleshoot (Chinese)', type: 'troubleshoot-welcome', lang: 'zh', fileName: 'troubleshoot-welcome-zh.json' },
  { key: 'troubleshoot-ta', label: 'Troubleshoot (Tamil)', type: 'troubleshoot-welcome', lang: 'ta', fileName: 'troubleshoot-welcome-ta.json' },
];

async function handleJsonResponse(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

export const AnnouncementService = {
  getWelcomeConfig: (type: ConfigType = 'welcome', lang?: string): Promise<WelcomeConfig> => {
    const query = lang ? `?lang=${encodeURIComponent(lang)}` : '';
    return fetch(`${BASE}/${type}${query}`, { credentials: 'include' }).then(handleJsonResponse);
  },

  updateWelcomeConfig: (payload: WelcomeConfig, type: ConfigType = 'welcome', lang?: string): Promise<WelcomeConfig> => {
    const query = lang ? `?lang=${encodeURIComponent(lang)}` : '';
    return fetch(`${BASE}/${type}${query}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    }).then(handleJsonResponse);
  },
};

