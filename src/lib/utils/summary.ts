import { getStorage, setStorage } from "./storage";

const SUMMARY_KEY = "proofly_summary";

export function getCachedSummary(documentId: string): string | null {
  return getStorage(`${SUMMARY_KEY}_${documentId}`);
}

export function saveCachedSummary(
  documentId: string,
  summary: string
): void {
  setStorage(`${SUMMARY_KEY}_${documentId}`, summary);
}
