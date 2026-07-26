import { PageContainer, PageHeader } from "@/components/shell/page-header";
import { CalendarView } from "@/components/content/calendar-view";
import { QuickAddButton } from "@/components/shell/quick-actions";
import { listContent } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default function CalendarPage() {
  const items = listContent({ archived: false }).filter((c) => c.scheduled_at || c.published_at);

  return (
    <PageContainer>
      <PageHeader
        title="Calendar"
        description="Everything scheduled and posted, on the dates it lands. Drag to reschedule."
        actions={
          <QuickAddButton tab="schedule" variant="primary" size="sm">
            Schedule Content
          </QuickAddButton>
        }
      />
      <CalendarView items={items} />
    </PageContainer>
  );
}
