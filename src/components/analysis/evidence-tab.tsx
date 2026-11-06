import type { DocumentChunkItem } from "@/types/types";

interface EvidenceProps {
  chunks: DocumentChunkItem[];
  loading: boolean;
}

export default function Evidence({ chunks,loading}: EvidenceProps) {
  return (
    <div className="card bg-white border border-[#e2e8f0] rounded-[14px] p-6">
      <h3 className="text-[17px] font-bold text-[#0f172a] m-0 mb-2">
        Extracted Document Chunks
      </h3>

      <p className="text-sm text-[#64748b] m-0 mb-5">
        The indexed text excerpts and semantic embeddings used to answer and
        verify questions.
      </p>

      {loading ? (
        <div className="p-[30px] text-center text-[#64748b]">
          Loading extracted evidence chunks...
        </div>
      ) : chunks.length > 0 ? (
        <div className="grid gap-3.5">
          {chunks.map((chunk) => (
            <div
              key={chunk.id}
              className="bg-[#f8fafc] border border-[#e2e8f0] rounded-[10px] p-[14px_16px]"
            >
              <div className="flex items-center justify-between text-xs font-bold text-[#047857] mb-1.5">
                <span>Chunk #{chunk.chunkIndex + 1}</span>

                <span className="text-[#94a3b8]">
                  {chunk.content.length} chars
                </span>
              </div>

              <div className="text-[13px] text-[#334155] leading-[1.55]">
                {chunk.content}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center text-[#64748b]">
          No chunks retrieved for this document.
        </div>
      )}
    </div>
  );
}