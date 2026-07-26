import Link from "next/link";
import { PageContainer } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <PageContainer>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <span className="mb-4 flex size-12 items-center justify-center rounded-full border border-border bg-surface text-muted">
          <Compass className="size-5" />
        </span>
        <h1 className="text-[20px] font-semibold text-fg">We couldn&apos;t find that.</h1>
        <p className="mt-1 max-w-sm text-[13.5px] text-muted">
          The content you&apos;re looking for may have been deleted or never existed.
        </p>
        <Link href="/" className="mt-5">
          <Button variant="primary">Back to dashboard</Button>
        </Link>
      </div>
    </PageContainer>
  );
}
