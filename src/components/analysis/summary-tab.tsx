
import { LoaderCircle } from "lucide-react";

interface SummaryProps {
  summaryText: string | null;
  loading: boolean;
  error: string;
}

export default function SummaryTab({
  summaryText,
  loading,
  error,
}: SummaryProps) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-[14px] p-6">
      <h3 className="text-[17px] font-bold text-[#0f172a] mb-4">
        Document Executive Summary
      </h3>

      {loading ? (
        <div className="p-10 text-center">
          <LoaderCircle
            size={25}
            className="animate-spin text-[#047857] mx-auto mb-3"
          />

          <p className="text-sm text-[#0f172a] font-semibold">
            Generating document summary...
          </p>

          <p className="text-[13px] text-[#64748b] mt-1">
            Summarizing the key facts and information in your document.
          </p>
        </div>
      ) : summaryText ? (
        <div className="text-sm text-[#334155] leading-[1.7] whitespace-pre-wrap bg-[#f8fafc] p-5 rounded-[10px] border border-[#e2e8f0]">
          {summaryText}
        </div>
      ) : (
        <div className="p-6 text-center text-[#991b1b]">
          {error || "Could not generate summary."}
        </div>
      )}
    </div>
  );
}
