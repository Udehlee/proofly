"use client";

import { useRouter } from "next/navigation";

export default function DeleteDocumentButton({ id }: { id: string }) {
  const router = useRouter();

  async function remove() {
    const confirmed = confirm("Delete this document and its embeddings?");
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        alert("Could not delete document.");
        return;
      }

      router.refresh();
    } catch {
      alert("Something went wrong. Please try again.");
    }
  }

  return (
    <button className="btn secondary" onClick={remove} >
      Delete
    </button>
  );
}

