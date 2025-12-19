export type Website = { id: string; url: string; name: string;isOwnCompany?: boolean };
export type GetWebsitesResponse = { count: number; websites: Website[] };
export type ModifyWebsiteResponse =
  | { success: true; action: 'add' | 'edit'; website: Website }
  | { success: true; action: 'delete'; id: string };

const BASE = '/knowledge';

async function handleJsonResponse(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

export const WebScrapingService = {
  getWebsites: (): Promise<GetWebsitesResponse> =>
    fetch(`${BASE}/websites/get`, { credentials: 'include' }).then(handleJsonResponse),

  modifyWebsite: (payload: { mode: 'add' | 'edit' | 'delete'; id?: string; url?: string; name?:string; isOwnCompany?:boolean }): Promise<ModifyWebsiteResponse> =>
    fetch(`${BASE}/websites/modify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    }).then(handleJsonResponse),
};