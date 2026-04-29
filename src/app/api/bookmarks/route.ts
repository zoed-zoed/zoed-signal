import { NextResponse } from "next/server";

import { addBookmark, getBookmarks } from "@/lib/data/bookmarks";
import type { SavedType } from "@/types/news";

export async function GET() {
  try {
    const items = await getBookmarks();
    return NextResponse.json(items);
  } catch (error) {
    const message = error instanceof Error ? error.message : "读取收藏时发生未知错误。";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { newsId: string; bucket: SavedType };

    if (!payload.newsId || !payload.bucket) {
      return NextResponse.json({ message: "newsId 和 bucket 不能为空。" }, { status: 400 });
    }

    const items = await addBookmark(payload.newsId, payload.bucket);
    return NextResponse.json(items);
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存收藏时发生未知错误。";
    return NextResponse.json({ message }, { status: 500 });
  }
}
