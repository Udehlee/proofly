CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Document" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PROCESSING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Document_userId_idx" ON "Document"("userId");

CREATE TABLE "DocumentChunk" (
  "id" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "chunkIndex" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "metadata" JSONB,
  "embedding" vector(1536),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DocumentChunk_documentId_idx" ON "DocumentChunk"("documentId");
CREATE INDEX "DocumentChunk_embedding_idx" ON "DocumentChunk" USING hnsw ("embedding" vector_cosine_ops);

CREATE TABLE "Evaluation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Evaluation_userId_idx" ON "Evaluation"("userId");

CREATE TABLE "EvaluationDocument" (
  "evaluationId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  CONSTRAINT "EvaluationDocument_pkey" PRIMARY KEY ("evaluationId","documentId")
);

CREATE TABLE "ModelResponse" (
  "id" TEXT NOT NULL,
  "evaluationId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ModelResponse_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ModelResponse_evaluationId_idx" ON "ModelResponse"("evaluationId");

CREATE TABLE "Claim" (
  "id" TEXT NOT NULL,
  "responseId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "explanation" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Claim_responseId_idx" ON "Claim"("responseId");

CREATE TABLE "Evidence" (
  "id" TEXT NOT NULL,
  "claimId" TEXT NOT NULL,
  "chunkId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Evidence_claimId_idx" ON "Evidence"("claimId");

CREATE TABLE "GuardrailResult" (
  "id" TEXT NOT NULL,
  "evaluationId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  CONSTRAINT "GuardrailResult_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GuardrailResult_evaluationId_idx" ON "GuardrailResult"("evaluationId");

ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentChunk" ADD CONSTRAINT "DocumentChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EvaluationDocument" ADD CONSTRAINT "EvaluationDocument_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EvaluationDocument" ADD CONSTRAINT "EvaluationDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ModelResponse" ADD CONSTRAINT "ModelResponse_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "ModelResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "DocumentChunk"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuardrailResult" ADD CONSTRAINT "GuardrailResult_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
