import "server-only";

import OpenAI from "openai";
import { config } from "../config";

export type ProviderKind = "gemini" | "groq";

function createClient(apiKey: string, baseURL: string) {
  return new OpenAI({ apiKey, baseURL, maxRetries: 2 });
}

// Created lazily on first use, then reused.
let geminiClient: OpenAI | undefined;
let groqClient: OpenAI | undefined;

export function getGeminiClient(): OpenAI {
  geminiClient ??= createClient(config.geminiApiKey, config.geminiBaseUrl);
  return geminiClient;
}

export function getGroqClient(): OpenAI {
  groqClient ??= createClient(config.groqApiKey, config.groqBaseUrl);
  return groqClient;
}