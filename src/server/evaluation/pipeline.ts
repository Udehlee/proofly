import "server-only";

import { db } from "../db";
import { retrieveChunks, buildContext } from "../retrieval";
import { geminiProvider, groqProvider } from "../llm/providers";
import { getGeminiClient, getGroqClient } from "../llm/client";
import { extractClaims } from "./claims";
import { verifyClaim } from "./verify";
import { runGuardrails } from "../guardrails/checks";
import { config } from "../config";

// Run multiple tasks without exceeding the concurrency limit.
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  }

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    () => worker()
  );

  await Promise.all(workers);

  return results;
}

// AI providers used for evaluation.
const providers = [
  {
    label: "Gemini",
    impl: geminiProvider,
    getClient: getGeminiClient,
    model: config.geminiModel,
    kind: "gemini" as const,
  },
  {
    label: "Groq",
    impl: groqProvider,
    getClient: getGroqClient,
    model: config.groqModel,
    kind: "groq" as const,
  },
];

export async function runEvaluation( evaluationId: string, userId: string) {
  const evaluation = await db.evaluation.findFirst({
    where: {
      id: evaluationId,
      userId,
    },
    include: {
      documents: true,
    },
  });

  if (!evaluation) {
    throw new Error("Evaluation not found.");
  }

  const question = evaluation.question;
  const documentIds = evaluation.documents.map(
    (document) => document.documentId
  );

  if (!documentIds.length) {
    throw new Error("Select at least one document.");
  }

  await db.evaluation.update({
    where: { id: evaluationId },
    data: { status: "RUNNING" },
  });

  const startedAt = Date.now();

  function log(message: string) {
    const elapsed = Math.round((Date.now() - startedAt) / 1000);

    console.log(
      `[evaluation ${evaluationId.slice(0, 8)}] ${message} (+${elapsed}s)`
    );
  }

  try {
    // Retrieve relevant document evidence.
    const evidence = await retrieveChunks(
      question,
      documentIds,
      config.retrievalLimit
    );

    if (!evidence.length) {
      throw new Error("No vector evidence was found for this question.");
    }

    log(`Retrieved ${evidence.length} evidence chunks`);

    const context = buildContext(evidence);

    // Remove previous evaluation results
    await db.modelResponse.deleteMany({
      where: { evaluationId },
    });

    await db.guardrailResult.deleteMany({
      where: { evaluationId },
    });

    // Process and verify an answer from one AI provider.
    async function processProvider(
      provider: (typeof providers)[number]
    ) {
      const client = provider.getClient();

      // Generate answer.
      const response = await provider.impl.generate({
        question,
        context,
      });

      log(`${provider.label} generated an answer`);

      // Save the generated answer.
      const savedResponse = await db.modelResponse.create({
        data: {
          evaluationId,
          provider: response.provider,
          model: response.model,
          answer: response.answer,
        },
      });

      // Extract claims from the answer
      const claims = await extractClaims(
        response.answer,
        client,
        provider.model,
        provider.kind
      );

      log(`${provider.label} extracted ${claims.length} claims`);

      // Verify each claim against document evidence.
      const claimResults = await mapLimit(
        claims,
        3,
        async (claim) => {
          const claimEvidence = await retrieveChunks(
            claim.text,
            documentIds,
            config.claimEvidenceLimit
          );

          const claimContext = buildContext(claimEvidence);

          const verification = claimEvidence.length
            ? await verifyClaim(
                claim.text,
                claimContext,
                client,
                provider.model,
                provider.kind
              )
            : {
                status: "UNSUPPORTED" as const,
                explanation:
                  "No relevant business evidence was retrieved.",
              };

          // Save the verified claim.
          const savedClaim = await db.claim.create({
            data: {
              responseId: savedResponse.id,
              text: claim.text,
              status: verification.status,
              explanation: verification.explanation,
            },
          });

          // Save the evidence supporting the claim.
          if (claimEvidence.length) {
            await db.evidence.createMany({
              data: claimEvidence.map((item) => ({
                claimId: savedClaim.id,
                chunkId: item.id,
                content: item.content,
                score: item.score,
              })),
            });
          }

          return {
            text: claim.text,
            status: verification.status as string,
          };
        }
      );

      // Check the answer for guardrail violations.
      const guardrails = runGuardrails(
        response.answer,
        claimResults
      );

      if (guardrails.length) {
        await db.guardrailResult.createMany({
          data: guardrails.map((item) => ({
            evaluationId,
            type: `${response.provider}: ${item.type}`,
            status: item.status,
            message: item.message,
          })),
        });
      }

      log(`${provider.label} finished verification`);
    }

    //  Run Gemini and Groq concurrently.
    const results = await Promise.allSettled(
      providers.map((provider) => processProvider(provider))
    );

    // Collect provider failures.
    const failures: string[] = [];

    for (const [index, result] of results.entries()) {
      if (result.status === "fulfilled") {
        continue;
      }

      const provider = providers[index];

      const message =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);

      console.error(`[evaluation] ${provider.label} failed:`, result.reason);

      failures.push(`${provider.label}: ${message}`);

      await db.guardrailResult.create({
        data: {
          evaluationId,
          type: `${provider.label}: Provider run`,
          status: "ERROR",
          message: message.slice(0, 500),
        },
      });
    }

    // Fail only when both providers fail.
    if (failures.length === providers.length) {
      throw new Error(
        `All providers failed. ${failures.join(" | ")}`
      );
    }

    // Mark evaluation as completed.
    await db.evaluation.update({
      where: { id: evaluationId },
      data: { status: "COMPLETED" },
    });

    log("Evaluation completed");
  } catch (error) {
    console.error("[evaluation] failed:", error);

    await db.evaluation.update({
      where: { id: evaluationId },
      data: { status: "FAILED" },
    });

    throw error;
  }
}