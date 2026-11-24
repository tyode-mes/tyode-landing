/* Client sign-in for private editions of Tyode (/demo/sign-in -> /demo/client). Server code only.

   Accounts come from environment variables, so no database is needed and no password is ever in the code:
     TYODE_CLIENTS          username:password:Display name, several separated by ";"
                            e.g. yokohama:a-long-password:Yokohama TWS Lanka
     TYODE_SESSION_SECRET   any long random string, used to sign the session cookie

   The session is a signed cookie (HMAC-SHA256) that lasts 8 hours and only travels to /demo. */

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "tyode_client";
export const SESSION_HOURS = 8;

export type Client = { username: string; name: string };
type Account = Client & { password: string };

function accounts(): Account[] {
  return (process.env.TYODE_CLIENTS ?? "")
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [username = "", password = "", ...name] = entry.split(":");
      return { username: username.trim().toLowerCase(), password, name: name.join(":").trim() || username.trim() };
    })
    .filter((a) => a.username && a.password);
}

export const signInConfigured = () => accounts().length > 0 && (process.env.TYODE_SESSION_SECRET ?? "").length >= 16;

const sameText = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

const sign = (payload: string) =>
  createHmac("sha256", process.env.TYODE_SESSION_SECRET ?? "").update(payload).digest("base64url");

/** The matching account, or null. Every account is compared, so timing doesn't reveal which usernames exist. */
export function checkDetails(username: string, password: string): Client | null {
  const user = username.trim().toLowerCase();
  let found: Account | null = null;
  for (const a of accounts()) {
    const userOk = sameText(a.username, user);
    const passOk = sameText(a.password, password);
    if (userOk && passOk) found = a;
  }
  return found ? { username: found.username, name: found.name } : null;
}

/** Cookie value for a signed-in client: username.expiry.signature */
export function sessionValue(client: Client): string {
  const payload = `${client.username}.${Date.now() + SESSION_HOURS * 3600 * 1000}`;
  return `${payload}.${sign(payload)}`;
}

/** The signed-in client from the session cookie, or null if there is none or it is invalid or expired. */
export async function currentClient(): Promise<Client | null> {
  if (!signInConfigured()) return null;
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [username, expires, signature] = parts;
  if (!sameText(signature, sign(`${username}.${expires}`))) return null;
  if (!(Number(expires) > Date.now())) return null;
  const account = accounts().find((a) => a.username === username);
  return account ? { username: account.username, name: account.name } : null;
}
