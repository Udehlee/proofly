import "server-only";

export type Guardrail = {
  type: string;
  status: "PASSED" | "WARNING" | "BLOCKED";
  message: string;
};

export function runGuardrails(answer: string, claims: Array<{ status: string; text: string }>): Guardrail[] {
  const results: Guardrail[] = [];

  const financialWords = /(?:₦|\$|USD|NGN|price|cost|fee|total|discount)/i;
  const sensitive = /(?:password|api key|secret|bank account|card number|customer id|phone number|email address)/i;

  const hasContradiction = claims.some((claim) => claim.status === "CONTRADICTED");
  const hasUnsupported = claims.some((claim) => claim.status === "UNSUPPORTED");

  results.push({
    type: "Business policy",
    status: hasContradiction ? "WARNING" : "PASSED",
    message: hasContradiction
      ? "At least one answer claim conflicts with retrieved business evidence."
      : "No direct contradiction was found in the verified claims.",
  });

  results.push({
    type: "Financial",
    status: financialWords.test(answer) && hasUnsupported ? "WARNING" : "PASSED",
    message:
      financialWords.test(answer) && hasUnsupported
        ? "A financial statement could not be fully grounded in the available evidence."
        : "No ungrounded financial warning was detected.",
  });

  results.push({
    type: "Sensitive data",
    status: sensitive.test(answer) ? "WARNING" : "PASSED",
    message: sensitive.test(answer)
      ? "The answer appears to mention potentially sensitive information. Review before sharing externally."
      : "No obvious sensitive-data pattern was detected.",
  });

  results.push({
    type: "Final output",
    status: hasContradiction ? "WARNING" : hasUnsupported ? "WARNING" : "PASSED",
    message: hasContradiction
      ? "Review contradicted claims before relying on this answer."
      : hasUnsupported
        ? "Some claims are not supported by the supplied business documents."
        : "The answer passed the available grounding checks.",
  });

  return results;
}
