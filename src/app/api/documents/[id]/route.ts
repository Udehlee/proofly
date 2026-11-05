import { NextResponse } from "next/server";

import { HttpError } from "@/lib/error";
import { ensureDbUser } from "@/server/auth";
import { db } from "@/server/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await ensureDbUser();
    const { id } = await params;

    const document = await db.document.findFirst({
      where: { id, userId: user.id },
      include: {
        chunks: {
          select: { id: true, chunkIndex: true, content: true },
          orderBy: { chunkIndex: "asc" },
        },
      },
    });

    if (!document) {
      throw new HttpError(404, "Document not found.");
    }

    return NextResponse.json(document);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[api/documents/id] GET error:", error);
    return NextResponse.json({ error: "Fetch failed." }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await ensureDbUser();
    const { id } = await params;

    const document = await db.document.findFirst({
       where: { id, userId: user.id },
       });
    if (!document) {
      throw new HttpError(404, "Document not found.");
    }

    await db.document.delete({
       where: { id },
      });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[api/documents/id] DELETE error:", error);
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }
}
