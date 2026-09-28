import { NextRequest, NextResponse } from "next/server";
import { getLesson } from "@/lib/mhy/server";

export async function GET(req: NextRequest) {
  const mabhas = Number(req.nextUrl.searchParams.get("mabhas"));
  if (!mabhas) return NextResponse.json({ error: "mabhas required" }, { status: 400 });
  return NextResponse.json({ lesson: getLesson(mabhas) });
}
