import { PageContainer, PageHeader } from "@/components/shell/page-header";
import { ReferencesView } from "@/components/references/references-view";
import { QuickAddButton } from "@/components/shell/quick-actions";
import { listReferences, listTags } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function ReferencesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; used?: string }>;
}) {
  const sp = await searchParams;
  const references = listReferences({ archived: false });
  const tags = listTags();

  return (
    <PageContainer>
      <PageHeader
        title="References"
        description="A visual library of everything worth stealing inspiration from."
        actions={
          <QuickAddButton tab="reference" variant="primary" size="sm">
            Save Reference
          </QuickAddButton>
        }
      />
      <ReferencesView references={references} allTags={tags} initialQuery={sp.q} initialUsed={sp.used} />
    </PageContainer>
  );
}
