# رفع Salla Browser v004 إلى المستودع الحالي

المستودع الحالي:
`https://github.com/moaazelsharkawy/salla-browser.git`

## من Google Cloud Shell

1. ارفع ملف `salla-browser-polish-v004.zip` إلى Cloud Shell.
2. نفذ:

```bash
cd ~
rm -rf update-v004
mkdir update-v004
unzip -q salla-browser-polish-v004.zip -d update-v004
```

3. حدّث المشروع الحالي مع الحفاظ على `.git` وملفات البيئة:

```bash
cd ~/salla-browser
find . -mindepth 1 -maxdepth 1 \
  ! -name '.git' \
  ! -name 'node_modules' \
  ! -name '.env' \
  ! -name '.env.*' \
  ! -name '.vercel' \
  -exec rm -rf {} +

cd ~/update-v004/salla-browser

tar \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='.vercel' \
  -cf - . | (cd ~/salla-browser && tar -xf -)
```

4. اختبر البناء:

```bash
cd ~/salla-browser
npm install
npm run build
```

5. إذا نجح البناء، ارفع التحديث:

```bash
GITHUB_ID=$(gh api user --jq '.id')
git config user.name "moaazelsharkawy"
git config user.email "${GITHUB_ID}+moaazelsharkawy@users.noreply.github.com"

git add -A
git commit -m "Salla Browser v004 final UI polish"
git push origin main
```

بعد الـ push يبدأ Vercel نشر النسخة الجديدة تلقائيا إذا كان المشروع مربوطا بفرع `main`.
