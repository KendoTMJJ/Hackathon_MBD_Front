import type { DocumentEntity } from "../../models";
import DocumentCard from "../templates/DocumentCard";

export function DocumentsSection({
  documents,
  onOpen,
}: {
  documents: DocumentEntity[];
  onOpen: (doc: DocumentEntity) => void;
}) {
  if (!documents.length) {
    return <p className="text-[#c8c8cc]">Aún no tienes documentos.</p>;
  }
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {documents.map((d) => (
        <DocumentCard key={d.id} doc={d} onOpen={onOpen} />
      ))}
    </section>
  );
}
