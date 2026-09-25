export type Language = 'ar' | 'en';
export type AppStatus = 'draft' | 'published' | 'suspended';
export type HealthStatus = 'online' | 'maintenance' | 'new' | 'updated' | 'offline';
export type EmbedMode = 'iframe' | 'external';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';
export type SubmissionType = 'new' | 'update';
export type UserRole = 'user' | 'developer' | 'admin';

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  country_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

export interface DirectoryApp {
  id: string;
  slug: string;
  name: string;
  version: string;
  short_description_ar: string;
  short_description_en: string;
  description_ar: string;
  description_en: string;
  icon_url: string | null;
  website_url: string;
  privacy_url: string | null;
  developer_name: string | null;
  category_id: string | null;
  supported_countries: string[];
  status: AppStatus;
  verified: boolean;
  featured: boolean;
  embed_mode: EmbedMode;
  health_status: HealthStatus;
  installable: boolean;
  sort_order: number;
  created_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  category?: Category | null;
}

export interface AppSubmission {
  id: string;
  user_id: string;
  app_id: string | null;
  submission_type: SubmissionType;
  app_name: string;
  app_version: string;
  website_url: string;
  icon_url: string | null;
  description_ar: string;
  description_en: string;
  category_id: string | null;
  countries: string[];
  privacy_url: string | null;
  contact_email: string;
  notes: string | null;
  status: SubmissionStatus;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Announcement {
  id: string;
  title_ar: string;
  title_en: string;
  body_ar: string;
  body_en: string;
  kind: 'info' | 'success' | 'warning';
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}
