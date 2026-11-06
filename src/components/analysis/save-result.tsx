import { Check } from "lucide-react";

interface SaveResultsProps {
  authenticatedUserEmail: string | null;
  savedConfirmation: string | null;
  onSave: () => void;
}

export default function SaveResults({
  authenticatedUserEmail,
  savedConfirmation,
  onSave,
}: SaveResultsProps) {
  if (savedConfirmation) {
    return (
      <div className="mt-9 bg-[#ecfdf5] border border-[#a7f3d0] rounded-[14px] px-6 py-[18px] flex items-center gap-3.5">
        <div className="w-9 h-9 rounded-full bg-[#047857] text-white grid place-items-center shrink-0">
          <Check size={17} />
        </div>

        <div>
          <div className="text-sm font-bold text-[#0f172a]">
            Work saved successfully
          </div>
          <div className="text-[13px] text-[#047857] mt-0.5">
            Your work is saved to your account ({authenticatedUserEmail}).
          </div>
        </div>
      </div>
    );
  }

  if (authenticatedUserEmail) {
    return (
      <div className="mt-9 bg-[#f8fafc] border border-[#e2e8f0] rounded-[14px] px-5 py-4 flex items-center gap-3">
        <Check size={16} className="text-[#047857] shrink-0" />

        <span className="text-[13px] text-[#475569]">
          Signed in as <strong>{authenticatedUserEmail}</strong>. Your work is
          saved to your account.
        </span>
      </div>
    );
  }

  return (
    <div className="mt-9 bg-white border border-[#e2e8f0] rounded-[14px] p-5 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h3 className="text-sm font-bold text-[#0f172a]">
          Want to save your work?
        </h3>
        <p className="text-[13px] text-[#64748b] mt-1">
          Create an account to keep your documents, questions and answers.
        </p>
      </div>

      <button
        type="button"
        onClick={onSave}
        className="btn secondary px-3.5 py-1.5 text-[13px] rounded-lg"
      >
        Sign up to save
      </button>
    </div>
  );
}
