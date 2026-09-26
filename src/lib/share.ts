import type { DirectoryApp, Language } from '../types';

export async function shareApp(app: DirectoryApp, language: Language) {
  const url = `${window.location.origin}/apps/${encodeURIComponent(app.slug)}`;
  const text = language === 'ar'
    ? `اكتشف ${app.name} على Salla Browser`
    : `Discover ${app.name} on Salla Browser`;

  if (navigator.share) {
    try {
      await navigator.share({ title: app.name, text, url });
      return 'shared' as const;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled' as const;
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return 'copied' as const;
  } catch {
    window.prompt(language === 'ar' ? 'انسخ رابط التطبيق' : 'Copy app link', url);
    return 'manual' as const;
  }
}
