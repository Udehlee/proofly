import { Check } from "lucide-react";

import { formatFileSize, formatTime } from "@/lib/utils/utils";
import type { DocumentMeta } from "@/types/types";

interface DocumentInfoCardProps {
  document: DocumentMeta;
  onUploadAnother: () => void;
}

export default function DocumentInfoCard({
  document,
  onUploadAnother,
}: DocumentInfoCardProps) {
  return (
    <div className="card doc-info-card bg-white border border-[#e2e8f0] rounded-2xl p-[18px_22px] mb-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-[10px] bg-[#fee2e2] text-[#dc2626] grid place-items-center font-extrabold text-xs shrink-0">
            PDF
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-base font-bold text-[#0f172a] break-words">
              {document.filename}
            </div>

            <div className="text-[13px] text-[#64748b] mt-0.5">
              PDF • {formatFileSize(document.size)} • Uploaded{" "}
              {formatTime(document.createdAt)}
            </div>
          </div>
        </div>

        <div className="doc-info-actions flex items-center gap-3 flex-wrap">
         <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#047857] text-xs font-bold">
            <Check size={13} strokeWidth={3} />
            Analysis Complete
          </span>

          <button
            type="button"
            onClick={onUploadAnother}
            className="btn secondary px-3.5 py-1.5 text-[13px] rounded-lg"
          >
            Upload another
          </button>
        </div>
      </div>
    </div>
  );
}
