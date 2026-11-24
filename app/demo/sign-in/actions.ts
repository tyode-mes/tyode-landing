"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_HOURS, checkDetails, sessionValue, signInConfigured } from "@/lib/clientSession";

export type SignInState = { error?: string; username?: string };

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/demo",
};

export async function signIn(_prev: SignInState, form: FormData): Promise<SignInState> {
  const username = String(form.get("username") ?? "").slice(0, 120);
  const password = String(form.get("password") ?? "").slice(0, 200);

  if (!signInConfigured()) {
    return { username, error: "Client sign-in isn't switched on yet. Please write to the Tyode team." };
  }
  const client = username && password ? checkDetails(username, password) : null;
  if (!client) {
    // a short, fixed pause makes guessing passwords slow
    await new Promise((r) => setTimeout(r, 700));
    return { username, error: "Those details don't match. Check them and try again." };
  }

  (await cookies()).set(SESSION_COOKIE, sessionValue(client), { ...cookieOptions, maxAge: SESSION_HOURS * 3600 });
  redirect("/demo/client");
}

export async function signOut() {
  (await cookies()).set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  redirect("/demo/sign-in");
}
