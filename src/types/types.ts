export type ClaimView = {
  id: string;
  text: string;
  status: string;
  explanation: string | null;
  evidence: { id: string; content: string; score: number }[];
};

export type ResponseView = {
  id: string;
  provider: string;
  model: string;
  answer: string;
  claims: ClaimView[];
};

export type EvalView = {
  id: string;
  question: string;
  status: string;
  responses: ResponseView[];
  guardrails: { id: string; type: string; status: string; message: string }[];
};


export type EvaluationStatus =
  | "SUPPORTED"
  | "NOT_ESTABLISHED"
  | "CONTRADICTED"
  | "UNCERTAIN";

export type ClaimStatus =
  | "SUPPORTED"
  | "CONTRADICTED"
  | "UNSUPPORTED"
  | "UNCERTAIN";

export interface EvidenceItem {
  id: string;
  content: string;
  score: number;
}

export interface ClaimItem {
  id: string;
  text: string;
  status: ClaimStatus;
  explanation?: string | null;
  evidence: EvidenceItem[];
}

export interface ModelResponseItem {
  id: string;
  provider: string;
  model: string;
  answer: string;
  claims: ClaimItem[];
}

export interface EvaluationResult {
  id: string;
  name: string;
  question: string;
  status: string;
  createdAt: string;
  responses: ModelResponseItem[];
}

export interface DocumentAnswer {
  id: string;
  question: string;
  answer: string;
  status: EvaluationStatus;
  evidence: EvidenceItem[];
  subClaims?: ClaimItem[];
}

export interface DocumentChunkItem {
  id: string;
  chunkIndex: number;
  content: string;
}

export interface DocumentMeta {
  id: string;
  filename: string;
  type?: string;
  status: string;
  size?: number;
  chunkCount?: number;
  createdAt?: string;
}

export type AnalysisTab = "qa" | "evidence" | "summary";
