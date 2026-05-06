import { NextResponse } from "next/server";

import { validateBriefInput } from "@/lib/content/validation";
import { deleteBrief, getBriefById, saveBrief } from "@/lib/data/briefs";
import { getNewsForBrief } from "@/lib/data/news";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const existing = await getBriefById(id);

    if (!existing) {
      return NextResponse.json({ message: "Brief not found." }, { status: 404 });
    }

    const payload = validateBriefInput(await request.json(), {
      id,
      title: existing.title,
      newsItemIds: existing.newsItemIds,
    });

    const brief = await saveBrief(payload);
    return NextResponse.json(brief);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update brief.";
    const status = error instanceof Error && error.name === "PayloadValidationError" ? 400 : 500;
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const existing = await getBriefById(id);

    if (!existing) {
      return NextResponse.json({ message: "Brief not found." }, { status: 404 });
    }

    const linkedNews = await getNewsForBrief(id);
    if (linkedNews.length > 0) {
      return NextResponse.json(
        { message: `This brief still contains ${linkedNews.length} linked news items.` },
        { status: 409 },
      );
    }

    await deleteBrief(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete brief.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
