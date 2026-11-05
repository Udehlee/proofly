import { z, type ZodType } from "zod";

export class StructuredOutputParseError extends Error {
  public readonly rawText?: string;

  constructor(message: string, rawText?: string) {
    super(message);
    this.name = "StructuredOutputParseError";
    this.rawText = rawText;
  }
}

export const claimsSchema = z.object({
  claims: z.array(z.object({ text: z.string().trim().min(1) })),
});

export type ClaimsOutput = z.infer<typeof claimsSchema>;

export const verificationSchema = z.object({
  status: z.enum(["SUPPORTED", "CONTRADICTED", "UNSUPPORTED", "UNCERTAIN"]),
  explanation: z.string(),
});

export type VerificationOutput = z.infer<typeof verificationSchema>;

// Pulls the JSON object out of a ```json fence or surrounding text.
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) return fenced[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start !== -1 && end > start ? text.slice(start, end + 1) : text.trim();
}

/**
 * Parses an LLM's JSON output and validates it against a Zod schema.
 * Throws StructuredOutputParseError on empty, malformed, or mismatched output.
 */
export function parseStructuredOutput<T>(
  text: string | null | undefined,
  schema: ZodType<T>,
  contextName = "Structured output"
): T {
  if (!text?.trim()) {
    throw new StructuredOutputParseError(
      `${contextName} returned empty or missing content.`,
      text ?? undefined
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(text));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new StructuredOutputParseError(
      `${contextName} failed to parse JSON: ${reason}`,
      text
    );
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => {
        const path = issue.path.length ? ` at "${issue.path.join(".")}"` : "";
        return `${issue.message}${path}`;
      })
      .join("; ");

    throw new StructuredOutputParseError(
      `${contextName} schema validation failed: ${issues}`,
      text
    );
  }

  return result.data;
}