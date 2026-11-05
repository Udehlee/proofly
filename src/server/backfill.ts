import "server-only";

import { db } from "./db";
import { embedDocuments } from "./embeddings";

export interface BackfillResult {
  totalChunks: number;
  updatedChunks: number;
}

/**
 * Re-embeds document chunks where `embedding` is NULL.
 * Uses the active Gemini embedding model (gemini-embedding-001, 768 dims).
 * Preserves all document relations, chunk texts, and metadata.
 */
export async function backfillChunkEmbeddings(batchSize = 50): Promise<BackfillResult> {
  const chunks = await db.$queryRaw<Array<{ id: string; content: string }>>`
    SELECT "id", "content"
    FROM "DocumentChunk"
    WHERE "embedding" IS NULL
    ORDER BY "createdAt" ASC
  `;

  if (!chunks || chunks.length === 0) {
    return { totalChunks: 0, updatedChunks: 0 };
  }

  let updatedCount = 0;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const contents = batch.map((c) => c.content);
    const vectors = await embedDocuments(contents);

    for (let j = 0; j < batch.length; j++) {
      const vector = `[${vectors[j].join(",")}]`;
      await db.$executeRaw`
        UPDATE "DocumentChunk"
        SET "embedding" = ${vector}::vector
        WHERE "id" = ${batch[j].id}
      `;
      updatedCount += 1;
    }
  }

  return {
    totalChunks: chunks.length,
    updatedChunks: updatedCount,
  };
}
