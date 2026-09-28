import { NextRequest, NextResponse } from "next/server";
import { getQuestion, relatedQuestions } from "@/lib/mhy/server";

export async function GET(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const q = getQuestion(id);
  if (!q) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ question: q, related: relatedQuestions(id).map((r) => ({ id: r.id, text: r.text.slice(0, 80), sourceType: r.sourceType, examSession: r.examSession, topic: r.topic, mabhas: r.mabhas })) });
}
