"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { EVALUATION_CATEGORIES } from "@/lib/constants";

type DocumentItem = { id: string; filename: string; status: string };

export default function EvaluationForm({ documents }: { documents: DocumentItem[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState("General");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggle(id: string) {
    setSelected((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }
      return [...current, id];
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/evaluations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          question,
          category,
          documentIds: selected,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not create evaluation.");
        return;
      }
      router.push(`/dashboard/evaluations/${data.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <div className="grid grid2">
        <div>
          <label className="label">Evaluation name</label>
          <input
            className="input"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Return policy check"
          />
        </div>
        <div>
          <label className="label">Category</label>
          <select
            className="select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {EVALUATION_CATEGORIES.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-[18px]">
        <label className="label">Business question</label>
        <textarea
          className="textarea"
          required
          rows={5}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Can a customer return a product after 14 days?"
        />
      </div>
      <div className="mt-[18px]">
        <label className="label">Business documents</label>
        <div className="grid">
          {documents.map((doc) => (
            <label
              key={doc.id}
              className="card p-3 cursor-pointer flex items-center"
            >
              <input
                type="checkbox"
                checked={selected.includes(doc.id)}
                onChange={() => toggle(doc.id)}
              />
              <strong className="ml-2">{doc.filename}</strong>
            </label>
          ))}
        </div>
      </div>
      {error && <p className="text-[#b42318] text-sm mt-3">{error}</p>}
      <button
        className="btn mt-[18px]"
        disabled={loading || !selected.length}
      >
        {loading ? "Creating..." : "Create evaluation"}
      </button>
    </form>
  );
}
