import { supabase } from './supabase';
import type { DeveloperPromotionSettings, PromotionKind } from '../types';

export const DEFAULT_PROMOTION_SETTINGS: DeveloperPromotionSettings = {
  boost_enabled: true,
  boost_daily_price: 0.25,
  boost_max_days: 30,
  home_ad_enabled: true,
  home_ad_daily_price: 1,
  home_ad_max_days: 14,
  home_ad_slots: 4,
};

export async function loadPromotionSettings() {
  const { data } = await supabase.from('app_settings').select('value').eq('key', 'developer_promotions').maybeSingle();
  const raw = (data?.value || {}) as Partial<DeveloperPromotionSettings>;
  return {
    boost_enabled: raw.boost_enabled ?? DEFAULT_PROMOTION_SETTINGS.boost_enabled,
    boost_daily_price: Number(raw.boost_daily_price ?? DEFAULT_PROMOTION_SETTINGS.boost_daily_price),
    boost_max_days: Math.max(1, Number(raw.boost_max_days ?? DEFAULT_PROMOTION_SETTINGS.boost_max_days)),
    home_ad_enabled: raw.home_ad_enabled ?? DEFAULT_PROMOTION_SETTINGS.home_ad_enabled,
    home_ad_daily_price: Number(raw.home_ad_daily_price ?? DEFAULT_PROMOTION_SETTINGS.home_ad_daily_price),
    home_ad_max_days: Math.max(1, Number(raw.home_ad_max_days ?? DEFAULT_PROMOTION_SETTINGS.home_ad_max_days)),
    home_ad_slots: Math.max(1, Number(raw.home_ad_slots ?? DEFAULT_PROMOTION_SETTINGS.home_ad_slots)),
  } satisfies DeveloperPromotionSettings;
}

export async function createPromotionRequest(appId: string, kind: PromotionKind, days: number) {
  const { data, error } = await supabase.rpc('create_app_promotion_request', { p_app_id: appId, p_kind: kind, p_days: days });
  if (error || !data) throw new Error(error?.message || 'promotion_request_failed');
  return String(data);
}

export async function createPromotionCheckout(promotionId: string) {
  const { data, error } = await supabase.functions.invoke('create-promotion-checkout', { body: { promotion_id: promotionId } });
  if (error || !data?.checkout_url) throw new Error(error?.message || data?.error || 'checkout_unavailable');
  return String(data.checkout_url);
}

export function promotionError(message: string, language: 'ar' | 'en') {
  const key = message.toLowerCase();
  const ar = language === 'ar';
  if (key.includes('home_ad_slots_full')) return ar ? 'أماكن الإعلان على الرئيسية ممتلئة حاليا حاول لاحقا' : 'Home advertising slots are currently full';
  if (key.includes('promotion_disabled')) return ar ? 'هذه الخاصية متوقفة مؤقتا' : 'This promotion option is temporarily unavailable';
  if (key.includes('invalid_promotion_duration')) return ar ? 'مدة الحملة غير صالحة' : 'Invalid promotion duration';
  if (key.includes('promotion_app_not_found')) return ar ? 'التطبيق غير متاح للترويج' : 'This app is not available for promotion';
  if (key.includes('payment_setup_incomplete')) return ar ? 'خدمة الدفع غير جاهزة حاليا' : 'Payment service is not ready right now';
  return ar ? 'تعذر إكمال العملية حاول مرة أخرى' : 'Could not complete the action Please try again';
}

export function isActiveUntil(value?: string | null) {
  if (!value) return false;
  return new Date(value).getTime() > Date.now();
}
