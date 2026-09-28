# تحلیل پک مرجع طراحی (۷ تصویر) — ورودی Premium UI Pass

مکان فایل‌ها: `design-refs/ref1..ref7` (ref5 از AVIF به PNG تبدیل شد)

## شناسنامه تصاویر

| # | دامنه | تم | اکسنت | نقش در مرجع |
|---|-------|----|-------|--------------|
| ref1, ref2 | Habit Tracker | مشکی-زیتونی | Chartreuse/Lime | Nav pill، تقویم/هفته، chip ها، stat cards، hero card |
| ref3 | Fitness + آمار | بادمجانی تیره | Cream/Pink | نمودار خطی با tooltip callout، segmented Day/Week/Month، onboarding فول‌عکس |
| ref4 | زبان‌آموزی | زغالی-سرمه‌ای | Copper + Green + Amber | نزدیک‌ترین به «محصول مطالعه»: flashcard، scheduled card، quiz runner |
| ref5 | Analytics kit (Freepik) | بنفش/صورتی | Rainbow | فقط «ایده» نمودار؛ اجرای بصری ضدالگو |
| ref6 | Habit/Fitness | مشکی-سبز | Lime | ردیف KPI سه‌تایی، Today Plan با badge، body-select |
| ref7 | Fitness | سبز-مشکی + glow | Lime vivid | هفته‌نما با تیک، fitness-level 24/60، CTA چسبان، متاچیپ‌ها |

## DNA مشترک (رسپی Premium Mobile)

1. **Dark-first tinted**: مشکی خالص ممنوع؛ پس‌زمینه tinted (زیتونی/بنفش/سبز)، کارت یک پله روشن‌تر + بوردر کم‌کنتراست
2. **یک اکسنت زنده، مصرف جراحی‌وار**: فقط active/selected/CTA/progress — بقیه grayscale
3. **زبان Pill/Chip**: فیلترها، روزهای هفته، segmented، badge ها همه pill
4. **Bottom nav pill شناور**: آیتم فعال = pill اکسنت با icon+label (+ گاهی FAB مرکزی)
5. **Stat card سه‌لایه**: icon-chip + label کوچک + عدد درشت (+ progress/delta)
6. **تنوع visualize پیشرفت**: ring، bar، micro-bars، week-strip با تیک
7. **Section header**: عنوان بولد + لینک «See All» راست؛ گاهی eyebrow label (CHAPTER CHECKPOINT)
8. **Hero card تصویری** + overlay chip + arrow FAB
9. **نمودار مینیمال**: خط نازک، تک‌نقطه هایلایت + tooltip callout، بدون legend بزرگ
10. **CTA چسبان پایین اسکرین‌های عملیاتی** (Start Workout / شروع تمرین)
11. **تایپوگرافی دو-بخشی**: ترکیب weight/italic در greeting و تیترها
12. **متاچیپ روی کارت‌ها**: مدت/سطح/تعداد (32 min، Intermediate)

## ضدالگوها (در ref5 و بخش‌هایی از بقیه)

- نمودار rainbow و gradient چندرنگ + legend نقطه‌ای بزرگ ← صریحاً ممنوع در دستورالعمل پروژه
- glow نئونی فراگیر و شیشه‌روی لایه‌لایه ← فقط به‌صورت radial tint خیلی ملایم قابل قبول
- عکس استوک آدم‌ها ← برای مهندس‌یار: گرافیک تکنیکال انتزاعی

## مپ به مهندس‌یار (وضعیت فعلی پس از Task 7)

| اسکرین ما | مرجع | وضعیت | ایده ارتقا (Reference Pass) |
|-----------|------|--------|------------------------------|
| Dashboard | ref7 (week-strip + level card)، ref6 (KPI trio) | countdown ring + today + readiness موجود | week-strip مطالعه با تیک روزهای انجام‌شده؛ ردیف KPI سه‌تایی (ریدینس/پاسخ‌ها/دقت) |
| Study/Reader | ref4 (flashcard، eyebrow) | reading UI + فهرست بندها | eyebrow label بن‌مایه تکنیکال؛ کارت «ادامه مطالعه» با progress متاچیپ |
| Practice | ref7 (filter chips، sticky CTA) | BottomSheet با شمارش زنده + CTA | همسو است؛ chip های فیلتر روی صفحه با حالت active اکسنت |
| Exam/Runner | ref4 (quiz: options با آیکون، selected=amber، progress+counter) | runner لمسی + reveal | الگوی ردیف گزینه با آیکون lead و حالت selected پررنگ‌تر؛ شماره «۳/۱۰» سرصفحه |
| Result | ref5 (compare 3.7↔4.6)، ref3 (chart callout) | ring + delta + تحلیل مبحثی | callout روی نقطه اوج نمودار روند؛ مقایسه دو-کارت با جداکننده مورب |
| Onboarding | ref3/ref7 (فول‌تصویر + CTA) | ۶ مرحله با کارت‌های شمارش واقعی | hero انتزاعی تکنیکال مرحله خوش‌آمد؛ دکمه ثانویه ghost + اصلی اکسنت |
| Settings/States | ref2 (preset rows) | ادیتور صلاحیت/آزمون | ردیف‌های preset با icon-chip + trailing arrow |

## حکم نهایی

- نزدیک‌ترین مرجع به هدف «PREMIUM ACADEMIC PRODUCTIVITY»: **ref4** (محصول مطالعه واقعی) + **ref3** (دیتا/فینتک) + سیستم اکسنت و nav از **ref1/ref7**
- ref5 فقط به‌عنوان منبع «ایده نمودار» (ring، compare، stepper) — اجرای رنگی آن ممنوع
- جهت پالت پیشنهادی حفظ هویت فعلی: dark tinted neutral + یک اکسنت (سبز-آکادمیک) + اکسنت ثانویه کِرِم برای callout ها
