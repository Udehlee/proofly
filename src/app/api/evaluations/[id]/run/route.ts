import { NextResponse } from "next/server";

import { HttpError } from "@/lib/error";
import { ensureDbUser } from "@/server/auth";
import { runEvaluation } from "@/server/evaluation/pipeline";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await ensureDbUser();
    const { id } = await params;

    if (!id || typeof id !== "string") {
      throw new HttpError(400, "Evaluation ID is required.");
    }

    try {
      await runEvaluation(id, user.id);
    } catch (runErr) {
      if (runErr instanceof HttpError) {
        throw runErr;
      }
      const message = runErr instanceof Error ? runErr.message : "Evaluation failed.";
      throw new HttpError(400, message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[api/evaluations/run] Execution error:", error);
    return NextResponse.json({ error: "Evaluation run failed." }, { status: 500 });
  }
}
