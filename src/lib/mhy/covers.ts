// ─── Mabhas cover system (directive §9–§14/§51–§52) ───
// One real visual asset per real مبحث مقررات ملی ساختمان (1–23), generated from the
// project's actual data subjects (question topics / regulation bands / lessons).
// Titles themselves come from store.ts (mabhasTitle) — this module only maps the asset.

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const MABHAS_COVER_COUNT = 23;

/** asset path for a mabhas cover (null → graceful fallback by the caller) */
export function mabhasCoverSrc(m: number | null | undefined): string | null {
  if (m == null || !Number.isFinite(m) || m < 1 || m > MABHAS_COVER_COUNT) return null;
  return `${BASE}/mabhas-covers/mabhas-${String(m).padStart(2, "0")}.webp`;
}
