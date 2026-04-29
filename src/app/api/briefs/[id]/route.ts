import { NextResponse } from "next/server";

import { deleteBrief, getBriefById, saveBrief } from "@/lib/data/briefs";
import { getNewsForBrief } from "@/lib/data/news";
import type { Brief } from "@/types/brief";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const payload = (await request.json()) as Brief;

  const existing = await getBriefById(id);
  if (!existing) {
    return NextResponse.json({ message: "没有找到这期简报。" }, { status: 404 });
  }

  const brief = await saveBrief({
    ...existing,
    ...payload,
    id,
    title: existing.title,
    newsItemIds: existing.newsItemIds,
  });

  return NextResponse.json(brief);
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  const existing = await getBriefById(id);

  if (!existing) {
    return NextResponse.json({ message: "没有找到这期简报。" }, { status: 404 });
  }

  const linkedNews = await getNewsForBrief(id);
  if (linkedNews.length > 0) {
    return NextResponse.json(
      { message: `这期简报下还有 ${linkedNews.length} 条新闻，先处理新闻归档再删除。` },
      { status: 409 },
    );
  }

  await deleteBrief(id);
  return NextResponse.json({ ok: true });
}
