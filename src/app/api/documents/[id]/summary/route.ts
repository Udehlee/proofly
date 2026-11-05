import { NextResponse } from "next/server";

import { HttpError } from "@/lib/error";
import { ensureDbUser } from "@/server/auth";
import { db } from "@/server/db";
import { geminiProvider } from "@/server/llm/providers";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await ensureDbUser();
    const { id } = await params;

    const document = await db.document.findFirst({
      where: { id, userId: user.id },
      include: {
        chunks: {
          select: { content: true },
          orderBy: { chunkIndex: "asc" },
          take: 8,
        },
      },
    });

    if (!document) {
      throw new HttpError(404, "Document not found.");
    }

    if (!document.chunks.length) {
      throw new HttpError(400, "No document text available to summarize");
    }

    const context = document.chunks
      .map((c, i) => `[Section ${i + 1}]\n${c.content}`)
      .join("\n\n");

    try {
      const response = await geminiProvider.generate({
        question:
          "Provide a concise, factual executive summary of this business document. Outline the main purpose, key offerings or topics, important terms, and operational details.",
        context,
      });

      return NextResponse.json({
        summary: response.answer,
        provider: response.provider,
        model: response.model,
      });
    } catch (aiError) {
      console.error("[api/documents/id/summary] AI generation failed:", aiError);
      throw new HttpError(
        502,
        "Could not generate AI summary at this time. Please ensure AI provider credentials are configured."
      );
    }
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[api/documents/id/summary] Error:", error);
    return NextResponse.json({ error: "Failed to generate summary." }, { status: 500 });
  }
}
