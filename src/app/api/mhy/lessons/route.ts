import { NextResponse } from "next/server";
import { getLessons } from "@/lib/mhy/server";

export async function GET() {
  return NextResponse.json({ lessons: getLessons() });
}
