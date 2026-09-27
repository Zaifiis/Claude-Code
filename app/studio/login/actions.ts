"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createSession, passwordMatches, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/studio/auth";

export async function signIn(formData: FormData) {
  const attempt = String(formData.get("password") ?? "");

  if (!(await passwordMatches(attempt))) {
    redirect("/studio/login?error=1");
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, await createSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect("/studio");
}
