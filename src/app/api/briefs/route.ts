import { NextResponse } from "next/server";

import { getBriefById, getBriefs, saveBrief } from "@/lib/data/briefs";
import type { Brief } from "@/types/brief";

export async function GET() {
  const briefs = await getBriefs();
  return NextResponse.json(briefs);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Brief;

  if (!payload.id || !payload.title || !payload.date || !payload.intro) {
    return NextResponse.json({ message: "简报期数、标题、日期和简介不能为空。" }, { status: 400 });
  }

  const existing = await getBriefById(payload.id);
  if (existing) {
    return NextResponse.json({ message: "这期简报已经存在了，请换一个新的期数。" }, { status: 409 });
  }

  const brief = await saveBrief(payload);
  return NextResponse.json(brief);
}
