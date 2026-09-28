"use client";

import { useMemo, useState } from "react";
import { faNum } from "@/lib/mhy/engines";
import { Eyebrow } from "./ui";
import { ExternalLink, LibraryBig } from "lucide-react";
import shopData from "../../../db/shop.json";

type ShopProduct = { title: string; url: string; img: string | null };
type ShopNeed = { code: string; title: string; products: ShopProduct[] };
type ShopGroup = { code: string; title: string; needs: ShopNeed[] };

const SHOP = shopData as { groups: ShopGroup[] };

/* فروشگاه — placeholder modeling of bonyadsite.com per user request (v-next: real backend).
   Category = رشته (عمران/معماری/برق/…) × نیاز (طراحی/اجرا/نظارت/محاسبات/…) —
   each product card links to the reference publisher page. */

export default function Shop() {
  const [group, setGroup] = useState<string>("all");
  const [need, setNeed] = useState<string>("all");

  const groups = SHOP.groups;

  const needOptions = useMemo(() => {
    const src = group === "all" ? groups.flatMap((g) => g.needs) : groups.find((g) => g.code === group)?.needs ?? [];
    const seen = new Map<string, string>();
    for (const n of src) if (!seen.has(n.code)) seen.set(n.code, n.title);
    return [...seen.entries()].map(([code, title]) => ({ code, title }));
  }, [group, groups]);

  const products = useMemo(() => {
    const gs = group === "all" ? groups : groups.filter((g) => g.code === group);
    return gs
      .flatMap((g) => (need === "all" ? g.needs : g.needs.filter((n) => n.code === need)).map((n) => ({ g, n })))
      .flatMap(({ g, n }) => n.products.map((p) => ({ ...p, group: g.title, need: n.title })));
  }, [group, need, groups]);

  return (
    <div className="phone-scroll flex-1 overflow-y-auto pb-8 screen-in">
      {/* masthead */}
      <header
        className="blueprint-grid relative px-5 pb-4 pt-5"
        style={{ maskImage: "linear-gradient(180deg, black 62%, transparent 100%)", WebkitMaskImage: "linear-gradient(180deg, black 62%, transparent 100%)" }}
      >
        <Eyebrow tone="accent">فروشگاه</Eyebrow>
        <h1 className="t-title mt-1" style={{ color: "var(--foreground)" }}>
          کتاب و منابع آزمون
        </h1>
        <p className="t-caption mt-0.5 leading-5" style={{ color: "var(--muted-foreground)" }}>
          کتاب‌ها و پکیج‌های آمادگی آزمون نظام مهندسی — دسته‌بندی بر اساس رشته و نوع نیاز.
        </p>
      </header>

      {/* رشته chips */}
      <div className="rail-scroll no-scrollbar px-5 !gap-1.5" role="group" aria-label="دسته‌بندی رشته">
        {[{ code: "all", title: "همه رشته‌ها" }, ...groups.map((g) => ({ code: g.code, title: g.title }))].map((g) => {
          const active = group === g.code;
          return (
            <button
              key={g.code}
              onClick={() => {
                setGroup(g.code);
                setNeed("all");
              }}
              aria-pressed={active}
              className="press shrink-0 rounded-full border px-3.5 py-1.5 text-[11.5px] font-bold"
              style={
                active
                  ? { borderColor: "var(--primary)", background: "var(--primary-soft)", color: "var(--primary)" }
                  : { borderColor: "var(--border)", background: "var(--card)", color: "var(--muted-foreground)" }
              }
            >
              {g.title}
            </button>
          );
        })}
      </div>

      {/* نیاز chips */}
      {needOptions.length > 1 && (
        <div className="rail-scroll no-scrollbar mt-2 px-5 !gap-1.5" role="group" aria-label="دسته‌بندی نوع نیاز">
          {[{ code: "all", title: "همه نیازها" }, ...needOptions].map((n) => {
            const active = need === n.code;
            return (
              <button
                key={n.code}
                onClick={() => setNeed(n.code)}
                aria-pressed={active}
                className="press shrink-0 rounded-full px-3 py-1 text-[11px] font-bold"
                style={
                  active
                    ? { background: "var(--primary)", color: "var(--primary-foreground)" }
                    : { background: "var(--muted)", color: "var(--muted-foreground)" }
                }
              >
                {n.title}
              </button>
            );
          })}
        </div>
      )}

      {/* count line */}
      <div className="mt-4 flex items-center justify-between px-5">
        <p className="num t-caption" style={{ color: "var(--muted-foreground)" }}>
          {faNum(products.length)} عنوان
        </p>
        <p className="t-meta" style={{ color: "var(--muted-foreground)" }}>
          الگوی اولیه: انتشارات بنیاد
        </p>
      </div>

      {/* product grid */}
      <section className="mt-2 px-4" aria-label="فهرست کتاب‌های فروشگاه">
        <div className="grid grid-cols-2 gap-3">
          {products.map((p, i) => (
            <ShopCard key={`${p.url}-${i}`} p={p} />
          ))}
        </div>
        {products.length === 0 && (
          <p className="py-10 text-center t-body-sm" style={{ color: "var(--muted-foreground)" }}>
            محصولی در این دسته ثبت نشده است.
          </p>
        )}
      </section>

      {/* footer — source trust line */}
      <div className="construction mt-6" />
      <p className="t-meta mt-3 px-6 text-center leading-5" style={{ color: "var(--muted-foreground)" }}>
        فهرست اولیه با الگوی انتشارات بنیاد مهندسی ساختمان (bonyadsite.com) — قیمت و موجودی در سایت مرجع؛ این بخش در نسخه‌های بعد کامل می‌شود.
      </p>
    </div>
  );
}

function ShopCard({ p }: { p: { title: string; url: string; img: string | null; group: string; need: string } }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <a
      href={p.url}
      target="_blank"
      rel="noopener noreferrer"
      className="press flex flex-col overflow-hidden rounded-2xl border"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
      aria-label={`${p.title} — مشاهده در فروشگاه بنیاد`}
    >
      <span className="relative flex h-32 w-full items-center justify-center" style={{ background: "#f2f4f3" }}>
        {p.img && imgOk ? (
          <img
            src={p.img}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImgOk(false)}
            className="h-full w-full object-contain p-2"
          />
        ) : (
          <LibraryBig size={30} style={{ color: "var(--muted-foreground)" }} />
        )}
        <span
          className="absolute right-1.5 top-1.5 rounded-full px-2 py-0.5 text-[8.5px] font-extrabold"
          style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
        >
          {p.need}
        </span>
      </span>
      <span className="flex min-h-[74px] flex-1 flex-col justify-between gap-1.5 p-2.5">
        <span className="line-clamp-2 text-[11px] font-bold leading-5" style={{ color: "var(--foreground)" }}>
          {p.title}
        </span>
        <span className="flex items-center justify-between">
          <span className="t-meta" style={{ color: "var(--muted-foreground)" }}>
            {p.group}
          </span>
          <span className="flex items-center gap-0.5 text-[9.5px] font-extrabold" style={{ color: "var(--primary)" }}>
            مشاهده
            <ExternalLink size={11} />
          </span>
        </span>
      </span>
    </a>
  );
}
