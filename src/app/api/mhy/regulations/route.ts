import { NextRequest, NextResponse } from "next/server";
import { getRegulationMabhas } from "@/lib/mhy/server";

export async function GET(req: NextRequest) {
  const mabhas = Number(req.nextUrl.searchParams.get("mabhas"));
  if (!mabhas) return NextResponse.json({ error: "mabhas required" }, { status: 400 });
  const r = getRegulationMabhas(mabhas);
  if (!r) return NextResponse.json({ error: "no regulation text for this mabhas" }, { status: 404 });
  return NextResponse.json(r);
}
