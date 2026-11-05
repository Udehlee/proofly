import "server-only";

import { db } from "../db.ts";

export interface EvaluationViewOptions {
  includeDocuments?: boolean;
}

export function getEvaluationView(
  id: string,
  userId: string,
  options: EvaluationViewOptions = {}
) {
  return db.evaluation.findFirst({
    where: { id, userId },
    include: {
      documents: options.includeDocuments ? { include: { document: true } } : false,
      responses: {
        include: { claims: { include: { evidence: true } } },
        orderBy: { createdAt: "asc" as const },
      },
      guardrails: true,
    },
  });
}

export function listEvaluationViews(documentId: string, userId: string) {
  return db.evaluation.findMany({
    where: { userId, documents: { some: { documentId } } },
    orderBy: { createdAt: "desc" },
    include: {
      responses: {
        include: { claims: { include: { evidence: true } } },
        orderBy: { createdAt: "asc" as const },
      },
      guardrails: true,
    },
  });
}
