import Link from "next/link";
import { db } from "@/server/db";
import { ensureDbUser } from "@/server/auth";

export default async function EvaluationsPage() {
  const user = await ensureDbUser();
  const evaluations = await db.evaluation.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="shell pt-10 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Evaluations</h1>
          <p className="muted text-[var(--muted)]">Your evidence-grounded AI checks.</p>
        </div>
        <Link className="btn" href="/dashboard/evaluations/new">
          New evaluation
        </Link>
      </div>
      <div className="grid mt-6">
        {evaluations.map((item) => (
          <Link
            href={`/dashboard/evaluations/${item.id}`}
            className="card block hover:border-[var(--accent)] transition-colors"
            key={item.id}
          >
            <strong className="text-base text-[#0f172a]">{item.name}</strong>
            <p className="muted text-[var(--muted)] my-1">{item.question}</p>
            <span className="muted text-xs text-[var(--muted)] uppercase font-semibold">
              {item.status}
            </span>
          </Link>
        ))}
        {!evaluations.length && (
          <div className="card muted text-center py-6 text-[var(--muted)]">
            No evaluations yet.
          </div>
        )}
      </div>
    </main>
  );
}
