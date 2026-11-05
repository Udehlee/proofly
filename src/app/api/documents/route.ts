import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { ensureDbUser } from "@/server/auth";
import { extractText, processDocument } from "@/server/documents";
import { MAX_BYTES, SUPPORTED, extOf } from "@/lib/file-types";
import { HttpError } from "@/lib/error";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET() {
  try {
    const user = await ensureDbUser();
    const documents = await db.document.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        filename: true,
        type: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(documents);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("[api/documents] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

/**
 * Creates an initial document record, extracts content,
 * calculates vector embeddings, and stores chunks.
 * Tracks createdDocumentId to guarantee status transitions to FAILED if downstream processing fails.
 */
export async function POST(request: Request) {
  let createdDocumentId: string | null = null;

  try {
    const user = await ensureDbUser();

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new HttpError(400, "Choose a file.");
    }

    const ext = extOf(file.name);
    if (!SUPPORTED.includes(ext)) {
      throw new HttpError(
        400,
        `Unsupported file type. Supported: ${SUPPORTED.join(", ").toUpperCase()}.`
      );
    }

    if (file.size > MAX_BYTES) {
      throw new HttpError(400, "That file is larger than 10MB.");
    }

    const document = await db.document.create({
      data: {
        userId: user.id,
        filename: file.name,
        type: file.type || ext,
      },
    });
    createdDocumentId = document.id;

    const text = await extractText(file);
    const result = await processDocument(document.id, text);

    return NextResponse.json(
      {
        ...document,
        ...result,
      },
      { status: 201 }
    );
  } catch (error) {
    // If the document was already created in DB before failure, mark it as FAILED
    if (createdDocumentId) {
      await db.document
        .update({
          where: { id: createdDocumentId },
          data: { status: "FAILED" },
        })
        .catch(() => {});
    }

    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("[api/documents] POST error:", error);
    return NextResponse.json(
      { error: "Upload failed." },
      { status: 500 }
    );
  }
}