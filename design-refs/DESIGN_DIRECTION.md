# MAHENDESYAR V2 — VISUAL DESIGN DIRECTION
### استخراج‌شده از تحلیل یکپارچه ۷ تصویر مرجع (design-refs/ref1..ref7) — فاز قبل از پیاده‌سازی

---

# بخش ۱ — تحلیل تفصیلی رفرنس‌ها

۷ تصویر = ۶ زبان طراحی متمایز (ref1 و ref2 یک محصول‌اند).

## ref1 + ref2 — Habit Tracker (زیتونی / Chartreuse)

**۱. Layout و Composition**
- تک‌ستون سخت‌گیرانه؛ گاتر ~20؛ حداکثر ۲ کارت در ردیف؛ گپ سکشن‌ها 24
- نقطه تمرکز با «رنگ» هدایت می‌شود نه اندازه: روز انتخاب‌شده، chip فعال، nav فعال — همه لایم
- تقویم بلوک غالب صفحه History؛ نسبت تقریبی: data 60 / action 25 / متن 15
- whitespace سخاوتمند، density کم‌به‌متوسط؛ هیچ صفحه شلوغ نیست

**۲. Visual Language**
- پس‌زمینه مشکی با tint زیتونی؛ کارت یک پله روشن‌تر + بوردر هیرلاین کم‌کنتراست
- سایه تقریباً صفر — سلسله‌مراتب با «پله سطح» ساخته می‌شود نه shadow
- radius سیستم‌دار: کارت 20-24، chip گرد کامل
- تایپ هندسی؛ عدد درشت به‌عنوان قهرمان کارت («100 / 60»)؛ آیکون stroke نازک داخل icon-chip مربع‌گرد

**۳. Data Visualization**
- تقویم با روزهای خالی dashed (تشخیص آینده از گذشته)، week-strip، chip فیلتر
- پیشرفت فقط با fill اکسنت؛ هیچ نمودار پیچیده‌ای نیست اما هر عنصر یک معنی دقیق دارد

**۴. Interaction**
- selected حالت «بلند»: pill لایمِ پر؛ segmented دوره روز (صبح/بعد/عصر)
- nav فعال = pill لایم با icon+label؛ معادل press = تعویض fill؛ لینک‌های See All

**۵. Motion (استنباطی)**
- تعویض انتخاب 120-160ms؛ ورود کارت‌ها با stagger؛ بدون افکت سنگین — سرعت = حس ابزار دقیق

**۶. Graphics / Imagery**
- عکس انسانی فقط داخل hero card؛ icon-chip ها زبان ثابت؛ glow زیتونی خیلی ملایم بالای صفحه

**۷. UX**
- نگاه اول: «امروز کجای مسیرم؟» (روز انتخابی + chip فعال)
- primary = ادامه عادت جاری؛ secondary = فیلتر / See All
- progressive disclosure: ماه → هفته → روز → لیست

---

## ref3 — Fitness + آمار (بادمجانی / کرم-صورتی)

**۱. Layout**
- Onboarding: عکس فول‌بلید + متن پایین؛ Dashboard: هدر دوبخشی (greeting / search+avatar)، hero بنر، chips، کارت‌های دوتایی
- صفحه آمار: عدد بزرگ بالا → segmented → نمودار که 60% ارتفاع را می‌گیرد = فوکوس مطلق

**۲. Visual Language**
- بادمجانی عمیق، متن یاسی؛ دو اکسنت نقشی: صورتی (search pill) و کرم (chip فعال + callout)
- خط نمودار نازک با gradient خیلی ملایم؛ callout = pill کرم با متن تیره (کنتراست معکوس)
- radius دوگانه: chips کامل‌گرد / کارت 16-20؛ سایه کم

**۳. Data Visualization** ⭐ مهم‌ترین رفرنس چارت
- خط روند با «تک‌نقطه هایلایت» + خط عمودی راهنما + callout عددی (505 cal روی جمعه)
- segmented Day/Week/Month برای تغییر granularity؛ KPI هفتگی با فلش روند
- mini-tiles با micro-bar sparkline

**۴. Interaction**
- segmented با pill کرمِ متحرک؛ chips با fill کرم؛ لینک View all؛ nav شناور تیره

**۵. Motion**
- draw-in نمودار، pop callout، slide segmented — بازه 150-300ms

**۶. Graphics**
- عکس با wash بنفش؛ blob های تیره انتزاعی در پس‌زمینه

**۷. UX**
- نگاه اول: «آیا بهتر می‌شوم؟» — callout نمودار بلافاصله جواب می‌دهد
- primary = کاوش بازه‌ها؛ secondary = View all / فیلتر
- disclosure: کل → بازه → نقطه

---

## ref4 — زبان‌آموزی (زغالی-سرمه‌ای / مس) — نزدیک‌ترین رفرنس به محصول مطالعه

**۱. Layout**
- فلش‌کارت: یک شیء در مرکز + whitespace extreme — فوکوس با «حذف» ساخته شده
- خانه: بنر اعلان → کارت schedule با گرادیان مس → greeting + streak → chips → گرید ۲ستونه
- کوئیز: eyebrow label → instruction → media → سؤال → options فول‌عرض → footer با progress + Next

**۲. Visual Language**
- زغالی سرمه‌ای؛ کارت مسِ گرم = «شیء پرمیوم» یکتا در کل صفحه (تنها گرادیان)
- اکشن سبز «ADD TO NOTEBOOK (22)» — شمارنده داخل label
- option انتخابی = کهربایی tint + بوردر روشن‌تر؛ progress مرجانی؛ radius کارت 16-20

**۳. Data Visualization** ⭐ الگوی کلیدی
- دیتا «داخل زبان» است: «You've studied 66 days in a row. Earn 192 points…» با اعداد بولد
- progress bar + شمارنده «3/10»؛ countdown «in 10 mins» — ویجت جدا نمی‌سازد

**۴. Interaction**
- option row با آیکون lead؛ selected = tint + border (هرگز بی‌رنگ نیست)
- Next Question → CTA متنی با فلش؛ پلیر صوتی با سرعت؛ notebook با badge شمارش

**۵. Motion**
- tint transition انتخاب، fill پیشرفت، slide بنر اعلان — همه کوتاه و کاربردی

**۶. Graphics**
- عکس واقعی (پرتره/مکان)؛ سطح مس به‌عنوان «متریال» خاص؛ صفر بازیگوشی

**۷. UX**
- کوئیز صفر ابهام: context → task → options → progress؛ primary = Next؛ secondary = تکرار صوت/notebook
- فلش‌کارت: disclosure با بخش SAMPLE (کلمه → تلفظ → جمله نمونه)

---

## ref5 — Analytics Kit رینبو (Freepik) — ضدالگو + بانک ایده

- ❌ رد: نمودار rainbow، مثلث‌های گرادیانی چندرنگ، legend نقطه‌ای بزرگ، گرادیان پوستری، glow فراگیر — دقیقاً موارد منع دستورالعمل پروژه
- ✅ ایده قابل نگه‌داشت (به اجرای خنثی): ring امتیاز مرکزی؛ کارت مقایسه با جداکننده مورب (3.7↔4.6 + ستاره برنده)؛ stepper افقی؛ ring های درصد؛ callout عدد+تیک؛ ناحیه با marker

---

## ref6 — Habit/Fitness سبز

**۱. Layout**
- ردیف KPI سه‌تایی در یک خط: ring 80٪ / bar خطی 999/2000 / micro-bars خواب — تنوع «نوع» نمودار، نه رنگ
- لیست Today Plan: thumbnail + badge سطح بالا-راست + لینک Continue/Start سمت راست ردیف

**۲. Visual Language**
- مشکی سبزفام + لایم؛ badge = pill کوچک با متن ریز؛ thumbnail گرد 12-14؛ جدایی ردیف‌ها با «پله سطح» نه خط جداکننده

**۳. Data Visualization** ⭐
- سه viz متفاوت در یک ردیف بدون rainbow؛ دیاگرام بدنِ قابل‌انتخاب با هایلایت — «انتخاب روی خودِ دیتا»

**۴. Interaction**
- action در سطح ردیف (Continue/Start)؛ carousel افقی با فلش ناوبری؛ nav pill فعال

**۵. Motion**
- snap carousel، هایلایت انتخاب، fill پیشرفت

**۶. Graphics**
- thumbnail کوچک + ایلوستریشن تکنیکال سبز (تشریحی، نه کارتونی)

**۷. UX**
- نگاه اول: وضعیت امروز (3 KPI) → «بعدش چی؟» (plan)؛ primary = Continue آیتم جاری
- disclosure: KPI → ردیف → جزئیات

---

## ref7 — Fitness لایم (سبز-مشکی + glow)

**۱. Layout**
- onboarding: عکس فول‌بلید + glow پشت سوژه + تیتر دوخطی (کلمه اکسنت + بقیه سفید)
- خانه: greeting + chip streak → week strip با تیک روزهای انجام‌شده → کارت level (24/60) → chips → کارت‌های افقی با متاچیپ → FAB
- detail: هدر تصویری → chips متا → ردیف‌های تمرین با play → ⭐ CTA چسبان پایین

**۲. Visual Language**
- سبز-مشکی + radial glow (امضای بصری)؛ لایم vivid؛ chips شیشه‌ای «ملایم» روی عکس؛ radius 20-24
- تایپ: ترکیب وزن + italic برای کلمه تأکیدی

**۳. Data Visualization**
- week strip = نمودار پایبندی هفتگی؛ level progress با لیبل و «24/60»؛ متاچیپ‌های icon+value (345 Kcal / 32 min)

**۴. Interaction**
- انتخاب روز = outline لایم + dot؛ chip با fill؛ FAB شناور؛ play در هر ردیف؛ CTA چسبان = صفر dead-end

**۵. Motion**
- شناوری FAB، fill chip، parallax هدر (احتمالی)، slide-up CTA

**۶. Graphics**
- عکس color-graded + glow — یک «لحظه امضا» در هر صفحه

**۷. UX**
- نگاه اول: «این هفته روی مسیرم؟» → «سطحم؟» → «الان چی کار کنم؟»
- primary = شروع/ادامه تمرین؛ secondary = فیلتر / علاقه‌مندی

---

# بخش ۲ — چرا این‌ها «Premium» به نظر می‌رسند؟ (جمع‌بندی Cross-Reference)

1. **یک اکسنت، مصرف جراحی** — رنگ فقط برای معنا (انتخاب/CTA/پیشرفت)، هرگز برای تزئین
2. **سلسله‌مراتب با پله سطح + هیرلاین، نه سایه** — حس «ابزار دقیق» به‌جای «پوستر»
3. **anatomy ثابت کارت‌ها** — icon-chip + label کوچک + value درشت؛ چشم همیشه می‌داند کجا را بخواند
4. **فوکوس با حذف** — ref4 فلش‌کارت: هرچه حذف کنی، باقی‌مانده گران‌تر به نظر می‌رسد
5. **دیتا در زبانِ جمله** — streak و هدف داخل متن با اعداد بولد (ref4) + تنوع viz از نوع نه رنگ (ref6)
6. **CTA چسبان + شمارش زنده** — کاربر هیچ‌وقت در بن‌بست نمی‌افتد؛ کنترل = لوکس
7. **دقت تایپوگرافیک ریز** — eyebrow label، متاچیپ، شمارنده 3/10؛ پرمیوم از جزئیات mm-scale می‌آید
8. **ریتم عددی ثابت** — گاتر 20 / گپ سکشن 24-28 / radius سیستم‌دار / targets ≥44px

---

# بخش ۳ — Design Direction واحد برای مهندس‌یار V2 Mobile

**Visual personality**
«دفتر فنیِ مهندس» — ترکیب آرامش سند آکادمیک با دقت ابزار مهندسی: جوهر تیره، خطوط نقشه‌کشی، یک سیگنال رنگی. نه fitness بازیگوش، نه education app عمومی؛ «محیط کار حرفه‌ای برای آمادگی آزمون نظام مهندسی».

**Color direction**
- پایه: خنثیِ جوهری با tint سردِ اسلیت (بازتاب کاغذ نقشه/آیین‌نامه در شب) — نه زیتونی (مال ref1) نه بنفش (مال ref3)
- Dark-first: bg #0B0E13 / surface #12161D / raised #1A2029 / hairline rgba(255,255,255,.06) — Light: paper #F6F7F9 / #FFFFFF / متن #12161D
- تک‌اکسنت سیگنال «سبز آکادمیک-فسفری» (پیوند با ابزار دقیق و نقشه فنی، متمایز از آبی generic آموزشی) + کرم فقط برای callout نمودار + مس (Copper) فقط برای «شیء پرمیوم» = کارت شمارش معکوس آزمون
- سمانتیک محفوظ: سبز=درست، قرمز=غلط، کهربایی=REVIEW_REQUIRED؛ badge رسمی=outline اکسنت، تألیفی=خنثی

**Typography direction**
- Vazirmatn تک‌خانواده؛ مقیاس: Display 28-30/800 → Title 20/700 → Section 17/600 → Body 15/400 → Caption 13/500 → Eyebrow 11/600 با letter-spacing
- عدد فارسی در همه محتوا؛ تایمر با tabular-nums؛ عددِ قهرمانِ هر کارت درشت‌ترین عنصر آن کارت
- جایگزین فارسیِ ترفند italic (ref7): کلمه تأکیدی با رنگ اکسنت + وزن سنگین‌تر

**Card philosophy**
- ۳ پله سطح + بوردر هیرلاین + hairline روشن در لبه بالایی؛ بدون سایه سنگین
- radius: hero 24 / کارت 18 / ردیف 14 / chip و دکمه کامل‌گرد
- هر کارت «یک وظیفه»: KPI، plan row، hero — anatomy ثابت با icon-chip

**Navigation philosophy**
- ۵ تب پایانی با pill اکسنتِ icon+label برای تب فعال؛ TopBar سبک هر صفحه (عنوان + یک اکشن)
- CTA چسبان در صفحات عملیاتی (runner، شروع تمرین، اکشن‌های کارنامه)؛ فیلترها و تنظیمات همیشه BottomSheet؛ بدون hamburger

**Chart philosophy**
- editorial-technical: stroke 1.5-2px، تک‌رنگ اکسنت + خنثی، یک نقطه هایلایت با callout کرم (ref3)
- بدون legend، بدون rainbow (ضد ref5)، گرید dashed هیرلاین، tooltip لمسی، اعداد فارسی
- تنوع از نوع: ring (ریدینس/کانت‌داون)، sparkline (KPI)، خط روند (تحلیل)، bar افقی (مباحث) — مقایسه = کارت جداکننده مورب (ایده ref5، اجرای خنثی)

**Illustration / graphic direction**
- صفر عکس، صفر کارتون، صفر استوک. زبان: گرید blueprint با opacity 2-4٪، کمان‌ها و orbit (اکوی ring ها)، خطوط construction نقطه‌چین، glyph اختصاصی خطی برای هر رشته (عمران=مقطع تیر، معماری=گرید پلان، برق=گره مدار، …)
- «glow» (ref7) ترجمه می‌شود به radial tint اکسنت 6-8٪ فقط پشت hero ها

**Motion language**
- ۳ لایه: micro 80-160ms (chip/fill/tint) · standard 200-320ms (sheet/nav/press) · hero 450-700ms (ring کارنامه، ورود داشبورد)
- ورود = fade + rise 8-12px با stagger 40-60ms؛ انتخاب = تعویض fill نه پرش scale؛ اعداد کارنامه count-up
- reduced-motion: همه‌چیز به fade-only

**Interaction language**
- press = روشن‌شدن سطح + scale 0.98؛ selected = fill یا tint+outline اکسنت (هرگز بی‌رنگ)؛ disabled = 40٪
- هر ردیف یک affordance پایانی؛ فیلتر با شمارش زنده در CTA («۱۲۴ سؤال — شروع تمرین»)
- REVIEW_REQUIRED شفاف: badge کهربایی + پنل منبع collapsible

**Spacing / density philosophy**
- گرید 4pt؛ گاتر 20؛ گپ سکشن 26؛ padding کارت 16-18
- density دوگانه: صفحات data (داشبورد/کارنامه) متوسطِ متراکمِ قابل‌اسکن؛ صفحات مطالعه (خوانش/رانر) کم‌تراکمِ متمرکز (الگوی ref4)
- در هر fold حداکثر ۲ عنصر primary

**Component philosophy**
- primitives آناتومی‌محور با state کامل (default/press/selected/disabled/loading/empty): icon-chip، meta-chip، stat card، plan row، option row، filter-sheet با CTA زنده، eyebrow header، section header + See All، week strip، progress ring، callout tooltip، compare card، source panel
- هر کامپوننت باید بدون کلام «معنی داده‌اش» را برساند

---

# بخش ۴ — Mapping رفرنس‌ها به ۱۱ بخش مهندس‌یار

| بخش | رفرنس منبع | ترجمه به دامنه نظام مهندسی |
|---|---|---|
| **ONBOARDING** | ref7 (hero+glow، جفت دکمه ghost/primary) + ref4 (option selected) | مرحله خوش‌آمد = hero انتزاعی تکنیکال (orbit+گرید) + تیتر دوخطی با کلمه اکسنت؛ رشته = کارت‌های والد با شمارش واقعی؛ صلاحیت multi-select = کارت‌های انتخابی با outline+tint اکسنت؛ هدف آزمون = کارت مسِ «شیء پرمیوم» با تاریخ/نوبت |
| **HOME / DASHBOARD** | ref7 (ساختار خانه) + ref3 (callout) + ref6 (KPI trio) | greeting با کلمه اکسنت → week strip مطالعه با تیک روزها → ring کانت‌داون آزمون (مس) → hero «ادامه مطالعه» با متاچیپ پیشرفت → checklist امروز (ردیف‌های Continue) → ریدینس ring + روند ۷روزه با callout → پیشرفت صلاحیت‌ها |
| **STUDY** | ref4 (فوکوس فلش‌کارت، eyebrow) | Reading کم‌تراکم: eyebrow (مبحث/فصل) + measure راحت + hairline پیشرفت خوانش + فهرست بندها در BottomSheet؛ کارت «ادامه مطالعه» با متاچیپ زمان/درصد |
| **BOOKS / REGULATIONS** | ref6 (ردیف‌های لیست) + زیبایی‌شناسی سند فنی | ردیف کتاب/آیین‌نامه با glyph خطی + badge تعداد band + badge کهربایی REVIEW_REQUIRED؛ شماره‌گذاری ماده/بند به‌عنوان عنصر تایپوگرافیک امضا |
| **TOPICS** | ref6 (diazgram قابل‌انتخاب) | کارت‌های مباحث با micro-bar پیشرفت هر مبحث؛ expandable (disclosure) — انتخاب روی خودِ دیتا |
| **PRACTICE** | ref7 (chips) + ref2 (tile ها) | حالت‌های سریع به‌صورت icon-chip tile؛ chips فیلتر با fill اکسنت؛ BottomSheet فیلتر با شمارش زنده + CTA چسبان |
| **QUESTION RUNNER** | ref4 (کوئیز) | TopBar: شماره سؤال + تایمر tabular؛ option row فول‌عرض با index-chip؛ selected = tint+outline؛ reveal = سبز/قرمز + پنل منبع ارجاع collapsible؛ footer: hairline پیشرفت + «بعدی ←» |
| **EXAMS** | ref4 (کارت schedule مس) | کارت جلسات آزمون رسمی با متاچیپ نوبت/تاریخ + جستجو؛ برگه «راهنمای آزمون» قبل از شروع (تعداد/زمان/قوانین) و بعدش CTA |
| **RESULTS** | ref5 (compare مورب) + ref3 (callout) + ref1 (ring) | ring امتیاز با draw + count-up؛ سه‌گانه درست/غلط/نزده؛ کارت مقایسه با تلاش قبلی (جداکننده مورب + ستاره بهتر)؛ تحلیل مبحثی bar افقی؛ weak areas با CTA تمرین هدفمند؛ پنل شفاف REVIEW_REQUIRED |
| **ANALYTICS** | ref3 (صفحه آمار) + ref6 (KPI trio) | segmented بازه (هفته/ماه/همه) + نمودار اصلی با callout نقطه اوج؛ ردیف KPI سه‌نوعه؛ تفکیک پیشرفت per-صلاحیت |
| **SETTINGS** | ref2 (preset rows) | ردیف‌های icon-chip خنثی؛ ادیتور صلاحیت‌ها/آزمون هدف در sheet؛ موضوع کم‌نویز — زون utility، بدون شلوغی اکسنت |

---

# بخش ۵ — MAHENDESYAR V2 — VISUAL DESIGN DIRECTION (سند نهایی)

**جمله هویت:** «یک ابزار حرفه‌ایِ جوهری برای مهندسِ در حال آمادگی — ساکت، دقیق، بی‌بن‌بست.»

### ۵ اصل هویت (Signature System)
1. **Ink Surfaces** — سطوح تیره tinted + بوردر هیرلاین؛ سایه فقط برای sheet/مدال
2. **Surgical Accent** — یک سبز آکادمیک فقط برای معنا؛ کرم = callout؛ مس = شیء پرمیوم (کانت‌داون آزمون)
3. **Technical Geometry** — گرید blueprint، orbit/کمان، glyph اختصاصی رشته‌ها؛ صفر عکس/کارتون
4. **Typographic Precision** — eyebrow label، متاچیپ، شمارنده‌های mm-scale، اعداد فارسی قهرمان
5. **Zero Dead-End** — CTA چسبان با شمارش زنده، هر ردیف یک ادامه، reduced-motion محترم

### Token Spec (پیاده‌سازی‌آمیز)
- رنگ dark: `#0B0E13 / #12161D / #1A2029` + hairline `6%` — light: `#F6F7F9 / #FFFFFF / #12161D`
- accent سبز آکادمیک (تنها سیگنال) · cream `#F2E8C9` callout · copper `#C08552` مس · amber `#E5B45B` review · سبز/قرمز سمانتیک
- تایپ Vazirmatn: 30/800 · 20/700 · 17/600 · 15/400 · 13/500 · 11/600(eyebrow) — tabular-nums برای تایمر
- radius: 24/18/14/999 · motion: 120/260/550ms · ease-out-quart · stagger 45ms
- spacing: gutter 20 · section 26 · card padding 16-18 · گرید 4pt · touch ≥44px

### Chart Rules
stroke 1.5-2 · تک‌اکسنت · یک نقطه + callout کرم · بدون legend/rainbow/3D · گرید dashed 6% · tooltip لمسی · تنوع از نوع (ring/spark/line/bar)

### Do / Don't
- ✅ فوکوس با حذف · دیتا در جمله با اعداد بولد · anatomy ثابت کارت · state کامل هر کامپوننت · پنل منبع شفاف
- ❌ rainbow و گرادیان فراگیر (ref5) · عکس استوک · شیشه‌روی لایه‌لایه · legend بزرگ · الگوی education-app عمومی (streak بادکنکی/medal کارتونی)

### ۳ لحظه WOW تعریف‌شده
1. **داشبورد**: ring کانت‌داون مسِ درخشان در بالای صفحه — «چقدر مانده» در یک نگاه
2. **Runner**: reveal پاسخ — fill سبز/قرمز نرم + ارتفاع‌گرفتن پنل منبع، لمسِ «قضاوت دقیق»
3. **کارنامه**: draw ring + count-up اعداد + کارت مقایسه مورب — «رشد اندازه‌گیری‌شده»
