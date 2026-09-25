# Salla Browser v009 Patch

هذا الباتش مبني فوق v008 ويحتوي إصلاحين مركزين:

1. إعادة شعار Salla Browser الأصلي عالي الدقة في الهيدر بدل العلامة SVG التجريبية التي ظهرت بشكل غير متناسق.
2. تقوية تهيئة Supabase للمصادقة بحيث يقرأ التطبيق إعدادات Vercel من VITE_* أو SUPABASE_* أو NEXT_PUBLIC_*، ويعيد طلب Runtime Config قبل تشغيل React إذا لم تتوفر قيم البناء.

## متغيرات Vercel المطلوبة

يكفي وجود زوج واحد صحيح من التالي:

- `SUPABASE_URL` أو `VITE_SUPABASE_URL` أو `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_ANON_KEY` أو `SUPABASE_PUBLISHABLE_KEY` أو `VITE_SUPABASE_ANON_KEY` أو `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SITE_URL=https://browser.salla-shop.com` اختياري لأن له fallback صحيح.

استخدم anon/public أو publishable key فقط. لا تستخدم service_role.

بعد الحفظ اعمل Redeploy.

## فحص الإعداد بعد النشر

افتح:

`https://browser.salla-shop.com/runtime-config.js?v=009`

يجب أن ترى SUPABASE_URL وSUPABASE_ANON_KEY غير فارغين.

إذا كانت إحدى القيم فارغة فالمشكلة في Environment Variables على Vercel وليست في نموذج التسجيل.

## قاعدة البيانات

طبق migration:

`supabase/migrations/202609250009_developer_auth_final.sql`

إذا ظهر `SALLA_BROWSER_INITIAL_SCHEMA_REQUIRED` فهذا يعني أن migration الأساسي `202609250001_initial.sql` لم يطبق بعد.

وتأكد من Supabase Dashboard:

- Authentication > Providers > Email مفعّل للتسجيل بالبريد.
- Google مفعّل إذا أردت Google OAuth.
- Site URL = `https://browser.salla-shop.com`
- Redirect URL يتضمن `https://browser.salla-shop.com/auth/callback`

## Google Cloud

Authorized redirect URI الخاص بتطبيق Google يجب أن يكون Callback الخاص بـ Supabase نفسه:

`https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
