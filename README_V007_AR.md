# Salla Browser v007 — Patch فقط

هذا التحديث مبني فوق v006 ويحتوي على الملفات المعدلة فقط.

## ما تم تحسينه
- تحديد اللغة تلقائيا في أول استخدام من لغة المتصفح/الجهاز، ثم احترام اختيار المستخدم المحفوظ بعد تغييره يدويا.
- إضافة زر إظهار/إخفاء كلمة المرور في تسجيل الدخول وإنشاء حساب المطور.
- نسخة فاتحة من شعار الهيدر وصفحات المصادقة حتى لا تظهر الخلفية السوداء الحادة في Light Mode.
- تنعيم خلفيات أزرار الأيقونات ومنها المفضلة.
- تكبير رمز صفحة تسجيل/دخول المطور ليتناسب مع البطاقة.
- إخفاء رسالة إعداد Supabase التقنية عن المستخدم النهائي واستبدالها برسالة خدمة واضحة؛ التفاصيل التقنية تظل للمطور.
- الإصدار: 2026.09.25.007 / package 0.5.2.

## متطلبات Vercel اللازمة لتشغيل التسجيل
أضف في Project > Settings > Environment Variables:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_SITE_URL=https://browser.salla-shop.com
```

فعّلها لـ Production وPreview وDevelopment ثم اعمل Redeploy.

## Google Auth
في Supabase > Authentication > Providers > Google فعّل Google، واجعل Site URL:

```text
https://browser.salla-shop.com
```

وأضف Redirect URL:

```text
https://browser.salla-shop.com/auth/callback
```
