# Salla Browser v006 - حزمة تحديث محدودة

هذه الحزمة تحتوي الملفات المعدلة فقط فوق v005.

## أهم التغييرات
- إصلاح نافذة حسابي نهائيا باستخدام Portal إلى `document.body` لتظهر في منتصف الشاشة دائما.
- تشويش وتعتيم خفيف للخلفية مع قفل تمرير الصفحة أثناء فتح النافذة.
- إزالة الأيقونة المكررة من زر اختيار الدولة.
- تقليل حجم عنوان استكشف التطبيقات.
- تعزيز اللون الأرجواني في الوضع الداكن مع الحفاظ على السماوي كلون الإجراء الأساسي.
- إضافة Google OAuth لدخول/إنشاء حساب المطور.
- بعد تسجيل مطور جديد، يتم عرض تفعيل Passkey/البصمة مباشرة إذا لم توجد Passkey للحساب.
- تحديث Edge Function الخاصة بـ Passkey بإجراء `status`.
- Migration جديد لتفعيل دور developer للحساب المصادق عليه وإعدادات Google auth.

## إعداد Supabase / Google
1. من Supabase Dashboard > Authentication > Providers > Google فعّل Google.
2. في Google Cloud OAuth أضف Callback URL الذي تعرضه Supabase داخل إعداد Google Provider (يكون عادة رابط مشروع Supabase `/auth/v1/callback`).
3. في Supabase Authentication > URL Configuration:
   - Site URL: `https://browser.salla-shop.com`
   - Redirect URL مسموح: `https://browser.salla-shop.com/auth/callback`
4. طبّق migration:
   `supabase/migrations/202609250006_google_developer_auth.sql`
5. أعد نشر:
   `supabase functions deploy passkey`

## ملاحظة Passkey
لا يتم تشغيل نافذة البصمة قسرا بدون تفاعل المستخدم. بعد نجاح التسجيل تظهر شاشة مباشرة بزر "تفعيل البصمة الآن" لأن WebAuthn يحتاج تفاعل مستخدم صريح في المتصفحات الحديثة.
