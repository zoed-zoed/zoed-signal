import { NextRequest, NextResponse } from "next/server";

import { importAiHotItems, type AiHotMode } from "@/lib/content/aihot";

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const result = await importAiHotItems({
      mode: getMode(searchParams.get("mode")),
      since: getSince(searchParams.get("since")),
      q: searchParams.get("q") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to import AI HOT items.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

function getMode(value: string | null): AiHotMode {
  return value === "all" ? "all" : "selected";
}

function getSince(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}
