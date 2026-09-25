# Salla Browser v005 — رفع التحديث على المستودع الحالي

المستودع الحالي:
`https://github.com/moaazelsharkawy/salla-browser`

الإصدار: `2026.09.25.005`
الدومين النهائي: `https://browser.salla-shop.com`

## 1) تحديث ملفات المشروع في Google Cloud Shell

بعد رفع الملف `salla-browser-v005.zip` إلى Cloud Shell:

```bash
cd ~
rm -rf update-v005
mkdir update-v005
unzip -q salla-browser-v005.zip -d update-v005
```

ثم استبدل ملفات المستودع مع الحفاظ على `.git` وملفات البيئة:

```bash
cd ~/salla-browser

find . -mindepth 1 -maxdepth 1 \
  ! -name '.git' \
  ! -name 'node_modules' \
  ! -name '.env' \
  ! -name '.env.*' \
  ! -name '.vercel' \
  -exec rm -rf {} +

cd ~/update-v005/salla-browser

tar \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='.vercel' \
  -cf - . | (cd ~/salla-browser && tar -xf -)
```

## 2) فحص البناء قبل الرفع

```bash
cd ~/salla-browser
npm install
npm run build
```

لا تعمل Push إذا ظهر Build Error؛ أصلحه أولا.

## 3) Commit و Push

```bash
cd ~/salla-browser
GITHUB_ID=$(gh api user --jq '.id')

git config user.name "moaazelsharkawy"
git config user.email "${GITHUB_ID}+moaazelsharkawy@users.noreply.github.com"

git status
git add -A
git commit -m "Salla Browser v005 UX SEO backend update"
git push origin main
```

Vercel يبدأ Deploy جديد تلقائيا بعد الـPush.

---

# متطلبات Supabase للنسخة v005

## 1) طبق الـmigration الجديد

الملف:

`supabase/migrations/202609250005_developer_accounts_and_site_config.sql`

يمكن تطبيقه من Supabase SQL Editor بنسخ محتواه وتشغيله، أو باستخدام Supabase CLI إذا كان المشروع مربوطا.

التحديث يفعل الآتي:
- الحسابات الجديدة من صفحة التسجيل تصبح `developer`.
- يحافظ على حسابات الاختبار القديمة بتحويل `user` إلى `developer`.
- طلب إدراج تطبيق يصبح مسموحا فقط للمطور أو Admin.
- التصفح والتثبيت المحلي لا يحتاجان حسابا.
- يحفظ إعدادات الموقع الرسمية في `app_settings`.

## 2) أعد نشر Edge Function الخاصة بالـPasskey

```bash
supabase functions deploy passkey
```

واضبط Secrets الإنتاج:

```bash
supabase secrets set PASSKEY_RP_ID=browser.salla-shop.com
supabase secrets set PASSKEY_ORIGIN=https://browser.salla-shop.com
supabase secrets set PASSKEY_RP_NAME="Salla Browser"
```

الدالة تقبل الآن Passkey لحسابات `developer` و`admin` فقط.

## 3) Supabase Auth URLs

من:
`Authentication > URL Configuration`

ضع:

- Site URL: `https://browser.salla-shop.com`
- Redirect URL: `https://browser.salla-shop.com/**`

وأبق رابط Vercel المؤقت ضمن Redirect URLs أثناء الاختبار إذا احتجته.

---

# متطلبات Vercel

اضبط Environment Variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

نفس القيم تستخدمها دالة Sitemap على Vercel لقراءة التطبيقات المنشورة فقط عبر RLS العام.

اربط الدومين:
`browser.salla-shop.com`

ثم اجعله Production Domain الأساسي للمشروع.

الملف `vercel.json` يضيف:
- SPA routing.
- `/sitemap.xml` ديناميكي من التطبيقات المنشورة.
- `/robots.txt`.
- `X-Robots-Tag` للصفحات الخاصة.
- رؤوس أمان أساسية.

---

# SEO بعد ربط الدومين

بعد نجاح النشر:

1. افتح:
   - `https://browser.salla-shop.com/robots.txt`
   - `https://browser.salla-shop.com/sitemap.xml`
2. أضف Property للدومين في Google Search Console.
3. أرسل Sitemap:
   `https://browser.salla-shop.com/sitemap.xml`
4. اطلب فهرسة الصفحة الرئيسية و`/explore`.
5. صفحات التطبيقات المنشورة تدخل Sitemap تلقائيا من Supabase.

تم تجهيز:
- Canonical URL.
- Open Graph.
- Twitter Card.
- JSON-LD لـ WebSite وWebApplication.
- SearchAction.
- Dynamic metadata داخل التطبيق.
- Dynamic sitemap للتطبيقات المنشورة.
- robots/noindex للصفحات الخاصة.
- OG image 1200x630.
- PWA icons وfavicon وApple Touch Icon وMaskable Icon.
