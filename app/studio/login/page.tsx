import { studioPassword } from "@/lib/studio/auth";

import { signIn } from "./actions";

export const dynamic = "force-dynamic";

export default async function StudioLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const gated = studioPassword() !== null;

  return (
    <div className="st-root flex min-h-dvh items-center justify-center bg-st-canvas px-4 text-st-text">
      <main className="w-full max-w-[400px] rounded-st-sheet bg-st-surface p-8 shadow-st-card">
        <h1 className="st-title-2 text-st-text">Studio</h1>
        <p className="st-callout mt-2 text-st-text-2">
          {gated
            ? "Enter the password to get to your ideas."
            : "No password is set, so the studio is open."}
        </p>

        {gated ? (
          <form action={signIn} className="mt-8 flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="st-caption text-st-text-3">Password</span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                autoFocus
                required
                className="min-h-11 w-full rounded-st-control border border-transparent bg-st-fill px-3 st-body text-st-text outline-none transition-colors duration-[var(--st-dur-fast)] ease-st focus:border-st-accent focus:bg-st-surface focus-visible:outline-none"
              />
            </label>

            {error ? (
              <p role="alert" className="st-footnote text-st-pink">
                That password is not right.
              </p>
            ) : null}

            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-st-control bg-st-accent px-4 st-callout font-medium text-st-on-accent transition-colors duration-[var(--st-dur-fast)] ease-st hover:bg-st-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-st-accent"
            >
              Open Studio
            </button>
          </form>
        ) : (
          <a
            href="/studio"
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-st-control bg-st-accent px-4 st-callout font-medium text-st-on-accent"
          >
            Open Studio
          </a>
        )}
      </main>
    </div>
  );
}
