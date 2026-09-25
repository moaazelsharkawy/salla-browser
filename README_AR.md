# Salla Browser — v003

متصفح/Hub لتطبيقات منظومة Salla بتصميم Flat + Soft خفيف ومتجاوب، بخط Cairo للعربي وOutfit للإنجليزي، مع Supabase وPWA وPasskey ولوحة إدارة.

## الموجود فعليا

- الصفحة الرئيسية ودليل تطبيقات Salla.
- بحث فوري داخل التطبيقات أثناء الكتابة.
- زر بحث ويب يفتح Google مباشرة خارج الإطار المضمن لتجنب قيود iframe.
- فتح التطبيقات المعتمدة داخل الإطار فقط عندما يكون `embed_mode = iframe`.
- التطبيقات المضبوطة `external` تفتح خارجيا.
- أقسام ودول وتطبيقات مميزة وحالات Online / Maintenance / New / Updated.
- صفحة تفاصيل لكل تطبيق.
- حساب مستخدم Email/Password.
- Passkey / بصمة اختيارية عبر WebAuthn وSupabase Edge Function.
- تثبيت المتصفح نفسه كـ PWA.
- تثبيت/Pin التطبيقات في حساب المستخدم.
- طلب إدراج تطبيق ومتابعة حالة الطلب.
- لوحة إدارة لإضافة وتعديل التطبيقات والأقسام ومراجعة طلبات الإدراج.
- Supabase RLS وقاعدة بيانات كاملة وStorage bucket للأصول.
- تجهيز Capacitor كبداية لنسخة Android/iOS لاحقا.

## تغييرات v003

- إزالة زر القائمة المكرر من الهيدر؛ كل وظائف المستخدم أصبحت تحت «حسابي» فقط.
- إعادة تصميم نافذة الحساب لتظهر Bottom Sheet على الموبايل وDialog منظم على الشاشات الأكبر.
- إزالة Blur والزجاج والمؤثرات التي تثقل الحركة.
- تحويل الأسطح والبطاقات إلى Borderless.
- إعادة بناء الوضع الفاتح بألوان مستقلة وواضحة بدل مجرد عكس الوضع الداكن.
- تقريب الوضع الداكن من هوية Salla Stars مع كحلي أهدأ وطبقات أوضح.
- تقوية أوزان العناوين والنصوص الثانوية.
- إزالة إطار/Outline حقل البحث؛ التركيز أصبح بتغير خلفية خفيف فقط.
- إلغاء تضمين نتائج Google والمواقع العامة داخل iframe. بحث الويب يفتح Google خارجيا، بينما الإطار المضمن مخصص لتطبيقات الدليل المعتمدة فقط.

## التشغيل

1. انسخ `.env.example` إلى `.env`.
2. ضع رابط Supabase والـAnon Key.
3. نفذ migration الموجودة في `supabase/migrations`.
4. شغل:

```bash
npm install
npm run build
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

```bash
supabase functions deploy passkey --no-verify-jwt
supabase secrets set PASSKEY_RP_ID=your-domain.com
supabase secrets set PASSKEY_ORIGIN=https://your-domain.com
supabase secrets set PASSKEY_RP_NAME="Salla Browser"
```

لا يتم إرسال أو تخزين بصمة المستخدم. التحقق الحيوي يتم على الجهاز عبر WebAuthn.

## التصفح والبحث

نسخة الويب/PWA لا تحاول تضمين Google أو المواقع العامة داخل iframe. عند البحث على الويب يتم فتح Google مباشرة خارج التطبيق، لأن كثيرا من المواقع تمنع iframe أمنيا. التضمين داخل Salla Browser يبقى فقط للتطبيقات التي تضبطها الإدارة على `embed_mode = iframe`.
