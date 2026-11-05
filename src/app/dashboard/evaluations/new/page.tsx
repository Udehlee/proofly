import { db } from "@/server/db";
import { ensureDbUser } from "@/server/auth";
import EvaluationForm from "@/components/evaluation/evaluation-form";

export default async function NewEvaluationPage() {
  const user = await ensureDbUser();
  const documents = await db.document.findMany({
    where: { userId: user.id, status: "READY" },
    orderBy: { filename: "asc" },
    select: { id: true, filename: true, status: true },
  });

  return (
    <main className="shell pt-10 pb-20">
      <h1 className="text-3xl font-extrabold tracking-tight mb-2">New evaluation</h1>
      <p className="muted text-[var(--muted)] mb-6">
        The same question will be given to Gemini and Groq using the same retrieved evidence.
      </p>
      {documents.length ? (
        <EvaluationForm documents={documents} />
      ) : (
        <div className="card">
          <strong className="text-base text-[#0f172a]">Upload a document first.</strong>
          <p className="muted text-[var(--muted)] mt-1">
            Proofly needs at least one READY document before it can evaluate an answer.
          </p>
        </div>
      )}
    </main>
  );
}
