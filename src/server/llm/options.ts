import type { ProviderKind } from "./client";

export type ChatCompletionOptions = {
  model: string;
  temperature: number;
};

/**
 * Returns parameters for a chat completion request.
 * Uses temperature 0 for consistent, factual answers.
 */
export function getChatCompletionOptions(model: string): ChatCompletionOptions {
  return { model, temperature: 0 };
}

/**
 * Strips markdown code fences (e.g. ```json ... ```) from LLM output before parsing.
 */
export function cleanJsonText(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return (fenced ? fenced[1] : text).trim();
}