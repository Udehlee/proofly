import { NextResponse } from "next/server";

import { HttpError } from "@/lib/error";
import { ensureDbUser } from "@/server/auth";
import { getEvaluationView } from "@/server/evaluation/view";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await ensureDbUser();
    const { id } = await params;
    const evaluation = await getEvaluationView(id, user.id);
    if (!evaluation) {
      throw new HttpError(404, "Not found.");
    }
    return NextResponse.json(evaluation);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[api/evaluations/result] GET error:", error);
    return NextResponse.json({ error: "Request failed." }, { status: 500 });
  }
}
