import "server-only";

import type OpenAI from "openai";
import { config } from "../config";
import { getGeminiClient, type ProviderKind } from "../llm/client";
import { getChatCompletionOptions } from "../llm/options";
import { verificationSchema, parseStructuredOutput } from "./parse";

export { verificationSchema };

export async function verifyClaim(
  claim: string,
  evidence: string,
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
        content: `Verify a claim against business evidence.
        SUPPORTED means the evidence directly supports the claim.
        CONTRADICTED means the evidence directly conflicts with it.
        UNSUPPORTED means the evidence does not establish the claim.
        UNCERTAIN means the relationship cannot be reliably determined.
        Return JSON exactly like {"status":"SUPPORTED","explanation":"..."}.`,
      },
      {
        role: "user",
        content: `CLAIM:\n${claim}\n\nEVIDENCE:\n${evidence}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  return parseStructuredOutput(content, verificationSchema, "Claim verification");
}