import { NextResponse } from "next/server";

import { removeBookmark } from "@/lib/data/bookmarks";
import type { SavedType } from "@/types/news";

type Params = {
  params: Promise<{ newsId: string }>;
};

export async function DELETE(request: Request, { params }: Params) {
  const { newsId } = await params;
  const { searchParams } = new URL(request.url);
  const bucket = searchParams.get("bucket") as SavedType | null;

  if (!bucket) {
    return NextResponse.json({ message: "Missing bucket" }, { status: 400 });
  }

  const items = await removeBookmark(newsId, bucket);
  return NextResponse.json(items);
}
