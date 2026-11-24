"use client";

import { useActionState, useState } from "react";
import { signIn, type SignInState } from "./actions";
import s from "./signin.module.css";

export default function SignInForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {});
  const [user, setUser] = useState(state.username ?? "");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const ready = user.trim() !== "" && pass !== "" && !pending;

  return (
    <form action={action} className={s.form} noValidate>
      <label className={s.field}>
        <span className={s.label}>Username</span>
        <input name="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false}
          value={user} onChange={(e) => setUser(e.target.value)} aria-invalid={!!state.error || undefined} required />
      </label>
      <label className={s.field}>
        <span className={s.label}>Password</span>
        <input name="password" type={show ? "text" : "password"} autoComplete="current-password"
          value={pass} onChange={(e) => setPass(e.target.value)} aria-invalid={!!state.error || undefined} required />
        <button type="button" className={s.eye} onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />
            {show && <path d="M4 4l16 16" />}
          </svg>
        </button>
      </label>

      <p className={s.error} role="alert" aria-live="polite">{state.error ?? ""}</p>

      <button type="submit" className={s.submit} disabled={!ready} data-pending={pending || undefined}>
        <span>{pending ? "Checking…" : "Sign in"}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </button>
    </form>
  );
}
