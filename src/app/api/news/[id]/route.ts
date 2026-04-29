import { NextResponse } from "next/server";

import { deleteNewsItem, saveNewsItem } from "@/lib/data/news";
import type { NewsItem } from "@/types/news";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const payload = (await request.json()) as NewsItem;
    const item = await saveNewsItem({ ...payload, id });
    return NextResponse.json(item);
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新新闻时发生未知错误。";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    await deleteNewsItem(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除新闻时发生未知错误。";
    return NextResponse.json({ message }, { status: 500 });
  }
}
