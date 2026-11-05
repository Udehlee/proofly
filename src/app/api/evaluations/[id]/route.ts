import { NextResponse } from "next/server";

import { HttpError } from "@/lib/error";
import { ensureDbUser } from "@/server/auth";
import { getEvaluationView } from "@/server/evaluation/view";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await ensureDbUser();
    const { id } = await params;

    const evaluation = await getEvaluationView(id, user.id, { includeDocuments: true });
    if (!evaluation) {
      throw new HttpError(404, "Evaluation not found.");
    }
    return NextResponse.json(evaluation);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[api/evaluations/id] GET error:", error);
    return NextResponse.json({ error: "Could not load evaluation." }, { status: 500 });
  }
}
