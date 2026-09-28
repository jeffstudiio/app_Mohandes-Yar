// MAHENDESYAR V2 — کتاب‌های تخصصی cover generation (user-provided real book list)
// Same visual family as mabhas covers: dark ink base, single-side rim light,
// subtle teal-green grade, film grain, negative space at top (text lives in HTML §14).
// Subjects are grounded in each book's real topic — nothing decorative-generic.
import ZAI from "z-ai-web-dev-sdk";
import sharp from "sharp";
import fs from "fs";
import path from "path";

const OUT_DIR = "public/special-books";
const RAW_DIR = "scripts/books-raw";
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(RAW_DIR, { recursive: true });

const FAMILY =
  "Dark cinematic editorial photograph, deep charcoal-black ink background, dramatic low-key directional rim light from one side, subtle muted teal-green color grade, desaturated moody tones, fine film grain, premium engineering technical atmosphere, shallow depth of field, minimalist composition with generous dark negative space in the upper third, high detail, photorealistic. No text, no letters, no numbers, no watermark, no people, no faces, no logo, no cartoon.";

const BOOKS = {
  1: "seismic engineering scene: structural scale model of a multi-story building frame on a vibration test platform, seismic base isolator bearings, seismograph waveform printed on paper strip, earthquake engineering laboratory",
  2: "brass scales of justice standing beside official stamped engineering documents and a classic fountain pen on a dark wooden desk, professional ethics and code of conduct atmosphere",
  3: "accessibility ramp with textured tactile paving, stainless steel handrails and a wheelchair turning area at a modern building entrance, universal design and barrier-free architecture detail",
  4: "low garden masonry courtyard wall with brick pattern, stone coping cap and landscape planting beside a paved walkway, site wall construction detail with dramatic side light",
  5: "thick technical reference handbook with colorful index tab dividers and a ribbon bookmark lying open on a dark drafting desk beside a scale ruler, quick-reference guide atmosphere",
  6: "welding torch joining two thick steel plates with bright sparks and glowing molten bead, fillet weld joint close-up on structural steel, industrial workshop darkness",
  7: "stack of bound legal code volumes with an official round seal stamp and a wooden judge gavel on a dark desk, national engineering law and executive bylaws atmosphere",
};

async function genOne(zai, m, attempt = 1) {
  const outWebp = path.join(OUT_DIR, `book-${String(m).padStart(2, "0")}.webp`);
  if (fs.existsSync(outWebp) && fs.statSync(outWebp).size > 8000) {
    console.log(`= book ${m}: exists, skip`);
    return true;
  }
  const prompt = `${BOOKS[m]}, ${FAMILY}`;
  try {
    const res = await zai.images.generations.create({ prompt, size: "864x1152" });
    const b64 = res?.data?.[0]?.base64;
    if (!b64) throw new Error("empty base64");
    const buf = Buffer.from(b64, "base64");
    fs.writeFileSync(path.join(RAW_DIR, `book-${String(m).padStart(2, "0")}.png`), buf);
    await sharp(buf)
      .resize(648, 864, { fit: "cover" })
      .modulate({ saturation: 0.82, brightness: 0.94 })
      .webp({ quality: 74 })
      .toFile(outWebp);
    const kb = Math.round(fs.statSync(outWebp).size / 1024);
    console.log(`✓ book ${m} → ${kb}KB`);
    return true;
  } catch (e) {
    console.error(`✗ book ${m} (attempt ${attempt}): ${e.message}`);
    return false;
  }
}

const targets = Object.keys(BOOKS).map(Number);
const zai = await ZAI.create();
console.log(`[books] SDK ready — ${targets.length} covers`);
let pass = 1;
while (targets.length && pass <= 3) {
  const failed = [];
  for (const m of targets) {
    const ok = await genOne(zai, m, pass);
    if (!ok) failed.push(m);
  }
  targets.splice(0, targets.length, ...failed);
  pass++;
  if (targets.length && pass <= 3) await new Promise((r) => setTimeout(r, 2500));
}
console.log(targets.length ? `FAILED: ${targets.join(",")}` : "ALL BOOK COVERS DONE");
