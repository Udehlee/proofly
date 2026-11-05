import "server-only";

import type OpenAI from "openai";
import { config } from "../config";
import type { LLMProvider, LLMRequest, LLMResponse } from "./index";
import { getGeminiClient, getGroqClient } from "./client";
import { getChatCompletionOptions } from "./options";

const systemPrompt = `You answer business questions using only the supplied business evidence.
If the evidence does not contain the answer, say that the information is not available.
Do not invent prices, policies, dates, quantities, delivery times, or product details.
Keep the answer concise and factual.`;

function buildMessages({ question, context }: LLMRequest) {
  return [
    { role: "system" as const, content: systemPrompt },
    {
      role: "user" as const,
      content: `BUSINESS EVIDENCE:\n${context}\n\nQUESTION:\n${question}`,
    },
  ];
}

// Both providers use the same OpenAI-compatible API, so one factory builds either.
function createProvider(
  label: string,
  getClient: () => OpenAI,
  model: string
): LLMProvider {
  return {
    async generate(request: LLMRequest): Promise<LLMResponse> {
      const response = await getClient().chat.completions.create({
        ...getChatCompletionOptions(model),
        messages: buildMessages(request),
      });

      return {
        provider: label,
        model,
        answer: response.choices[0]?.message?.content ?? "No answer returned.",
      };
    },
  };
}

export const geminiProvider = createProvider(
  "Gemini",
  getGeminiClient,
  config.geminiModel
);

export const groqProvider = createProvider(
  "Groq",
  getGroqClient,
  config.groqModel
);