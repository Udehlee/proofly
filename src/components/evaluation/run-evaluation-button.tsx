"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RunEvaluationButton({ id, disabled }: { id: string; disabled?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
  setLoading(true);
  setError("");

  try {
    const response = await fetch(`/api/evaluations/${id}/run`, {
      method: "POST",
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Evaluation failed.");
      return;
    }

    router.refresh();
  } catch {
    setError("Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
}

  return (
    <div>
      <button className="btn" disabled={disabled || loading} onClick={run}>
        {loading ? "Running AI evaluation..." : "Run evaluation"}
      </button>
      {error && 
      <p className="text-[#b42318] text-[13px] mt-1">{error}</p>}
    </div>
  );
}
