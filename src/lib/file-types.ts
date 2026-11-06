export const SUPPORTED = [
    "pdf", 
    "docx", 
    "txt", 
    "md", 
    "csv",
    "json", 
    "xlsx", 
    "xls",
    "png", 
    "jpg", 
    "jpeg", 
    "webp",
    "gif"];
export const ACCEPT = SUPPORTED.map((e) => "." + e).join(",");
export const MAX_BYTES = 10 * 1024 * 1024;
export const extOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";