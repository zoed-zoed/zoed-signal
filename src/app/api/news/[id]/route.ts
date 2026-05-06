import { NextResponse } from "next/server";

import { validateNewsItemInput } from "@/lib/content/validation";
import { getBriefById } from "@/lib/data/briefs";
import { deleteNewsItem, getNewsById, saveNewsItem } from "@/lib/data/news";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const existing = await getNewsById(id);

    if (!existing) {
      return NextResponse.json({ message: "News item not found." }, { status: 404 });
    }

    const payload = validateNewsItemInput(await request.json(), { id });
    const brief = await getBriefById(payload.briefId);

    if (!brief) {
      return NextResponse.json({ message: "briefId does not match an existing brief." }, { status: 400 });
    }

    const item = await saveNewsItem(payload);
    return NextResponse.json(item);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update news item.";
    const status = error instanceof Error && error.name === "PayloadValidationError" ? 400 : 500;
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    await deleteNewsItem(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete news item.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
