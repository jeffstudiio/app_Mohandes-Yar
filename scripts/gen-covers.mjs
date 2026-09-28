// MAHENDESYAR V2 — Mabhas cover generation (directive §10–§14/§51–§52)
// One visual per REAL mabhas (1–23). Subjects grounded in the project's real data:
//   - question topics (db/content.json, 2191q) — e.g. 8=بنایی، 9=بتن، 10=فولاد، 12=ایمنی کارگاه، 23=نقشه‌برداری
//   - regulation band content (db/regulations.json) — e.g. 12=رختکن/ایمنی، 15=آسانسور، 19=انرژی
//   - lesson titles (db/content.json lessons)
// One shared visual family: dark ink base, single-side rim light, subtle green-teal grade,
// film grain, negative space at top (UI places number/title in HTML, NOT inside image §14).
import ZAI from "z-ai-web-dev-sdk";
import sharp from "sharp";
import fs from "fs";
import path from "path";

const OUT_DIR = "public/mabhas-covers";
const RAW_DIR = "scripts/covers-raw";
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(RAW_DIR, { recursive: true });

const FAMILY =
  "Dark cinematic editorial photograph, deep charcoal-black ink background, dramatic low-key directional rim light from one side, subtle muted teal-green color grade, desaturated moody tones, fine film grain, premium engineering technical atmosphere, shallow depth of field, minimalist composition with generous dark negative space in the upper third, high detail, photorealistic. No text, no letters, no numbers, no watermark, no people, no faces, no logo, no cartoon.";

const SUBJECTS = {
  1: "rolled architectural blueprint drawings and a brass drafting compass on a dark technical desk",
  2: "stack of official stamped technical permit documents and a heavy desk stamp on dark wood, administrative paperwork with ribbon seal",
  3: "fire protection sprinkler head and flame-resistant steel door detail, faint warm ember glow against dark metal",
  4: "architectural cross-section drawing of a multi-story building, technical section lines on dark drafting paper",
  5: "arranged construction material samples: concrete cube, clay brick, steel profile, wood block and cement bag on dark surface",
  6: "steel truss structure with diagonal members under dramatic light, structural load engineering detail",
  7: "foundation excavation with rebar cage and concrete footing formwork at a dark construction site",
  8: "masonry brick wall pattern with mortar joints, partially built clay brick wall with dramatic side light",
  9: "reinforced concrete column with exposed rebar grid and fresh concrete surface, formwork detail",
  10: "steel I-beam columns and beams of a structural frame, bolted steel connections, welding sparks faint in background",
  11: "prefabricated modular concrete building units being assembled by a tower crane at dusk",
  12: "yellow safety helmet and safety harness on scaffolding pipes at a construction site, industrial safety gear",
  13: "electrical distribution panel with organized cables, circuit breakers and conduit pipes on dark wall",
  14: "industrial HVAC ductwork and mechanical pipes with valves along a dark ceiling",
  15: "elevator machine room with steel traction cables and pulley sheaves, elevator shaft doors",
  16: "sanitary plumbing pipes and drainage fittings, copper and PVC pipe assembly detail on dark background",
  17: "building facade thermal insulation layers and energy efficient glazing reflecting dusk sky",
  18: "acoustic sound insulation foam panels and mineral wool layer inside a wall section, texture detail",
  19: "solar photovoltaic panels on a rooftop at dusk with building energy meter, sustainable energy systems",
  20: "illuminated emergency exit sign and fire extinguisher mounted on dark concrete wall, fire alarm detail",
  21: "aerial night view of a dense city district grid with streets and blocks like an urban masterplan",
  22: "construction supervision desk at a building site: technical drawings, clipboard checklist and total station instrument",
  23: "precision theodolite surveying instrument on tripod against dark dusk sky with coordinate grid feel",
};

async function genOne(zai, m, attempt = 1) {
  const outWebp = path.join(OUT_DIR, `mabhas-${String(m).padStart(2, "0")}.webp`);
  if (fs.existsSync(outWebp) && fs.statSync(outWebp).size > 8000) {
    console.log(`= mabhas ${m}: exists, skip`);
    return true;
  }
  const prompt = `${SUBJECTS[m]}, ${FAMILY}`;
  try {
    const res = await zai.images.generations.create({ prompt, size: "864x1152" });
    const b64 = res?.data?.[0]?.base64;
    if (!b64) throw new Error("empty base64");
    const buf = Buffer.from(b64, "base64");
    fs.writeFileSync(path.join(RAW_DIR, `mabhas-${String(m).padStart(2, "0")}.png`), buf);
    // family treatment: slight extra darkening + desaturation for tonal unity (§13/§52)
    await sharp(buf)
      .resize(648, 864, { fit: "cover" })
      .modulate({ saturation: 0.82, brightness: 0.94 })
      .webp({ quality: 74 })
      .toFile(outWebp);
    const kb = Math.round(fs.statSync(outWebp).size / 1024);
    console.log(`✓ mabhas ${m} → ${kb}KB`);
    return true;
  } catch (e) {
    console.error(`✗ mabhas ${m} (attempt ${attempt}): ${e.message}`);
    return false;
  }
}

const targets = Object.keys(SUBJECTS).map(Number);
const zai = await ZAI.create();
console.log(`[covers] SDK ready — ${targets.length} covers, family prompt ${FAMILY.length} chars`);
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
console.log(targets.length ? `FAILED: ${targets.join(",")}` : "ALL COVERS DONE");
