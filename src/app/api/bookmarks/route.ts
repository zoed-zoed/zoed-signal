import { NextResponse } from "next/server";

import { addBookmark, getBookmarks } from "@/lib/data/bookmarks";
import type { SavedType } from "@/types/news";

export async function GET() {
  const items = await getBookmarks();
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as { newsId: string; bucket: SavedType };
  const items = await addBookmark(payload.newsId, payload.bucket);
  return NextResponse.json(items);
}
