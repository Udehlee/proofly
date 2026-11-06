import type { EvaluationResult } from "@/types/types";

export async function createEvaluation(
  question: string,
  documentId: string
) {
  const response = await fetch("/api/evaluations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: question.slice(0, 100),
      question,
      category: "General",
      documentIds: [documentId],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Could not create evaluation.");
  }

  return data;
}

export async function runEvaluation(evaluationId: string) {
  const response = await fetch(
    `/api/evaluations/${evaluationId}/run`,
    { method: "POST" }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Evaluation failed.");
  }

  return data;
}

export async function getEvaluationResult(
  evaluationId: string
): Promise<EvaluationResult> {
  const response = await fetch(
    `/api/evaluations/${evaluationId}/result`
  );

  if (!response.ok) {
    throw new Error("Could not retrieve evaluation result.");
  }

  return response.json();
}