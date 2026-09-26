import { supabase } from './supabase';
import type { DeveloperListingSettings, ListingPaymentStatus } from '../types';

export const DEFAULT_DEVELOPER_LISTING_SETTINGS: DeveloperListingSettings = {
  listing_enabled: true,
  fee_enabled: false,
  fee_amount: 0,
  currency: 'pi',
  max_apps_per_developer: 5,
  max_pending_submissions: 2,
};

export async function loadDeveloperListingSettings(): Promise<DeveloperListingSettings> {
  const { data } = await supabase.from('app_settings').select('value').eq('key', 'developer_listing').maybeSingle();
  const value = (data?.value || {}) as Partial<DeveloperListingSettings>;
  return {
    listing_enabled: value.listing_enabled ?? DEFAULT_DEVELOPER_LISTING_SETTINGS.listing_enabled,
    fee_enabled: value.fee_enabled ?? DEFAULT_DEVELOPER_LISTING_SETTINGS.fee_enabled,
    fee_amount: Number(value.fee_amount ?? DEFAULT_DEVELOPER_LISTING_SETTINGS.fee_amount),
    currency: 'pi',
    max_apps_per_developer: Math.max(1, Number(value.max_apps_per_developer ?? DEFAULT_DEVELOPER_LISTING_SETTINGS.max_apps_per_developer)),
    max_pending_submissions: Math.max(1, Number(value.max_pending_submissions ?? DEFAULT_DEVELOPER_LISTING_SETTINGS.max_pending_submissions)),
  };
}

export function paymentStatusLabel(status: ListingPaymentStatus | undefined, language: 'ar' | 'en') {
  const ar = language === 'ar';
  switch (status) {
    case 'awaiting_payment': return ar ? 'بانتظار الدفع' : 'Awaiting payment';
    case 'paid': return ar ? 'تم الدفع' : 'Paid';
    case 'refunded': return ar ? 'تم الاسترداد' : 'Refunded';
    case 'payment_failed': return ar ? 'تعذر الدفع' : 'Payment failed';
    default: return ar ? 'لا توجد رسوم' : 'No fee';
  }
}

export function friendlySubmissionError(raw: string, language: 'ar' | 'en') {
  const ar = language === 'ar';
  const message = raw.toLowerCase();
  if (message.includes('listing_disabled')) return ar ? 'استقبال طلبات الإدراج متوقف مؤقتا' : 'New app submissions are temporarily paused';
  if (message.includes('developer_app_limit')) return ar ? 'وصلت إلى الحد الأقصى للتطبيقات المسموح بها لحسابك' : 'You reached the maximum number of apps allowed for your account';
  if (message.includes('developer_pending_limit')) return ar ? 'لديك الحد الأقصى من الطلبات قيد المراجعة حاليا' : 'You already have the maximum number of active review requests';
  if (message.includes('payment_required')) return ar ? 'يجب إكمال رسوم الإدراج قبل مراجعة هذا الطلب' : 'Listing payment must be completed before review';
  if (message.includes('payment_setup_incomplete')) return ar ? 'الدفع غير متاح مؤقتا حاول مرة أخرى لاحقا' : 'Checkout is temporarily unavailable Please try again later';
  if (message.includes('checkout_unavailable') || message.includes('provider_rejected') || message.includes('checkout_invalid_url')) return ar ? 'تعذر تجهيز صفحة الدفع الآمنة حاول مرة أخرى' : 'Could not prepare the secure checkout Please try again';
  return ar ? 'تعذر إكمال العملية حاول مرة أخرى' : 'Could not complete the request Please try again';
}

export async function createListingCheckout(submissionId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('create-listing-checkout', { body: { submission_id: submissionId } });
  const code = typeof data?.error === 'string' ? data.error : error?.message;
  if (error || !data?.checkout_url) throw new Error(code || 'checkout_unavailable');

  let checkoutUrl: URL;
  try {
    checkoutUrl = new URL(String(data.checkout_url));
  } catch {
    throw new Error('checkout_invalid_url');
  }

  if (checkoutUrl.protocol !== 'https:' || checkoutUrl.hostname !== 'mall.salla-shop.com' || !checkoutUrl.pathname.startsWith('/api-checkout/')) {
    throw new Error('checkout_invalid_url');
  }
  return checkoutUrl.toString();
}

export async function loadDeveloperDraft<T extends Record<string, string>>(userId: string, draftKey: string): Promise<T | null> {
  const { data, error } = await supabase
    .from('developer_submission_drafts')
    .select('form_data')
    .eq('user_id', userId)
    .eq('draft_key', draftKey)
    .maybeSingle();
  if (error || !data?.form_data || typeof data.form_data !== 'object') return null;
  return data.form_data as T;
}

export async function saveDeveloperDraft(userId: string, draftKey: string, appId: string | null, formData: Record<string, string>) {
  const { error } = await supabase.from('developer_submission_drafts').upsert({
    user_id: userId,
    draft_key: draftKey,
    app_id: appId,
    form_data: formData,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,draft_key' });
  if (error) throw error;
}

export async function deleteDeveloperDraft(userId: string, draftKey: string) {
  const { error } = await supabase.from('developer_submission_drafts').delete().eq('user_id', userId).eq('draft_key', draftKey);
  if (error) throw error;
}
