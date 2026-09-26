# Salla Browser v012 Patch

هذا الباتش يضيف تحسينات الترجمة ووضع عرض التطبيق الكامل ونظام رسوم إدراج المطورين عبر Salla Shop Hosted Checkout

## ما تم تنفيذه

- مراجعة رسائل التحميل والحالات الرئيسية بالعربية والإنجليزية
- إزالة الرسائل التقنية الخام من واجهات المطور وتبديلها برسائل مفهومة
- إخفاء شريط التنقل السفلي أثناء فتح تطبيق داخل Salla Browser
- إلغاء المساحة السفلية الزائدة في وضع التطبيق واستغلال الارتفاع الكامل
- Spinner خفيف مع نص جاري الفتح بدل Loading الخام
- إعدادات إدارة جديدة للمطورين
  - تشغيل أو إيقاف استقبال إدراجات جديدة
  - تشغيل أو إيقاف رسوم الإدراج
  - تحديد السعر بعملة Pi
  - تحديد الحد الأقصى للتطبيقات لكل مطور
  - تحديد الحد الأقصى للطلبات النشطة لكل مطور
- الرسوم تطبق فقط على إدراج تطبيق جديد ولا تطبق على تحديث تطبيق منشور
- حفظ سعر الإدراج داخل الطلب لحظة إنشائه حتى لا تتأثر الطلبات القديمة بتغيير السعر
- ربط Hosted Checkout من Salla Shop من خلال Edge Function آمنة
- تأكيد الدفع من Webhook موقّع HMAC SHA256
- منع الإدارة من اعتماد طلب إدراج مدفوع قبل تأكيد الدفع
- إمكانية استكمال الدفع من صفحة طلبات المطور
- عرض حالة الدفع والسعر في صفحة المطور ولوحة الإدارة

## Migration

نفذ الملف

supabase/migrations/202609260040_developer_listing_payments.sql

## أسرار Supabase المطلوبة

لا تضع مفتاح Salla Shop داخل React أو Vercel public env
ضعه كسر داخل Supabase Functions

```bash
npx supabase secrets set SALLA_SHOP_API_KEY="YOUR_SALLA_SHOP_API_KEY"
npx supabase secrets set SALLA_SHOP_WEBHOOK_SECRET="YOUR_WEBHOOK_SECRET"
npx supabase secrets set SALLA_BROWSER_ORIGIN="https://browser.salla-shop.com"
```

## نشر الدوال

```bash
npx supabase functions deploy create-listing-checkout
npx supabase functions deploy salla-listing-webhook --no-verify-jwt
```

## Webhook

سجل الرابط التالي في Salla Shop

```text
https://fsxiclfljotvvadstjxt.supabase.co/functions/v1/salla-listing-webhook
```

وسجل هذا النطاق ضمن المواقع المسموح بها لمفتاح API

```text
https://browser.salla-shop.com
```

## ملاحظات الدفع

- لا يعتمد النظام على success_url لإثبات الدفع
- النجاح الحقيقي يثبت فقط من Webhook الموقع
- extapi-confirm غير مستخدمة تلقائيا لأن الخدمة تحتاج اعتماد الفك الفوري من Salla Shop
- نظام Escrow يبقى كما هو حسب بوابة الدفع
