import { PageContainer, PageHeader } from "@/components/shell/page-header";
import { IdeasView } from "@/components/content/ideas-view";
import { QuickAddButton } from "@/components/shell/quick-actions";
import { listContent, listTags } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; age?: string }>;
}) {
  const sp = await searchParams;
  const items = listContent({ archived: false });
  const tags = listTags();

  return (
    <PageContainer>
      <PageHeader
        title="Ideas"
        description="Every piece of content you're working on, in one searchable library."
        actions={
          <QuickAddButton tab="idea" variant="primary" size="sm">
            New Idea
          </QuickAddButton>
        }
      />
      <IdeasView items={items} allTags={tags} initialStatus={sp.status} initialAge={sp.age} />
    </PageContainer>
  );
}
