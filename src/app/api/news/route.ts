import { NextResponse } from "next/server";

import { validateNewsItemInput } from "@/lib/content/validation";
import { getBriefById } from "@/lib/data/briefs";
import { getNewsItems, saveNewsItem } from "@/lib/data/news";

export async function GET() {
  try {
    const items = await getNewsItems();
    return NextResponse.json(items);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read news items.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = validateNewsItemInput(await request.json());
    const brief = await getBriefById(payload.briefId);

    if (!brief) {
      return NextResponse.json({ message: "briefId does not match an existing brief." }, { status: 400 });
    }

    const item = await saveNewsItem(payload);
    return NextResponse.json(item);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save news item.";
    const status = error instanceof Error && error.name === "PayloadValidationError" ? 400 : 500;
    return NextResponse.json({ message }, { status });
  }
}
