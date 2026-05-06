import { NextResponse } from "next/server";

import { validateBookmarkInput } from "@/lib/content/validation";
import { addBookmark, getBookmarks } from "@/lib/data/bookmarks";
import { getNewsById } from "@/lib/data/news";

export async function GET() {
  try {
    const items = await getBookmarks();
    return NextResponse.json(items);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read bookmarks.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = validateBookmarkInput(await request.json());
    const newsItem = await getNewsById(payload.newsId);

    if (!newsItem) {
      return NextResponse.json({ message: "newsId does not match an existing news item." }, { status: 400 });
    }

    const items = await addBookmark(payload.newsId, payload.bucket);
    return NextResponse.json(items);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save bookmark.";
    const status = error instanceof Error && error.name === "PayloadValidationError" ? 400 : 500;
    return NextResponse.json({ message }, { status });
  }
}
