// ─── Sample data for Mohandesyar redesign preview ───
// Content is faithful to the real app (v1.0.0 APK analysis):
// 2191 offline questions, 5 tabs, 3 quiz modes, daily-goal & token system.

export type QuizMode = "standard" | "problem" | "story";

export type Subject = {
  id: string;
  name: string;
  questions: number;
  seen: number;
  mastery: number; // 0..100
  icon: string;
};

export type Question = {
  id: number;
  subject: string;
  mode: QuizMode;
  text: string;
  options: string[];
  answer: number;
  explanation: string;
};

export const fa = (x: number | string): string =>
  String(x).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);

export const QUIZ_MODE_LABEL: Record<QuizMode, string> = {
  standard: "استاندارد",
  problem: "مسئله‌محور",
  story: "داستان‌محور",
};

export const SUBJECTS: Subject[] = [
  { id: "resistance", name: "مقاومت مصالح", questions: 312, seen: 244, mastery: 78, icon: "ruler" },
  { id: "concrete", name: "بتن آرمه", questions: 405, seen: 182, mastery: 45, icon: "layers" },
  { id: "steel", name: "سازه‌های فولادی", questions: 288, seen: 92, mastery: 32, icon: "frame" },
  { id: "soil", name: "مکانیک خاک و پی", questions: 231, seen: 141, mastery: 61, icon: "mountain" },
  { id: "hydraulic", name: "هیدرولیک و آب", questions: 197, seen: 118, mastery: 60, icon: "droplets" },
  { id: "surveying", name: "نقشه‌برداری", questions: 164, seen: 70, mastery: 43, icon: "compass" },
  { id: "contracts", name: "تنظیم قراردادها", questions: 152, seen: 0, mastery: 0, icon: "fileText" },
  { id: "projects", name: "پروژه‌های عمرانی", questions: 442, seen: 0, mastery: 0, icon: "hardHat" },
];

export const QUESTIONS: Question[] = [
  {
    id: 1,
    subject: "مقاومت مصالح",
    mode: "standard",
    text: "در یک تیر تحت خمش خالص، تنش حداکثر برشی در کدام نقطه مقطع مستطیلی رخ می‌دهد؟",
    options: [
      "در الیاف فوقانی",
      "در الیاف تحتانی",
      "در محور خنثی",
      "در گوشه‌های مقطع",
    ],
    answer: 2,
    explanation:
      "توزیع تنش برشی در مقطع مستطیلی سهمی‌شکل است و در محور خنثی به بیشینه می‌رسد؛ برخلاف تنش خمشی که در الیاف دورترین نقاط بیشینه است.",
  },
  {
    id: 2,
    subject: "بتن آرمه",
    mode: "problem",
    text: "تیر بتن‌آرمه‌ای با مقطع ۳۰×۵۰ سانتی‌متر و بتن C25 داریم. مقاومت مشخصه فشاری بتن تقریباً چند کیلوگرم بر سانتی‌متر مربع است؟",
    options: ["۲۵", "۱۵۰", "۲۵۰", "۴۰۰"],
    answer: 2,
    explanation:
      "طبق نشریه ۱۲۰ و آبا، مقاومت مشخصه C25 معادل ۲۵۰ کیلوگرم بر سانتی‌متر مربع است (هر کلاس بتن تقریباً برابر با یک‌دهم همان عدد بر حسب MPa).",
  },
  {
    id: 3,
    subject: "مکانیک خاک و پی",
    mode: "standard",
    text: "کدام آزمون برای تعیین ضریب تراکم درجا (سنجش تراکم خاک بستر) استفاده می‌شود؟",
    options: [
      "آزمون پروکتور استاندارد",
      "آزمون مخروط نفوذ دینامیکی",
      "آزمون برش مستقیم",
      "آزمون تعیین حد روان",
    ],
    answer: 1,
    explanation:
      "آزمون‌های نفوذی مانند DCP یا CPT برای سنجش تراکم و ظرفیت باربری درجا به کار می‌روند؛ پروکتور آزمایش آزمایشگاهی تعیین رطوبت بهینه و چگالی خشک بیشینه است.",
  },
  {
    id: 4,
    subject: "سازه‌های فولادی",
    mode: "problem",
    text: "در اتصال پیچی، اگر قطر پیچ M20 با رده ۸.۸ باشد، مقاومت کششی مشخصه پیچ حدود چند کیلو نیوتن است؟",
    options: ["۸۰", "۱۲۶", "۲۰۴", "۳۳۰"],
    answer: 1,
    explanation:
      "رده ۸.۸ یعنی مقاومت کششی نهایی ۸۰۰ MPa. سطح مقطع مؤثر M20 حدود ۲۴۵ میلی‌متر مربع است؛ حاصل‌ضرب این دو حدود ۱۹۶ کیلو نیوتن و پس از اعمال ضریب سطح مؤثر، نزدیک به ۱۲۶ کیلو نیوتن برای مقاومت مشخصه در نظر گرفته می‌شود.",
  },
  {
    id: 5,
    subject: "پروژه‌های عمرانی",
    mode: "story",
    text: "سردکارگاهی متوجه می‌شود عملیات بتن‌ریزی فونداسیون با تأخیر ۴۵ دقیقه‌ای نسبت به برنامه P6 در حال انجام است. طبق مبحث مدیریت و کنترل پروژه، اولین اقدام صحیح چیست؟",
    options: [
      "توقف کامل کار تا اصلاح برنامه",
      "ثبت تأخیر در گزارش روزانه و تحلیل مسیر بحرانی",
      "افزایش نفرات بدون ثبت گزارش",
      "تغییر تاریخ تحویل پروژه",
    ],
    answer: 1,
    explanation:
      "قدم نخست کنترل پروژه، مستندسازی انحراف در گزارش‌های روزانه است؛ سپس با تحلیل مسیر بحرانی مشخص می‌شود تأخیر بر تاریخ تحویل اثر دارد یا خیر.",
  },
  {
    id: 6,
    subject: "هیدرولیک و آب",
    mode: "standard",
    text: "عدد فرود (Froude) کمتر از یک در جریان روبانه نشان‌دهنده کدام حالت جریان است؟",
    options: ["جریان تندآب", "جریان آرام", "جریان بحرانی", "جریان چرخشی"],
    answer: 1,
    explanation:
      "وقتی عدد فرود کوچک‌تر از یک باشد عمق آب بیشتر از عمق بحرانی است و جریان «آرام» نام دارد؛ بزرگ‌تر از یک تندآب و برابر یک بحرانی است.",
  },
];

export const WEEK_DAYS = [
  { day: "شنبه", count: 18, acc: 82 },
  { day: "یکشنبه", count: 24, acc: 76 },
  { day: "دوشنبه", count: 12, acc: 68 },
  { day: "سه‌شنبه", count: 30, acc: 88 },
  { day: "چهارشنبه", count: 22, acc: 79 },
  { day: "پنجشنبه", count: 26, acc: 84 },
  { day: "جمعه", count: 0, acc: 0 },
];

export const ACCURACY_TREND = [
  { week: "هفته ۱", value: 58 },
  { week: "هفته ۲", value: 63 },
  { week: "هفته ۳", value: 61 },
  { week: "هفته ۴", value: 71 },
  { week: "هفته ۵", value: 68 },
  { week: "هفته ۶", value: 76 },
  { week: "هفته ۷", value: 81 },
];

export const BADGES = [
  { id: "streak", label: "زنجیره ۱۲ روزه", emoji: "🔥", earned: true },
  { id: "first100", label: "۱۰۰ سوال اول", emoji: "💯", earned: true },
  { id: "night", label: "بول شبانه", emoji: "🌙", earned: true },
  { id: "master", label: "تسلط یک مبحث", emoji: "🏅", earned: true },
  { id: "exam", label: "قبولی آزمون", emoji: "🎓", earned: false },
  { id: "allq", label: "همه ۲۱۹۱ سوال", emoji: "📚", earned: false },
];

export const TOTAL_QUESTIONS = 2191;
