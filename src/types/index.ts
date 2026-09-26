export type Language = 'ar' | 'en';
export type AppStatus = 'draft' | 'published' | 'suspended';
export type HealthStatus = 'online' | 'maintenance' | 'new' | 'updated' | 'offline';
export type EmbedMode = 'iframe' | 'external';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';
export type SubmissionType = 'new' | 'update';
export type ListingPaymentStatus = 'not_required' | 'awaiting_payment' | 'paid' | 'refunded' | 'payment_failed';
export type PromotionKind = 'boost' | 'home_ad';
export type PromotionStatus = 'awaiting_payment' | 'active' | 'expired' | 'refunded' | 'payment_failed';
export type UserRole = 'user' | 'developer' | 'admin';

export interface Profile { id:string; email:string|null; display_name:string|null; avatar_url:string|null; role:UserRole; country_code:string|null; created_at:string; updated_at:string; }
export interface Category { id:string; slug:string; name_ar:string; name_en:string; description_ar:string|null; description_en:string|null; icon:string; sort_order:number; is_active:boolean; }
export interface DirectoryApp {
  id:string; slug:string; name:string; version:string; short_description_ar:string; short_description_en:string; description_ar:string; description_en:string;
  icon_url:string|null; website_url:string; privacy_url:string|null; developer_name:string|null; category_id:string|null; supported_countries:string[];
  status:AppStatus; suspension_reason:string|null; verified:boolean; featured:boolean; embed_mode:EmbedMode; health_status:HealthStatus; installable:boolean;
  sort_order:number; created_by:string|null; published_at:string|null; created_at:string; updated_at:string; boost_until?:string|null; home_ad_until?:string|null; category?:Category|null;
}
export interface AppSubmission {
  id:string; user_id:string; app_id:string|null; submission_type:SubmissionType; app_name:string; app_version:string; website_url:string; icon_url:string|null;
  description_ar:string; description_en:string; category_id:string|null; countries:string[]; privacy_url:string|null; contact_email:string; notes:string|null;
  status:SubmissionStatus; review_note:string|null; reviewed_by:string|null; reviewed_at:string|null; created_at:string; payment_status?:ListingPaymentStatus;
  listing_price?:number; payment_currency?:string; payment_transaction_id?:string|null; payment_checkout_url?:string|null; payment_started_at?:string|null;
  paid_at?:string|null; refunded_amount?:number; updated_at?:string;
}
export interface DeveloperListingSettings { listing_enabled:boolean; fee_enabled:boolean; fee_amount:number; currency:'pi'; max_apps_per_developer:number; max_pending_submissions:number; }
export interface DeveloperPromotionSettings { boost_enabled:boolean; boost_daily_price:number; boost_max_days:number; home_ad_enabled:boolean; home_ad_daily_price:number; home_ad_max_days:number; home_ad_slots:number; }
export interface AppPromotion {
  id:string; user_id:string; app_id:string; kind:PromotionKind; duration_days:number; amount:number; currency:'pi'; status:PromotionStatus;
  payment_transaction_id:string|null; payment_checkout_url:string|null; payment_started_at:string|null; paid_at:string|null; starts_at:string|null; ends_at:string|null;
  refunded_amount:number; created_at:string; updated_at:string; app?:DirectoryApp|null;
}
export interface Announcement { id:string; title_ar:string; title_en:string; body_ar:string; body_en:string; kind:'info'|'success'|'warning'; is_active:boolean; starts_at:string|null; ends_at:string|null; }
