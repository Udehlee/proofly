
import {
  Check,
  X,
  AlertTriangle,
  CircleHelp,
  type LucideIcon,
} from "lucide-react";

import type { EvaluationResult, EvaluationStatus } from "@/types/types";

type EvaluationStatusInfo = {
  key: EvaluationStatus;
  label: string;
  circleClassName: string;
  badgeClassName: string;
  icon: LucideIcon;
};

const statusStyles: Record<EvaluationStatus, EvaluationStatusInfo> = {
  SUPPORTED: {
    key: "SUPPORTED",
    label: "Supported",
    circleClassName: "bg-[#047857]",
    badgeClassName: "bg-[#ecfdf5] text-[#047857]",
    icon: Check,
  },
  CONTRADICTED: {
    key: "CONTRADICTED",
    label: "Contradicted",
    circleClassName: "bg-[#dc2626]",
    badgeClassName: "bg-[#fee2e2] text-[#dc2626]",
    icon: X,
  },
  NOT_ESTABLISHED: {
    key: "NOT_ESTABLISHED",
    label: "Not Established",
    circleClassName: "bg-[#d97706]",
    badgeClassName: "bg-[#fef3c7] text-[#d97706]",
    icon: AlertTriangle,
  },
  UNCERTAIN: {
    key: "UNCERTAIN",
    label: "Uncertain",
    circleClassName: "bg-[#64748b]",
    badgeClassName: "bg-[#f1f5f9] text-[#64748b]",
    icon: CircleHelp,
  },
};

export function getEvaluationStatus(
  evaluation: EvaluationResult
): EvaluationStatusInfo {
  const claims =
    evaluation.responses?.flatMap((response) => response.claims || []) || [];

  if (claims.some((claim) => claim.status === "CONTRADICTED")) {
    return statusStyles.CONTRADICTED;
  }

  if (claims.some((claim) => claim.status === "UNSUPPORTED")) {
    return statusStyles.NOT_ESTABLISHED;
  }

  if (claims.some((claim) => claim.status === "UNCERTAIN")) {
    return statusStyles.UNCERTAIN;
  }

  return statusStyles.SUPPORTED;
}
