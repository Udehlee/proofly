import "server-only";

import { randomUUID } from "crypto";
import * as XLSX from "xlsx";
import pdf from "pdf-parse";
import mammoth from "mammoth";
import { GoogleGenAI } from "@google/genai";
import { Prisma } from "../generated/prisma/client.ts";
import { config } from "./config.ts";
import { db } from "./db.ts";
import { embedDocuments } from "./embeddings.ts";
import { extOf, SUPPORTED } from "../lib/file-types.ts";
import { DocumentValidationError } from "./errors.ts";

const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 200;
const EMBED_BATCH = 50;

const IMAGE_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

//Splits document text into overlapping chunks for embedding.
function chunkText(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];

  let start = 0;
  while (start < clean.length) {
    const end = Math.min(start + CHUNK_SIZE, clean.length);
    const chunk = clean.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end === clean.length) break;
    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }

  return chunks;
}

// Reads text out of an image with Gemini vision.
async function readImage(buffer: Buffer, mimeType: string) {
  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
  const res = await ai.models.generateContent({
    model: config.visionModel,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: buffer.toString("base64") } },
          {
            text: "Transcribe all readable text in this image exactly as written, keeping tables as rows. If there is no text, describe the image in detail. Output only the content.",
          },
        ],
      },
    ],
  });
  return res.text ?? "";
}

// Extracts plain text from PDF, DOCX, spreadsheet, image (Gemini OCR) and text files
export async function extractText(file: File) {
  const ext = extOf(file.name);
  if (!SUPPORTED.includes(ext)) {
    throw new Error(
  `Unsupported file type. Supported: ${SUPPORTED.join(", ").toUpperCase()}.`
);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (ext === "pdf") return (await pdf(buffer)).text;
  if (ext === "docx") return (await mammoth.extractRawText({ buffer })).value;
  if (ext === "xlsx" || ext === "xls") {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    return workbook.SheetNames.map((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      return `Sheet: ${sheetName}\n${XLSX.utils.sheet_to_csv(sheet)}`;
    }).join("\n\n");
  }

  if (IMAGE_TYPES[ext]) return readImage(buffer, IMAGE_TYPES[ext]);

  return buffer.toString("utf8");
}

// Splits a document into chunks, embeds each one, then saves them to pgvector in one transaction
//(replacing any old chunks) and marks the document READY. If saving fails, nothing is stored.
export async function processDocument(documentId: string, text: string) {
  const chunks = chunkText(text);
  if (!chunks.length) {
    throw new DocumentValidationError("No readable text was found in the document.");
  }

  // Embed in batches (one API call per 50 chunks instead of one per chunk).
  const vectors: number[][] = [];
  for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
    vectors.push(...(await embedDocuments(chunks.slice(i, i + EMBED_BATCH))));
  }

  // Batch insert inside an atomic database transaction
  const BATCH_SIZE = 50;
  await db.$transaction(async (tx) => {
    await tx.documentChunk.deleteMany({ where: { documentId } });

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const rowValues = batch.map((chunk, j) => {
        const index = i + j;
        const vector = `[${vectors[index].join(",")}]`;
        return Prisma.sql`(${randomUUID()}, ${documentId}, ${index}, ${chunk}, ${vector}::vector)`;
      });

      await tx.$executeRaw`
        INSERT INTO "DocumentChunk" ("id", "documentId", "chunkIndex", "content", "embedding")
        VALUES ${Prisma.join(rowValues)}
      `;
    }

    await tx.document.update({
      where: { id: documentId },
      data: { status: "READY" },
    });
  });

  return { chunkCount: chunks.length, status: "READY" as const };
}