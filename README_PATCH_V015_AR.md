# Salla Browser v015

هذا التحديث يحتوي فقط على التعديلات الحالية المطلوبة:

- استبدال ايقونة Sparkles الخاصة بشارة مروج بايقونة Flame وعدم استخدام Sparkles في الواجهة
- تنظيف نفس الايقونة من لوحة الادارة بواسطة apply-v015.sh
- استدعاء Confirm API بعد وصول Webhook دفع ناجح والتحقق من HMAC
- تطبيق Confirm على رسوم ادراج التطبيق وعلى Boost واعلان الصفحة الرئيسية
- عدم تفعيل الحملة قبل نجاح Confirm
- منع تمديد الحملة مرة ثانية عند تكرار نفس Webhook
- تخزين confirmed_at لكل عملية تم فكها بنجاح
- لوج واحد شامل SUCCESS او FAILED لكل استدعاء Webhook مع نتيجة Confirm

## مهم
شغل migration الجديد ثم اعد نشر salla-listing-webhook.
لا توجد مفاتيح جديدة. يتم استخدام SALLA_SHOP_API_KEY و SALLA_SHOP_WEBHOOK_SECRET و SALLA_BROWSER_ORIGIN الحالية.
