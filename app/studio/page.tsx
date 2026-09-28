import { readAll } from "@/lib/studio/store";

import { StudioApp } from "./studio-app";
import { StudioProvider } from "./studio-store";

// The data changes as you work, so this page is rendered per request and
// arrives with everything already in the markup — opening it has no spinner.
export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const { ideas, todos } = await readAll();

  return (
    <StudioProvider initialIdeas={ideas} initialTodos={todos}>
      <StudioApp />
    </StudioProvider>
  );
}
