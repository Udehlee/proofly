import "server-only";

import { GoogleGenAI } from "@google/genai";
import { config } from "./config.ts";
import { EMBEDDING_DIMENSION } from "./embedding-config.ts";

let aiClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: config.geminiApiKey });
  }
  return aiClient;
}

// Creates embeddings (768 dimensions) for document passages using the "RETRIEVAL_DOCUMENT" task type
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const ai = getClient();
  const res = await ai.models.embedContent({
    model: config.embeddingModel,
    contents: texts,
    config: { taskType: "RETRIEVAL_DOCUMENT", outputDimensionality: EMBEDDING_DIMENSION },
  });
  return res.embeddings!.map((e) => e.values!);
}

//Creates an embedding for a search query claim using the "RETRIEVAL_QUERY" task type
export async function embedQuery(text: string): Promise<number[]> {
  const ai = getClient();
  const res = await ai.models.embedContent({
    model: config.embeddingModel,
    contents: text,
    config: { taskType: "RETRIEVAL_QUERY", outputDimensionality: EMBEDDING_DIMENSION },
  });
  return res.embeddings![0].values!;
}
