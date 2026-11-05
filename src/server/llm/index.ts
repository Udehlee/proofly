import "server-only";

export type LLMRequest = {
  question: string;
  context: string;
};

export type LLMResponse = {
  provider: string;
  model: string;
  answer: string;
};

export interface LLMProvider {
  generate(request: LLMRequest): Promise<LLMResponse>;
}
