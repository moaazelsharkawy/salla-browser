# Salla Browser v014

يتضمن هذا الباتش:
- لوج Webhook شامل واحد للنجاح ولوج شامل واحد للفشل
- إعادة الصفحة للأعلى عند فتح تفاصيل تطبيق أو أي Route داخلي باستثناء المتصفح المضمن
- نظام ترويج مدفوع بنوعين: تعزيز داخل الدليل وإعلان الصفحة الرئيسية
- شارة مروج أو إعلان على بطاقة التطبيق بدون إظهار مبلغ الدفع للعامة
- ترتيب التطبيقات ذات التعزيز النشط قبل غيرها مع بقاء التقييم العضوي مستقلا
- صفحة للمطور لاختيار نوع الحملة والمدة والدفع عبر Hosted Checkout
- صفحة إدارة مستقلة للأسعار والمدد وعدد مساحات إعلانات الرئيسية
- رابط إدارة الترويج داخل نافذة حساب المدير

## بعد رفع الملفات

```bash
npx supabase link --project-ref fsxiclfljotvvadstjxt
npx supabase db push
npx supabase functions deploy create-promotion-checkout
npx supabase functions deploy salla-listing-webhook --no-verify-jwt
```

لا توجد Secrets جديدة. يستخدم النظام نفس:
- SALLA_SHOP_API_KEY
- SALLA_SHOP_WEBHOOK_SECRET
- SALLA_BROWSER_ORIGIN
