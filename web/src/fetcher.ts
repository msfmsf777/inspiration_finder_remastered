import type { Fetcher } from '@ifrm/core';

function key(url: string) {
  return 'cache:' + url;
}

export function makeBrowserFetcher(): Fetcher {
  return {
    async fetchText(url: string) {
      const k = key(url);
      const cached = localStorage.getItem(k);
      if (cached) return cached;
      const res = await fetch(url, { headers: { 'user-agent': 'ifrm/0.0.0' } });
      if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
      const text = await res.text();
      localStorage.setItem(k, text);
      return text;
    },
  };
}
