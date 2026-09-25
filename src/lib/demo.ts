import type { Category, DirectoryApp } from '../types';

export const demoCategories: Category[] = [
  { id: 'cat-shopping', slug: 'shopping', name_ar: 'التسوق', name_en: 'Shopping', description_ar: 'متاجر وخدمات منظومة Salla', description_en: 'Salla ecosystem shops and services', icon: 'store', sort_order: 1, is_active: true },
  { id: 'cat-web3', slug: 'web3', name_ar: 'Web3', name_en: 'Web3', description_ar: 'تطبيقات Web3 والمحافظ', description_en: 'Web3 apps and wallets', icon: 'blocks', sort_order: 2, is_active: true },
  { id: 'cat-tools', slug: 'tools', name_ar: 'الأدوات', name_en: 'Tools', description_ar: 'أدوات مساعدة للمستخدمين', description_en: 'Utilities for users', icon: 'wrench', sort_order: 3, is_active: true },
  { id: 'cat-finance', slug: 'finance', name_ar: 'المالية', name_en: 'Finance', description_ar: 'الدفع والخدمات المالية', description_en: 'Payments and finance', icon: 'wallet', sort_order: 4, is_active: true }
];

const now = new Date().toISOString();

export const demoApps: DirectoryApp[] = [
  {
    id: 'demo-stars', slug: 'salla-stars', name: 'Salla Stars',
    short_description_ar: 'شحن نجوم Telegram وPremium بسهولة', short_description_en: 'Telegram Stars and Premium in one place',
    description_ar: 'تطبيق Salla لشحن نجوم Telegram واشتراكات Premium مع طرق دفع متعددة وتجربة متابعة واضحة.',
    description_en: 'Salla app for Telegram Stars and Premium with multiple payment methods and clear order tracking.',
    icon_url: '/icons/icon-512.png', website_url: 'https://example.com', privacy_url: null, developer_name: 'Salla', category_id: 'cat-shopping', supported_countries: ['ALL'], status: 'published', verified: true, featured: true, embed_mode: 'iframe', health_status: 'online', installable: true, sort_order: 1, created_by: null, published_at: now, created_at: now, updated_at: now
  },
  {
    id: 'demo-net', slug: 'salla-net', name: 'SallaNet',
    short_description_ar: 'بوابة دفع وخدمات مرتبطة بمنظومة Salla', short_description_en: 'Payments and connected Salla services',
    description_ar: 'خدمة ضمن منظومة Salla للدفع والربط بين التطبيقات.', description_en: 'A Salla ecosystem service for payments and app connectivity.',
    icon_url: '/icons/icon-192.png', website_url: 'https://example.com', privacy_url: null, developer_name: 'Salla', category_id: 'cat-finance', supported_countries: ['ALL'], status: 'published', verified: true, featured: true, embed_mode: 'iframe', health_status: 'updated', installable: true, sort_order: 2, created_by: null, published_at: now, created_at: now, updated_at: now
  },
  {
    id: 'demo-web3', slug: 'salla-web3', name: 'Salla Web3',
    short_description_ar: 'مساحة Web3 لتطبيقات Salla', short_description_en: 'Salla Web3 app space',
    description_ar: 'واجهة مخصصة لتطبيقات وخدمات Web3 المتوافقة مع منظومة Salla.', description_en: 'A dedicated space for Web3 apps and services connected to Salla.',
    icon_url: '/icons/icon-192.png', website_url: 'https://example.com', privacy_url: null, developer_name: 'Salla', category_id: 'cat-web3', supported_countries: ['ALL'], status: 'published', verified: true, featured: false, embed_mode: 'iframe', health_status: 'new', installable: true, sort_order: 3, created_by: null, published_at: now, created_at: now, updated_at: now
  }
];
