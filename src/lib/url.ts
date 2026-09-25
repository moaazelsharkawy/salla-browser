const blockedProtocols = ['javascript:', 'data:', 'file:', 'vbscript:'];

export function normalizeUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();
  if (blockedProtocols.some((protocol) => lower.startsWith(protocol))) return null;

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const parsed = new URL(withProtocol);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function looksLikeUrl(input: string): boolean {
  const value = input.trim();
  return /^https?:\/\//i.test(value) || /^([\w-]+\.)+[a-z]{2,}(\/.*)?$/i.test(value);
}

export function safeHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
