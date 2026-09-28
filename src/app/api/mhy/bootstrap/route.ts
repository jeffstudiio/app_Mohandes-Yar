import { NextResponse } from "next/server";
import { getBootstrap } from "@/lib/mhy/server";

export async function GET() {
  return NextResponse.json(getBootstrap());
}
