import "server-only";

import { Prisma } from "../generated/prisma/client.ts";
import { embedQuery } from "./embeddings.ts";
import { db } from "./db.ts";

export type RetrievedChunk = {
  id: string;
  documentId: string;
  filename: string;
  content: string;
  score: number;
};

/**
 * Finds the document chunks most similar in meaning to a query, using pgvector.
 * Uses cosine distance (<=>), where 0 is identical and 2 is opposite,
 * and returns 1 - distance as the similarity score.
 */
export async function retrieveChunks(
  query: string,
  documentIds: string[],
  limit = 5
): Promise<RetrievedChunk[]> {
  if (!documentIds.length) return [];

  const embedding = await embedQuery(query);
  const vector = `[${embedding.join(",")}]`;

  return db.$queryRaw<RetrievedChunk[]>(Prisma.sql`
    SELECT
      dc."id",
      dc."documentId",
      d."filename",
      dc."content",
      (1 - (dc."embedding" <=> ${vector}::vector))::float8 AS "score"
    FROM "DocumentChunk" dc
    INNER JOIN "Document" d ON d."id" = dc."documentId"
    WHERE dc."documentId" IN (${Prisma.join(documentIds)})
      AND dc."embedding" IS NOT NULL
    ORDER BY dc."embedding" <=> ${vector}::vector
    LIMIT ${limit}
  `);
}

// Formats retrieved chunks into labeled evidence blocks to include in the LLM prompt.
export function buildContext(chunks: RetrievedChunk[]) {
  return chunks
    .map(
      (chunk, index) =>
        `[Evidence ${index + 1}] ${chunk.filename}\n${chunk.content}`
    )
    .join("\n\n");
}
