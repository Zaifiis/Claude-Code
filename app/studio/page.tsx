import { listIdeas } from "@/lib/studio/store";

import { StudioApp } from "./studio-app";
import { StudioProvider } from "./studio-store";

// The ideas file changes as you work, so this page is rendered per request and
// arrives with the full list already in the markup — opening it has no spinner.
export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const ideas = await listIdeas();

  return (
    <StudioProvider initialIdeas={ideas}>
      <StudioApp />
    </StudioProvider>
  );
}
