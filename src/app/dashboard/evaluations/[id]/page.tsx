import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { ensureDbUser } from "@/server/auth";
import RunEvaluationButton from "@/components/evaluation/run-evaluation-button";

function statusText(status: string) {
  return status.replaceAll("_", " ").toLowerCase();
}

export default async function EvaluationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await ensureDbUser();
  const { id } = await params;
  const evaluation = await db.evaluation.findFirst({ 
    where: { id, userId: user.id },
    include: { documents: { include: { document: true } },
    responses: {
       include: {
         claims: { 
          include: {
             evidence: true 
            }
           } 
          } 
        }, 
        guardrails: true 
      }
       });
       
  if (!evaluation) notFound();

  const allClaims = evaluation.responses.flatMap((response) => response.claims);
  const countByStatus = (status: string) =>
    allClaims.filter((claim) => claim.status === status).length;

  const supported = countByStatus("SUPPORTED");
  const contradicted = countByStatus("CONTRADICTED");
  const unsupported = countByStatus("UNSUPPORTED");
  const uncertain = countByStatus("UNCERTAIN");
  const total = allClaims.length;

  // Accuracy measures factual alignment
  // Grounding measures source relevance 
  const accuracy = total ? Math.round((supported / total) * 100) : 0;
  const grounding = total ? Math.round(((supported + contradicted) / total) * 100) : 0;

  return (
    <main className="shell pt-10 pb-20">
      <div className="flex items-start justify-between gap-5">
        <div>
          <Link href="/dashboard" className="muted text-sm text-[var(--muted)] hover:underline">
            ← Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 mb-2">{evaluation.name}</h1>
          <p className="muted text-[var(--muted)]">{evaluation.question}</p>
        </div>
        <RunEvaluationButton id={evaluation.id} disabled={evaluation.status === "RUNNING"} />
      </div>

      <div className="grid grid2 mt-6">
        <div className="card">
          <div className="muted text-sm text-[var(--muted)] mb-1">Status</div>
          <strong className="text-base text-[#0f172a] capitalize">{statusText(evaluation.status)}</strong>
        </div>
        <div className="card">
          <div className="muted text-sm text-[var(--muted)] mb-1">Documents</div>
          <strong className="text-base text-[#0f172a]">
            {evaluation.documents.map((x) => x.document.filename).join(", ")}
            </strong>
        </div>
      </div>

      {evaluation.status === "COMPLETED" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="card">
              <div className="muted text-sm text-[var(--muted)] mb-1">Claim accuracy</div>
              <strong className="text-[32px] font-bold text-[#0f172a] leading-tight block">{accuracy}%</strong>
            </div>
            <div className="card">
              <div className="muted text-sm text-[var(--muted)] mb-1">Grounding</div>
              <strong className="text-[32px] font-bold text-[#0f172a] leading-tight block">{grounding}%</strong>
            </div>
            <div className="card">
              <div className="muted text-sm text-[var(--muted)] mb-1">Claims</div>
              <strong className="text-[32px] font-bold text-[#0f172a] leading-tight block">{total}</strong>
              <div className="muted text-xs text-[var(--muted)] mt-1">
                {supported} supported · {contradicted} contradicted · {unsupported} unsupported · {uncertain} uncertain
              </div>
            </div>
          </div>

          <section className="mt-[30px]">
            <h2 className="text-xl font-bold mb-3">Model responses</h2>
            {evaluation.responses.map((response) => (
              <article className="card mt-3.5" key={response.id}>
                <div className="flex justify-between items-center gap-5">
                  <strong className="text-base">{response.provider}</strong>
                  <span className="muted text-xs text-[var(--muted)] font-mono">{response.model}</span>
                </div>
                <p className="whitespace-pre-wrap leading-[1.6] my-2.5 text-sm">{response.answer}</p>
                <h3 className="text-sm font-bold mt-4 mb-2">Verified claims</h3>
                {response.claims.length ? (
                  response.claims.map((claim) => (
                    <div key={claim.id} className="border-t border-[var(--line)] py-3.5">
                      <strong className="text-xs uppercase tracking-wide text-[var(--accent)] font-semibold">{claim.status}</strong>
                      <p className="mb-1 text-sm text-[#0f172a] font-medium mt-1">{claim.text}</p>
                      <span className="muted text-xs text-[var(--muted)] block">{claim.explanation}</span>
                      {claim.evidence.length > 0 && (
                        <details className="mt-2 text-xs">
                          <summary className="cursor-pointer font-medium text-[var(--muted)] hover:text-[#0f172a]">
                            Evidence ({claim.evidence.length})
                          </summary>
                          {claim.evidence.map((e) => (
                            <p className="muted text-xs text-[var(--muted)] mt-1 pl-2 border-l-2 border-[var(--line)]" key={e.id}>
                              [{e.score.toFixed(3)}] {e.content}
                            </p>
                          ))}
                        </details>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="muted text-sm text-[var(--muted)]">No checkable claims found.</p>
                )}
              </article>
            ))}
          </section>

          <section className="mt-[30px]">
            <h2 className="text-xl font-bold mb-3">Guardrails</h2>
            <div className="grid mt-3">
              {evaluation.guardrails.map((g) => (
                <div className="card" key={g.id}>
                  <strong className="text-sm">{g.status} · {g.type}</strong>
                  <p className="muted text-xs text-[var(--muted)] mt-1">{g.message}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
