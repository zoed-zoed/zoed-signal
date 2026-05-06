import { NextResponse } from "next/server";

import { validateBriefInput } from "@/lib/content/validation";
import { getBriefById, getBriefs, saveBrief } from "@/lib/data/briefs";

export async function GET() {
  try {
    const briefs = await getBriefs();
    return NextResponse.json(briefs);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read briefs.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = validateBriefInput(await request.json());
    const existing = await getBriefById(payload.id);

    if (existing) {
      return NextResponse.json({ message: "A brief with this id already exists." }, { status: 409 });
    }

    const brief = await saveBrief(payload);
    return NextResponse.json(brief);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save brief.";
    const status = error instanceof Error && error.name === "PayloadValidationError" ? 400 : 500;
    return NextResponse.json({ message }, { status });
  }
}
