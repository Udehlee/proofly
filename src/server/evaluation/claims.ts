import "server-only";

import type OpenAI from "openai";
import { config } from "../config";
import { getGeminiClient, type ProviderKind } from "../llm/client";
import { getChatCompletionOptions } from "../llm/options";
import { claimsSchema, parseStructuredOutput } from "./parse";

export { claimsSchema };

export async function extractClaims(
  answer: string,
  client: Pick<OpenAI, "chat"> = getGeminiClient(),
  model: string = config.geminiModel,
  provider: ProviderKind = "gemini"
) {
  const options = getChatCompletionOptions(model);

  const response = await client.chat.completions.create({
    ...options,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `Extract only factual, business-checkable claims from the answer.
        Ignore greetings, opinions, recommendations, filler, and questions.
        Return JSON exactly like {"claims":[{"text":"..."}]}.`,
      },
      { role: "user", content: answer },
    ],
  });

  const content = response.choices[0]?.message?.content;
  return parseStructuredOutput(content, claimsSchema, "Claim extraction").claims;
}