import "server-only";


const EMBEDDING_MODEL = "gemini-embedding-001";

export class ConfigurationError extends Error {
  public readonly missingVariable: string;

  constructor(variableName: string) {
    super(
      `Missing required environment variable: ${variableName}. 
      Please configure it in your .env.local`
    );
    this.name = "ConfigurationError";
    this.missingVariable = variableName;
  }
}

export function validateRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new ConfigurationError(name);
  }
  return value;
}

export const config = {
  get geminiApiKey(): string {
    return validateRequiredEnv("GEMINI_API_KEY");
  },
  get groqApiKey(): string {
    return validateRequiredEnv("GROQ_API_KEY");
  },
  get geminiModel(): string {
    return validateRequiredEnv("GEMINI_MODEL");
  },
  get openaiModel(): string {
    return process.env.OPENAI_MODEL?.trim() || "gpt-4o";
  },
  get groqModel(): string {
    return process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b";
  },
  get embeddingModel(): string {
    return process.env.GEMINI_EMBEDDING_MODEL?.trim() || EMBEDDING_MODEL;
  },
  get visionModel(): string {
    return process.env.GEMINI_VISION_MODEL?.trim() || "gemini-2.0-flash";
  },
  get geminiBaseUrl(): string {
  return validateRequiredEnv("GEMINI_BASE_URL");
  },
  get groqBaseUrl(): string {
    return validateRequiredEnv("GROQ_BASE_URL");
  },
  retrievalLimit: 5,
  claimEvidenceLimit: 3,
};

export function validateConfig(): void {
  validateRequiredEnv("GEMINI_API_KEY");
  validateRequiredEnv("GEMINI_MODEL");
  validateRequiredEnv("GROQ_API_KEY");
  validateRequiredEnv("GEMINI_BASE_URL");
  validateRequiredEnv("GROQ_BASE_URL");

}