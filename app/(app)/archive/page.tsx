import { PageContainer, PageHeader } from "@/components/shell/page-header";
import { ContentCard } from "@/components/content/content-card";
import { ReferenceCard } from "@/components/references/reference-card";
import { SectionTitle, EmptyState } from "@/components/ui/misc";
import { Archive } from "lucide-react";
import { listContent, listReferences, listTags } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default function ArchivePage() {
  const content = listContent({ archived: true });
  const references = listReferences({ archived: true });
  const tags = listTags();
  const empty = content.length === 0 && references.length === 0;

  return (
    <PageContainer>
      <PageHeader
        title="Archive"
        description="Nothing is ever really lost. Restore anything, any time."
      />
      {empty ? (
        <EmptyState
          icon={<Archive />}
          title="The archive is empty."
          description="Archived content and references land here so your active workspace stays focused."
        />
      ) : (
        <div className="space-y-8">
          {content.length > 0 && (
            <section>
              <SectionTitle>Archived content ({content.length})</SectionTitle>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {content.map((c) => (
                  <ContentCard key={c.id} content={c} />
                ))}
              </div>
            </section>
          )}
          {references.length > 0 && (
            <section>
              <SectionTitle>Archived references ({references.length})</SectionTitle>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {references.map((r) => (
                  <ReferenceCard key={r.id} reference={r} allTags={tags} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </PageContainer>
  );
}
