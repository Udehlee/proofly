import { db } from "@/server/db";
import { ensureDbUser } from "@/server/auth";
import DocumentUpload from "@/components/documents/document-upload";
import DeleteDocumentButton from "@/components/documents/delete-document-button";

export default async function DocumentsPage() {
  const user = await ensureDbUser();
  const documents = await db.document.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { chunks: true } } },
  });

  return (
    <main className="shell pt-10 pb-20">
      <h1 className="text-3xl font-extrabold tracking-tight mb-2">Documents</h1>
      <p className="muted text-[var(--muted)] mb-6">
        These are the business sources proofly can retrieve from.
      </p>
      <DocumentUpload />
      <div className="grid mt-6">
        {documents.map((doc) => (
          <div
            className="card flex items-center justify-between gap-5"
            key={doc.id}
          >
            <div>
              <strong className="text-base">{doc.filename}</strong>
              <div className="muted text-[13px] text-[var(--muted)]">
                {doc.status} · {doc._count.chunks} chunks
              </div>
            </div>
            <DeleteDocumentButton id={doc.id} />
          </div>
        ))}
        {documents.length === 0 && (
          <div className="card muted text-[var(--muted)] text-center py-6">
            No documents yet.
          </div>
        )}
      </div>
    </main>
  );
}
