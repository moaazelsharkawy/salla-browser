# Salla Browser v005

نسخة هوية وتجربة مستخدم وSEO وباك اند محدثة للدومين:
`https://browser.salla-shop.com`

## أهم التغييرات

- نافذة حسابي أصبحت Modal مركزي مع تعتيم وتشويش خفيف للخلفية.
- الحساب موضح كمزية للمطورين وأصحاب التطبيقات فقط؛ المستخدم العادي يتصفح ويثبت تطبيقات محليا بدون حساب.
- التطبيقات المثبتة تعمل عبر localStorage بدون تسجيل، وتندمج مع Supabase إذا سجل المطور دخوله.
- Country Picker جديد قابل للبحث بدل select النظام، ويشمل دول العالم.
- لوجو Salla Browser جديد مبني على التصميم المرفق، مع كل مقاسات PWA/Favicon/Apple/Maskable.
- شاشتا Intro بهوية Web3 مع حركة Floating خفيفة وتحترم prefers-reduced-motion.
- تحديث ألوان Navy + Cyan + Purple مع الحفاظ على الأداء والتصميم Borderless.
- Bottom Navigation أصبح 4 عناصر؛ الحساب في الهيدر فقط.
- حسابات التسجيل الجديدة Developer، وRLS يمنع إدراج التطبيقات لغير Developer/Admin.
- Passkey مقيد للمطورين/Admin ومهيأ للدومين الرسمي.
- SEO شامل: Canonical, OG, Twitter, JSON-LD, robots, dynamic sitemap, noindex للصفحات الخاصة.

## ملاحظات البناء

نفذ:

```bash
npm install
npm run build
```

قبل رفع التحديث إلى `main`.

راجع `README_UPDATE_GITHUB_AR.md` لخطوات GitHub وSupabase وVercel بالتفصيل.
