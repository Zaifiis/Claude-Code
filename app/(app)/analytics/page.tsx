import { PageContainer, PageHeader } from "@/components/shell/page-header";
import { AnalyticsView } from "@/components/content/analytics-view";
import { getAnalytics } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  const data = getAnalytics();
  return (
    <PageContainer>
      <PageHeader
        title="Analytics"
        description="How your published content performs. Metrics are entered manually — built to plug into platform APIs later."
      />
      <AnalyticsView data={data} />
    </PageContainer>
  );
}
