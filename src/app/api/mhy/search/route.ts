import { NextRequest, NextResponse } from "next/server";
import { globalSearch } from "@/lib/mhy/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  return NextResponse.json({ hits: globalSearch(q) });
}
