export const EVALUATION_CATEGORIES = [
  "General",
  "Pricing",
  "Returns",
  "Delivery",
  "Product",
  "Customer service",
] as const;

export const MIN_QUESTION_LENGTH = 5;
export const MAX_QUESTION_LENGTH = 2000;
export const MAX_NAME_LENGTH = 100;
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
