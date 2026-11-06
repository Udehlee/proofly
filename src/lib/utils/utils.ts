export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function truncate(text: string, max = 240) {
  return text.length <= max ? text : `${text.slice(0, max)}...`;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return "2.4 MB";

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


export function formatTime(isoString?: string): string {
  if (!isoString) return "just now";

  try {
    const date = new Date(isoString);

    if (Number.isNaN(date.getTime())) {
      return "just now";
    }

    const diffSec = Math.floor(
      (Date.now() - date.getTime()) / 1000
    );

    if (diffSec < 60) return "just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;

    return date.toLocaleDateString();
  } catch {
    return "just now";
  }
}

