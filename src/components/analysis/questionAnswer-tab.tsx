import { useState, type FormEvent } from "react";
import { Send, LoaderCircle, FileText, ChevronDown } from "lucide-react";

import type { EvaluationResult } from "@/types/types";
import { getEvaluationStatus } from "@/lib/evaluation/evaluation";

interface QuestionAnswerProps {
  questionInput: string;
  setQuestionInput: (value: string) => void;
  isAsking: boolean;
  errorMessage: string;
  evaluations: EvaluationResult[];
  activeDocumentFilename: string;
  onAskQuestion: (event: FormEvent<HTMLFormElement>) => void;
}

export default function QuestionAnswerTab({
  questionInput,
  setQuestionInput,
  isAsking,
  errorMessage,
  evaluations,
  activeDocumentFilename,
  onAskQuestion,
}: QuestionAnswerProps) {
  const [expandedEvidence, setExpandedEvidence] = useState<
    Record<string, boolean>
  >({});

  function toggleEvidence(id: string) {
    setExpandedEvidence((prev) => ({
      ...prev,
      [id]: !(prev[id] ?? true),
    }));
  }

  return (
    <div>
      {/* Question input */}
      <div className="mb-7">
        <h2 className="text-base font-bold text-[#0f172a] mb-3">
          Ask a question
        </h2>

        <form onSubmit={onAskQuestion} className="flex items-center gap-3">
          <input
            type="text"
            value={questionInput}
            onChange={(event) => setQuestionInput(event.target.value)}
            placeholder="e.g. How much does a 50 kg bag of rice cost?"
            disabled={isAsking}
            className="flex-1 px-4 py-3 rounded-[10px] border border-[#cbd5e1] text-sm outline-none focus:border-[#047857] focus:ring-2 focus:ring-[#a7f3d0]"
          />

          <button
            type="submit"
            disabled={isAsking || !questionInput.trim()}
            className="bg-white text-[#047857] px-[22px] py-3 rounded-[10px] text-sm font-semibold 
            inline-flex items-center gap-2 shrink-0 hover:bg-[#f0fdf4] disabled:opacity-50"
          >
            {isAsking ? (
              <>
                <LoaderCircle size={15} className="animate-spin" />
                Asking...
              </>
            ) : (
              <>
                <Send size={15} />
                Ask 
              </>
            )}
          </button>
        </form>

        {errorMessage && (
          <div className="mt-2.5 px-3 py-2 rounded-lg bg-[#fef2f2] border border-[#fee2e2] text-[#991b1b] text-[13px]">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Generated answers */}
      <div>
        <h3 className="text-[17px] font-bold text-[#0f172a] mb-4">
          Generated Answers
        </h3>

        {isAsking && (
          <div className="bg-white border border-[#a7f3d0] rounded-[14px] p-5 mb-4 flex items-center gap-3.5">
            <LoaderCircle
              size={20}
              className="animate-spin text-[#047857] shrink-0"
            />

            <div>
              <div className="text-sm font-semibold text-[#0f172a]">
                Analyzing: &ldquo;{questionInput}&rdquo;
              </div>
              <div className="text-[13px] text-[#64748b] mt-0.5">
                Searching your document and checking the evidence...
              </div>
            </div>
          </div>
        )}

        {evaluations.length === 0 && !isAsking && (
          <div className="bg-white border border-dashed border-[#cbd5e1] rounded-[14px] p-9 text-center text-[#64748b]">
            <div className="text-[15px] font-semibold text-[#0f172a]">
              No questions asked yet
            </div>
            <p className="text-[13px] mt-1">
              Enter a question above to get answers based on your document.
            </p>
          </div>
        )}

        {evaluations.map((item) => {
          const status = getEvaluationStatus(item);
          const StatusIcon = status.icon;

          const response = item.responses?.[0];
          const claims = response?.claims ?? [];

          const isExpanded = expandedEvidence[item.id] ?? true;
          // falls back to LLM explanation if retrieval yielded no chunks
          const firstEvidence = claims.flatMap(
            (claim) => claim.evidence ?? []
          )[0];

          const quote =
            firstEvidence?.content ??
            claims[0]?.explanation ??
            "No matching information found in the document.";

          return (
            <div
              key={item.id}
              className="bg-white border border-[#e2e8f0] rounded-[14px] p-5 mb-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
            >
              {/* Question and status */}
              <div className="flex items-start justify-between gap-3.5 flex-wrap">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`w-[26px] h-[26px] rounded-full text-white grid place-items-center shrink-0 ${status.circleClassName}`}
                  >
                    <StatusIcon size={15} strokeWidth={2.5} />
                  </div>

                  <h4 className="text-[15px] font-bold text-[#0f172a] break-words">
                    {item.question}
                  </h4>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap shrink-0 ${status.badgeClassName}`}
                >
                  <StatusIcon size={13} strokeWidth={2.5} />
                  {status.label}
                </span>
              </div>

              {/* Answer */}
              <div className="text-sm text-[#334155] leading-[1.6] my-3 ml-[38px] break-words">
                {response?.answer ?? (
                  <span className="text-[#64748b]">
                    The document does not contain enough information to
                    establish this claim.
                  </span>
                )}
              </div>

              {/* Evidence */}
              <div className="ml-[38px] border border-[#e2e8f0] rounded-[10px] bg-[#f8fafc] p-3">
                <button
                  type="button"
                  onClick={() => toggleEvidence(item.id)}
                  aria-expanded={isExpanded}
                  className="w-full flex items-center justify-between text-left cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <FileText size={16} className="text-[#64748b]" />
                    <span className="text-[13px] font-bold text-[#0f172a]">
                      Evidence
                    </span>
                  </span>

                  <ChevronDown
                    size={16}
                    className={`text-[#64748b] transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="mt-2.5">
                    <p className="text-[13px] text-[#334155] italic leading-[1.5]">
                      &ldquo;{quote.slice(0, 300)}
                      {quote.length > 300 ? "..." : ""}&rdquo;
                    </p>

                    <div className="text-xs text-[#64748b] mt-1.5">
                      {firstEvidence ? (
                        <>
                          Source: {activeDocumentFilename} • Confidence:{" "}
                          {(firstEvidence.score * 100).toFixed(0)}%
                        </>
                      ) : (
                        "Source: N/A • No matching text retrieved"
                      )}
                    </div>

                    {claims.length > 1 && (
                      <div className="mt-2.5 border-t border-dashed border-[#e2e8f0] pt-2">
                        <div className="text-xs font-bold text-[#64748b] mb-1">
                          Sub-claims ({claims.length})
                        </div>

                        {claims.map((claim) => (
                          <div
                            key={claim.id}
                            className="text-xs text-[#475569] mb-1"
                          >
                            • <strong>{claim.status}</strong>: {claim.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
