import { signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 p-8">
        <h1 className="text-lg font-semibold text-neutral-100">Content Automation</h1>
        <p className="mt-1 text-sm text-neutral-400">Sign in to manage your posting pipeline.</p>

        <form action={signIn} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400">Email</label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400">Password</label>
            <input
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
            />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            className="w-full rounded-md bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-white"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-xs text-neutral-500">
          Users are created in the Supabase dashboard under Authentication. There is no
          public sign-up form on purpose — this is a single-operator tool.
        </p>
      </div>
    </div>
  );
}
