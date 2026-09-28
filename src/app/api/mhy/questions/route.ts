import { NextRequest, NextResponse } from "next/server";
import { queryQuestions, type QuestionFilter } from "@/lib/mhy/server";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const f: QuestionFilter = {
    major: sp.get("major") ?? undefined,
    mabhas: sp.get("mabhas") ? Number(sp.get("mabhas")) : undefined,
    sourceType: (sp.get("sourceType") as QuestionFilter["sourceType"]) ?? undefined,
    session: sp.get("session") ?? undefined,
    difficulty: sp.get("difficulty") ? (sp.get("difficulty")!.split(",") as QuestionFilter["difficulty"]) : undefined,
    ids: sp.get("ids") ? sp.get("ids")!.split(",").map(Number) : undefined,
    limit: sp.get("limit") ? Number(sp.get("limit")) : 20,
    offset: sp.get("offset") ? Number(sp.get("offset")) : 0,
  };
  return NextResponse.json(queryQuestions(f));
}
