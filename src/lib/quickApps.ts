const KEY = 'salla-browser-quick-apps-v1';
const MAX = 6;

function read(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string').slice(0, MAX) : [];
  } catch { return []; }
}

function write(ids: string[]) {
  try { localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX))); } catch { /* local UX only */ }
  window.dispatchEvent(new CustomEvent('salla-quick-apps-updated'));
}

export function getQuickAppIds() { return read(); }
export function isQuickApp(id: string) { return read().includes(id); }
export function toggleQuickApp(id: string) {
  const current = read();
  if (current.includes(id)) { write(current.filter((x) => x !== id)); return false; }
  write([id, ...current.filter((x) => x !== id)]); return true;
}
export function clearQuickApps() { write([]); }
