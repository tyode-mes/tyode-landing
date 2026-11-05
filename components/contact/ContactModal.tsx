"use client";

import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { BOOKING_URL, openBooking } from "@/components/booking/booking";
import { WEB3FORMS_KEY, onOpenContact } from "./contact";
import styles from "./ContactModal.module.css";

type Status = "idle" | "sending" | "sent" | "error";

/**
 * The "Get in touch" pop-up: a short contact form in a panel over the site, matching the
 * booking pop-up (same frosted backdrop, Apple-style rise, floating close button). Messages are
 * sent through Web3Forms, which emails them to the team.
 *
 * States: the form → sending (button shows a spinner) → a thank-you screen with a drawn tick;
 * if sending fails, the form stays filled in with a note to try again.
 */
export default function ContactModal() {
  const ref = useRef<HTMLDialogElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [closing, setClosing] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [sentTo, setSentTo] = useState({ name: "", email: "" });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const open = () => {
      if (dialog.open) return;
      setClosing(false);
      document.documentElement.style.overflow = "hidden";
      dialog.showModal();
    };
    const stop = onOpenContact(open);
    // keep wheel turns over the pop-up away from the hero's own smooth scrolling
    const stopWheel = (e: WheelEvent) => e.stopPropagation();
    dialog.addEventListener("wheel", stopWheel);
    const onClose = () => {
      document.documentElement.style.overflow = "";
      setClosing(false);
      // after a message was sent, the next visit starts with a fresh form
      setStatus((s) => {
        if (s === "sent") formRef.current?.reset();
        return s === "sent" || s === "error" ? "idle" : s;
      });
    };
    dialog.addEventListener("close", onClose);
    return () => {
      stop();
      dialog.removeEventListener("wheel", stopWheel);
      dialog.removeEventListener("close", onClose);
      document.documentElement.style.overflow = "";
    };
  }, []);

  const close = () => {
    const dialog = ref.current;
    if (!dialog?.open) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) dialog.close();
    else setClosing(true);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending") return;
    const form = e.currentTarget;
    const data = new FormData(form);
    data.append("access_key", WEB3FORMS_KEY);
    data.append("subject", `New enquiry from the Tyode website: ${data.get("name")}`);
    data.append("from_name", "Tyode website");
    setStatus("sending");
    try {
      const res = await fetch("https://api.web3forms.com/submit", { method: "POST", body: data });
      const json = (await res.json()) as { success?: boolean };
      if (!json.success) throw new Error("not sent");
      setSentTo({ name: String(data.get("name") ?? "").split(" ")[0], email: String(data.get("email") ?? "") });
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  // "Book a walkthrough" from inside the form: swap straight to the booking pop-up
  const toBooking = (e: MouseEvent<HTMLAnchorElement>) => {
    ref.current?.close();
    openBooking(e);
  };

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      data-closing={closing || undefined}
      aria-label="Get in touch"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget || e.target === stackRef.current) close();
      }}
    >
      <div
        ref={stackRef}
        className={styles.stack}
        onAnimationEnd={(e) => {
          if (closing && e.target === e.currentTarget) ref.current?.close();
        }}
      >
        <button type="button" className={styles.close} onClick={close} aria-label="Close">
          <span aria-hidden="true" />
        </button>

        <div className={styles.panel} data-sent={status === "sent" || undefined}>
          {/* ---------- the form ---------- */}
          <form ref={formRef} className={styles.form} onSubmit={onSubmit} aria-hidden={status === "sent" || undefined}>
            <header className={styles.head}>
              <p className={styles.kicker}>Get in touch</p>
              <h2 className={styles.title}>
                Let&apos;s talk about <span>your plant.</span>
              </h2>
              <p className={styles.lede}>Questions, a pilot, or just curious? Leave a note and we&apos;ll reply by email.</p>
            </header>

            <div className={styles.row}>
              <label className={styles.field}>
                <span>Name</span>
                <input name="name" type="text" autoComplete="name" required placeholder="Your name" autoFocus />
              </label>
              <label className={styles.field}>
                <span>
                  Company <em>optional</em>
                </span>
                <input name="company" type="text" autoComplete="organization" placeholder="Where you work" />
              </label>
            </div>
            <label className={styles.field}>
              <span>Email</span>
              <input name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
            </label>
            <label className={styles.field}>
              <span>Message</span>
              <textarea name="message" required rows={4} placeholder="How can we help?" />
            </label>

            {/* Web3Forms spam trap: hidden from people, bots fill it in */}
            <input type="checkbox" name="botcheck" className={styles.trap} tabIndex={-1} autoComplete="off" />

            <button type="submit" className={styles.send} disabled={status === "sending"}>
              {status === "sending" ? (
                <>
                  <i className={styles.spinner} aria-hidden="true" /> Sending…
                </>
              ) : (
                <>
                  Send message <span aria-hidden="true">→</span>
                </>
              )}
            </button>

            <p className={styles.note} role="status">
              {status === "error" ? (
                <span className={styles.error}>Couldn&apos;t send just now. Please check your connection and try again.</span>
              ) : (
                <>
                  Rather talk it through?{" "}
                  <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" onClick={toBooking}>
                    Book a walkthrough
                  </a>
                </>
              )}
            </p>
          </form>

          {/* ---------- thank-you ---------- */}
          {status === "sent" && (
            <div className={styles.done} role="status">
              <svg className={styles.tick} viewBox="0 0 52 52" aria-hidden="true">
                <circle cx="26" cy="26" r="24" pathLength={1} />
                <path d="M15 27l7 7 15-16" pathLength={1} />
              </svg>
              <h2 className={styles.title}>Message sent.</h2>
              <p className={styles.lede}>
                Thanks{sentTo.name ? `, ${sentTo.name}` : ""}. We&apos;ll get back to you at <b>{sentTo.email}</b>.
              </p>
              <button type="button" className={styles.send} onClick={close}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
