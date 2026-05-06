import { NextResponse } from "next/server";

import { removeBookmark } from "@/lib/data/bookmarks";
import { getNewsById } from "@/lib/data/news";
import { type SavedType } from "@/types/news";

type Params = {
  params: Promise<{ newsId: string }>;
};

const allowedBuckets = new Set<SavedType>(["interview", "case", "content", "research"]);

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { newsId } = await params;
    const newsItem = await getNewsById(newsId);

    if (!newsItem) {
      return NextResponse.json({ message: "News item not found." }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get("bucket");

    if (!bucket || !allowedBuckets.has(bucket as SavedType)) {
      return NextResponse.json({ message: "bucket is missing or invalid." }, { status: 400 });
    }

    const items = await removeBookmark(newsId, bucket as SavedType);
    return NextResponse.json(items);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete bookmark.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
