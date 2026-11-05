import { NextResponse } from "next/server";
import { z } from "zod";

import {
  MAX_NAME_LENGTH,
  MAX_QUESTION_LENGTH,
  MIN_QUESTION_LENGTH,
  UUID_REGEX,
} from "@/lib/constants";
import { HttpError } from "@/lib/error";
import { ensureDbUser } from "@/server/auth";
import { db } from "@/server/db";
import { listEvaluationViews } from "@/server/evaluation/view";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(MAX_NAME_LENGTH),
  question: z
    .string()
    .trim()
    .min(MIN_QUESTION_LENGTH, `Question must be at least ${MIN_QUESTION_LENGTH} characters.`)
    .max(MAX_QUESTION_LENGTH),
  category: z.string().trim().min(1, "Category is required.").max(50),
  documentIds: z.array(z.string()).min(1, "Select at least one document."),
});

export async function GET(request: Request) {
  try {
    const user = await ensureDbUser();

    if (request?.url) {
      const url = new URL(request.url);
      const documentId = url.searchParams.get("documentId");
      if (documentId) {
        if (!UUID_REGEX.test(documentId)) {
          throw new HttpError(400, "Invalid document ID.");
        }

        const doc = await db.document.findUnique({
          where: { id: documentId },
          select: { id: true, userId: true },
        });

        if (!doc) {
          throw new HttpError(404, "Document does not exist.");
        }
        if (doc.userId !== user.id) {
          throw new HttpError(403, "Document belongs to another user.");
        }

        const views = await listEvaluationViews(documentId, user.id);
        return NextResponse.json(views);
      }
    }

    const evaluations = await db.evaluation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { responses: true },
    });
    return NextResponse.json(evaluations);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[api/evaluations] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch evaluations." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await ensureDbUser();

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      throw new HttpError(400, "Invalid JSON in request body.");
    }

    const parseResult = schema.safeParse(rawBody);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      throw new HttpError(400, issue?.message || "Invalid input.");
    }
    const body = parseResult.data;

    for (const docId of body.documentIds) {
      if (!UUID_REGEX.test(docId)) {
        throw new HttpError(400, "Invalid document ID.");
      }
    }

    const documents = await db.document.findMany({
      where: { id: { in: body.documentIds } },
      select: { id: true, userId: true, status: true },
    });

    if (documents.length !== body.documentIds.length) {
      throw new HttpError(404, "Document does not exist.");
    }

    const unauthorized = documents.find((doc) => doc.userId !== user.id);
    if (unauthorized) {
      throw new HttpError(403, "Document belongs to another user.");
    }

    const processing = documents.find((doc) => doc.status === "PROCESSING");
    if (processing) {
      throw new HttpError(400, "Document is still processing.");
    }

    const failed = documents.find((doc) => doc.status === "FAILED");
    if (failed) {
      throw new HttpError(400, "Document processing failed.");
    }

    const notReady = documents.find((doc) => doc.status !== "READY");
    if (notReady) {
      throw new HttpError(400, "Document is not ready for evaluation.");
    }

    const evaluation = await db.evaluation.create({
      data: {
        userId: user.id,
        name: body.name,
        question: body.question,
        category: body.category,
        documents: {
          create: body.documentIds.map((documentId) => ({ documentId })),
        },
      },
    });

    return NextResponse.json(evaluation, { status: 201 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[api/evaluations] POST error:", error);
    return NextResponse.json({ error: "Could not create evaluation." }, { status: 500 });
  }
}
