import { NextResponse } from "next/server";

import { saveNewsItem } from "@/lib/data/news";
import type { NewsItem } from "@/types/news";

export async function POST(request: Request) {
  const payload = (await request.json()) as NewsItem;
  const item = await saveNewsItem(payload);
  return NextResponse.json(item);
}
