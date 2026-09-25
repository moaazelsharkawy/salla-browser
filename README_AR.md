# Salla Browser — المشروع الأولي الكامل

المشروع مبني من الصفر ليكون متصفح/Hub لتطبيقات منظومة Salla بنفس فلسفة التصميم الحالية: Flat + Soft، خفيف، متجاوب، بدون مؤثرات زجاجية ثقيلة، بخط Cairo للعربي وOutfit للإنجليزي.

## الموجود فعليا

- الصفحة الرئيسية وشريط بحث علوي.
- البحث داخل دليل تطبيقات Salla أثناء الكتابة، ثم بحث ويب عند Enter.
- أقسام ودول وتطبيقات مميزة وحالات Online / Maintenance / New / Updated.
- صفحة تفاصيل لكل تطبيق.
- متصفح مضمن iframe مع رجوع وتحديث وHome وفتح خارجي.
- حساب مستخدم Email/Password.
- Passkey / بصمة اختيارية عبر WebAuthn وSupabase Edge Function.
- تثبيت المتصفح نفسه كـ PWA.
- تثبيت/Pin التطبيقات في حساب المستخدم.
- طلب إدراج تطبيق ومتابعة حالة الطلب.
- لوحة إدارة لإضافة وتعديل التطبيقات، الأقسام، ومراجعة طلبات الإدراج.
- Supabase RLS وقاعدة بيانات كاملة وStorage bucket للأصول.
- تجهيز Capacitor كبداية لنسخة Android/iOS لاحقا.

## التشغيل

1. انسخ `.env.example` إلى `.env`.
2. ضع رابط Supabase والـAnon Key.
3. نفذ migration الموجودة في `supabase/migrations`.
4. شغل:

```bash
npm install
npm run dev
```

## جعل حسابك Admin

بعد إنشاء حسابك أول مرة نفذ من SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'بريدك';
```

## تفعيل البصمة / Passkey

انشر Edge Function `passkey` بدون verify_jwt العام لأن جزء تسجيل الدخول يحتاج استدعاء قبل وجود Session؛ الدالة نفسها تتحقق من JWT في إجراءات تسجيل Passkey الجديدة.

```bash
supabase functions deploy passkey --no-verify-jwt
supabase secrets set PASSKEY_RP_ID=your-domain.com
supabase secrets set PASSKEY_ORIGIN=https://your-domain.com
supabase secrets set PASSKEY_RP_NAME="Salla Browser"
```

لا يتم إرسال أو تخزين بصمة المستخدم. التحقق الحيوي يتم على الجهاز عبر WebAuthn.

## نقطة مهمة عن Google وWebView

نسخة الويب/PWA لا تستطيع إجبار Google أو أي موقع يمنع iframe على الظهور داخل الإطار. لذلك وضعت زر فتح خارجي واضح، وكذلك خيار `embed_mode` لكل تطبيق من الإدارة. هذا ليس خطأ في المشروع بل قيد أمني من المواقع نفسها.

للنسخة الأصلية Android/iOS يمكن لاحقا ربط `/browse` بـWebView/In-App Browser Native مع الحفاظ على نفس قاعدة البيانات والواجهة.
