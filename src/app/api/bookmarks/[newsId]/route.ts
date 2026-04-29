import { NextResponse } from "next/server";

import { removeBookmark } from "@/lib/data/bookmarks";
import type { SavedType } from "@/types/news";

type Params = {
  params: Promise<{ newsId: string }>;
};

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { newsId } = await params;
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get("bucket") as SavedType | null;

    if (!bucket) {
      return NextResponse.json({ message: "缺少 bucket 参数。" }, { status: 400 });
    }

    const items = await removeBookmark(newsId, bucket);
    return NextResponse.json(items);
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除收藏时发生未知错误。";
    return NextResponse.json({ message }, { status: 500 });
  }
}
