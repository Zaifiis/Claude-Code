import { PageContainer, PageHeader } from "@/components/shell/page-header";
import { ScriptsView } from "@/components/content/scripts-view";
import { QuickAddButton } from "@/components/shell/quick-actions";
import { listContent } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default function ScriptsPage() {
  // Anything being written or already scripted, plus items already carrying a script.
  const items = listContent({ archived: false }).filter(
    (c) => c.script.trim().length > 0 || ["scripting", "research", "idea"].includes(c.status),
  );
  return (
    <PageContainer className="max-w-[1000px]">
      <PageHeader
        title="Scripts"
        description="Write and refine every script in one comfortable place."
        actions={
          <QuickAddButton tab="script" variant="primary" size="sm">
            New Script
          </QuickAddButton>
        }
      />
      <ScriptsView items={items} />
    </PageContainer>
  );
}
