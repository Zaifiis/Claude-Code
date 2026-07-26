import { PageContainer, PageHeader } from "@/components/shell/page-header";
import { KanbanBoard } from "@/components/content/kanban-board";
import { QuickAddButton } from "@/components/shell/quick-actions";
import { EmptyState } from "@/components/ui/misc";
import { Kanban } from "lucide-react";
import { listContent } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default function PipelinePage() {
  const items = listContent({ archived: false });

  return (
    <PageContainer className="max-w-none">
      <PageHeader
        title="Content Pipeline"
        description="Drag cards across the workflow — the status updates automatically."
        actions={
          <QuickAddButton tab="idea" variant="primary" size="sm">
            New Content
          </QuickAddButton>
        }
      />
      {items.length === 0 ? (
        <EmptyState
          icon={<Kanban />}
          title="Your pipeline is empty."
          description="Add content and watch it move from idea to posted across the board."
          action={
            <QuickAddButton tab="idea" variant="primary">
              Add content
            </QuickAddButton>
          }
        />
      ) : (
        <KanbanBoard items={items} />
      )}
    </PageContainer>
  );
}
