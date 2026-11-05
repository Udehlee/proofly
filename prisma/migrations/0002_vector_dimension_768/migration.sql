-- Migration: 0002_vector_dimension_768
-- Proofly: Aligns PostgreSQL vector column and HNSW index with Google Gemini embeddings (gemini-embedding-001, 768 dimensions).

-- 1. Drop the legacy HNSW index that was bound to 1536 dimensions
DROP INDEX IF EXISTS "DocumentChunk_embedding_idx";

-- 2. Alter DocumentChunk.embedding type from vector(1536) to vector(768).
-- Any legacy 1536-dimensional embeddings (e.g., from OpenAI) cannot be mathematically
-- mapped to Gemini 768-dimensional vector space, so they are set to NULL.
-- All Document records, DocumentChunk text content, metadata, and relations are fully preserved.
ALTER TABLE "DocumentChunk"
  ALTER COLUMN "embedding" TYPE vector(768)
  USING NULL;

-- 3. Recreate the HNSW cosine index for 768 dimensions
CREATE INDEX "DocumentChunk_embedding_idx" ON "DocumentChunk" USING hnsw ("embedding" vector_cosine_ops);
