# Salla Browser v008 Patch

هذا الباتش مبني مباشرة فوق v007 ويحتوي الملفات المعدلة فقط.

## ما تم إصلاحه

- شعار الهيدر أصبح Vector داخل الواجهة، لذلك يظل حادا وواضحا في الوضع الفاتح والداكن بدون الاعتماد على صورة 96px.
- تغميق بسيط ومدروس لخلفية زر حسابي وزر اللغة في الوضع الفاتح لزيادة الوضوح.
- تكبير أيقونة التنبيه داخل ملاحظة حساب المطور.
- إضافة Runtime Config عام لـ Supabase على Vercel؛ التطبيق يدعم الآن إعداد Supabase بطريقتين:
  - VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY وقت البناء.
  - أو SUPABASE_URL + SUPABASE_ANON_KEY وقت التشغيل من Vercel، وهو الخيار الموصى به هنا.
- تحديث Sitemap ليقرأ نفس إعدادات Supabase الجديدة.
- إضافة migration v008 يعيد تثبيت trigger إنشاء profile ودالة activate_developer_account بصورة idempotent.

## تفعيل تسجيل المطورين على Vercel

في Project Settings > Environment Variables أضف:

- `SUPABASE_URL` = `https://YOUR_PROJECT_REF.supabase.co`
- `SUPABASE_ANON_KEY` = الـ anon key أو publishable key فقط
- `SITE_URL` = `https://browser.salla-shop.com`

يمكنك إبقاء متغيرات VITE القديمة أيضا، لكن لم تعد مطلوبة إذا استخدمت المتغيرات الثلاثة أعلاه.

مهم جدا: لا تستخدم `service_role` أو أي secret key داخل أي متغير عام للواجهة.

بعد حفظ المتغيرات اعمل Redeploy جديد في Vercel.

## Supabase

تأكد أن migrations الأساسية للمشروع مطبقة، ثم طبق:

`supabase/migrations/202609250008_developer_auth_runtime_hardening.sql`

وتأكد من:

1. Authentication > Providers > Email مفعّل إذا أردت التسجيل بالبريد وكلمة المرور.
2. Google Provider مفعّل إذا أردت Google OAuth.
3. Site URL في Supabase هو `https://browser.salla-shop.com`.
4. Redirect URL المسموح داخل Supabase يتضمن `https://browser.salla-shop.com/auth/callback`.
5. عند إعداد Google Cloud، Redirect URI الخاص بمزود Google نفسه يكون رابط callback الخاص بـ Supabase لمشروعك: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`.
6. أعد نشر Edge Function الخاصة بالـ passkey إذا لم تكن منشورة بأحدث نسخة.

## فحص سريع

بعد النشر افتح:

`https://browser.salla-shop.com/runtime-config.js`

يجب أن ترى `SUPABASE_URL` و `SUPABASE_ANON_KEY` بقيم غير فارغة. الـ anon key عام بطبيعته ومسموح ظهوره في العميل؛ لا يجب أن يظهر أي service_role.

ثم اختبر:

- إنشاء حساب بالبريد.
- تسجيل الدخول بالبريد.
- Google OAuth.
- ظهور خطوة تفعيل Passkey بعد نجاح أول دخول إذا لم يوجد Passkey.
