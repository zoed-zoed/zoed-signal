import { NextResponse } from "next/server";

import { deleteNewsItem, saveNewsItem } from "@/lib/data/news";
import type { NewsItem } from "@/types/news";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const payload = (await request.json()) as NewsItem;
  const item = await saveNewsItem({ ...payload, id });
  return NextResponse.json(item);
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  await deleteNewsItem(id);
  return NextResponse.json({ ok: true });
}
