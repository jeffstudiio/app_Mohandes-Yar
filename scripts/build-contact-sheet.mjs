// Contact sheet of all 23 mabhas covers — rendered via browser for perfect Persian shaping
import fs from "fs";

const TITLES = {
  1: "تعاریف", 2: "نظامات اداری", 3: "حفاظت ساختمان‌ها در مقابل حریق", 4: "الزامات عمومی ساختمان",
  5: "مصالح و فرآورده‌های ساختمانی", 6: "بارهای وارد بر ساختمان‌ها", 7: "ژئوتکنیک و مهندسی پی",
  8: "طرح و اجرای ساختمان‌های با مصالح بنایی", 9: "طرح و اجرای ساختمان‌های بتن آرمه",
  10: "طرح و اجرای ساختمان‌های فولادی", 11: "طرح و اجرای صنعتی ساختمان‌ها",
  12: "ایمنی، بهداشت کار و محیط زیست در حین اجرا", 13: "تاسیسات برقی ساختمان‌ها",
  14: "تاسیسات مکانیکی ساختمان‌ها", 15: "آسانسورها و پلکان برقی", 16: "تأسیسات بهداشتی",
  17: "سامانه گاز طبیعی در ساختمان", 18: "عایق‌بندی و تنظیم صدا", 19: "مدیریت انرژی در ساختمان‌ها",
  20: "علائم و تابلوها", 21: "پدافند غیرعامل", 22: "مراقبت و نگهداری از ساختمان‌ها",
  23: "مقررات ترافیکی ساختمان‌ها",
};
const ED = { 1:1392,2:1384,3:1395,4:1396,5:1396,6:1398,7:1400,8:1398,9:1399,10:1401,11:1400,12:1403,13:1395,14:1396,15:1392,16:1396,17:1403,18:1396,19:1404,20:1396,21:1395,22:1392,23:1401 };
const fa = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);

const FONT = "/home/z/my-project/public/fonts/Vazirmatn-Bold.ttf";
const FONT_MED = "/home/z/my-project/public/fonts/Vazirmatn-Medium.ttf";
const fonts = fs.readdirSync("/home/z/my-project/public/fonts").join(", ");
if (!fs.existsSync(FONT)) console.log("[fonts] available:", fonts);

const cells = Object.keys(TITLES).map((m) => {
  const n = Number(m);
  return `
  <div class="cell">
    <div class="cover"><img src="file:///home/z/my-project/public/mabhas-covers/mabhas-${String(n).padStart(2,"0")}.webp" alt="">
      <span class="num">مبحث <b>${fa(n)}</b></span>
    </div>
    <p class="title">${TITLES[n]}</p>
    <p class="ed">ویرایش ${fa(ED[n])}</p>
  </div>`;
}).join("\n");

const html = `<!DOCTYPE html><html dir="rtl" lang="fa"><head><meta charset="utf-8">
<style>
  @font-face { font-family: Vazirmatn; src: url("file://${FONT}") format("truetype"); font-weight: 700; }
  @font-face { font-family: Vazirmatn; src: url("file://${FONT_MED}") format("truetype"); font-weight: 500; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0B0E13; font-family: Vazirmatn, sans-serif; padding:34px 30px 40px; }
  h1 { color:#f2f5f4; font-size:24px; font-weight:700; text-align:center; }
  .sub { color:rgba(255,255,255,.45); font-size:12.5px; text-align:center; margin-top:6px; margin-bottom:28px; }
  .grid { display:grid; grid-template-columns:repeat(4, 1fr); gap:18px 16px; }
  .cell { display:flex; flex-direction:column; align-items:center; gap:7px; }
  .cover { position:relative; width:100%; aspect-ratio:3/4; border-radius:14px; overflow:hidden;
           box-shadow:0 8px 26px rgba(0,0,0,.5); outline:1px solid rgba(255,255,255,.08); }
  .cover img { width:100%; height:100%; object-fit:cover; display:block; }
  .num { position:absolute; top:10px; right:12px; color:rgba(255,255,255,.92); font-size:12px; font-weight:500;
         text-shadow:0 1px 6px rgba(0,0,0,.8); }
  .num b { font-size:17px; font-weight:700; margin-right:3px; }
  .title { color:#f2f5f4; font-size:12.5px; font-weight:700; text-align:center; line-height:1.55; min-height:38px;
           display:flex; align-items:center; }
  .ed { color:#7ce3a4; font-size:10.5px; font-weight:500; letter-spacing:.04em; }
</style></head><body>
  <h1>سیستم کاور مباحث مقررات ملی ساختمان</h1>
  <p class="sub">مهندس‌یار V2 — ۲۳ کاور اختصاصی، هر تصویر هم‌معنا با موضوع مبحث خودش</p>
  <div class="grid">${cells}</div>
</body></html>`;

fs.writeFileSync("/home/z/my-project/scripts/contact-sheet.html", html);
console.log("contact-sheet.html written");
