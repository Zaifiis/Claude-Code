import { PageContainer, PageHeader } from "@/components/shell/page-header";
import { InboxCapture } from "@/components/references/inbox-capture";
import { ReferenceCard } from "@/components/references/reference-card";
import { ContentCard } from "@/components/content/content-card";
import { SectionTitle } from "@/components/ui/misc";
import { EmptyState } from "@/components/ui/misc";
import { Inbox } from "lucide-react";
import { listReferences, listContent, listTags } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default function InboxPage() {
  const tags = listTags();
  // Unfiled references = not yet used in any content, newest first
  const references = listReferences({ archived: false }).filter((r) => r.usedCount === 0);
  const capturedIdeas = listContent({ archived: false, statuses: ["inbox"] });

  const empty = references.length === 0 && capturedIdeas.length === 0;

  return (
    <PageContainer className="max-w-[1000px]">
      <PageHeader
        title="Inbox"
        description="Your external memory. Capture anything in seconds — organise it later."
      />
      <InboxCapture />

      {empty ? (
        <div className="mt-6">
          <EmptyState
            icon={<Inbox />}
            title="Your inbox is clear."
            description="Paste a link or jot an idea above. Everything unfiled lands here until you turn it into content."
          />
        </div>
      ) : (
        <div className="mt-7 space-y-7">
          {capturedIdeas.length > 0 && (
            <section>
              <SectionTitle>Captured ideas</SectionTitle>
              <div className="space-y-2">
                {capturedIdeas.map((c) => (
                  <ContentCard key={c.id} content={c} variant="compact" />
                ))}
              </div>
            </section>
          )}

          {references.length > 0 && (
            <section>
              <SectionTitle>Unfiled references ({references.length})</SectionTitle>
              <div className="space-y-2">
                {references.map((r) => (
                  <ReferenceCard key={r.id} reference={r} allTags={tags} variant="list" />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </PageContainer>
  );
}
