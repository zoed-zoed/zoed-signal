import { NextResponse } from "next/server";

import { saveNewsItem } from "@/lib/data/news";
import type { NewsItem } from "@/types/news";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as NewsItem;

    if (!payload.id || !payload.briefId || !payload.title) {
      return NextResponse.json({ message: "新闻 ID、所属简报和标题不能为空。" }, { status: 400 });
    }

    const item = await saveNewsItem(payload);
    return NextResponse.json(item);
  } catch (error) {
    const message = error instanceof Error ? error.message : "保存新闻时发生未知错误。";
    return NextResponse.json({ message }, { status: 500 });
  }
}
