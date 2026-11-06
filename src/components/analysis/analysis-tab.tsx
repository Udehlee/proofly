
import type { AnalysisTab } from "@/types/types";

interface AnalysisProps {
  activeTab: AnalysisTab;
  onTabChange: (tab: AnalysisTab) => void;
}

const tabs: { id: AnalysisTab; label: string }[] = [
  { id: "qa", label: " Answers" },
  { id: "evidence", label: "Evidence" },
  { id: "summary", label: "Summary" },
];

export default function Analysis({ activeTab, onTabChange}: AnalysisProps) {
  return (
    <div className="flex gap-7 border-b border-[#e2e8f0] mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`pb-3 text-[15px] font-semibold cursor-pointer -mb-px border-b-2 transition-colors ${
            activeTab === tab.id
              ? "text-[#047857] border-[#047857]"
              : "text-[#64748b] border-transparent"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
