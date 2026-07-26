import { PageContainer, PageHeader } from "@/components/shell/page-header";
import { LibraryView } from "@/components/content/library-view";
import { listContent } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default function LibraryPage() {
  const items = listContent({ archived: false, statuses: ["posted"] });
  return (
    <PageContainer>
      <PageHeader
        title="Content Library"
        description="Your published work and how it performed. Duplicate or repurpose what worked."
      />
      <LibraryView items={items} />
    </PageContainer>
  );
}
