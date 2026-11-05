"use client";

import { useEffect, useRef, useState } from "react";
import { BOOKING_URL, CAL_LINK, CAL_NAMESPACE, onOpenBooking } from "./booking";
import { mountCal } from "./calEmbed";
import styles from "./BookingModal.module.css";

/**
 * The booking pop-up: the team's Cal.com booking calendar in a panel over the site, so visitors
 * book a walkthrough without leaving. The calendar is Cal.com's official embed (calEmbed.ts).
 *
 * Opening (Apple-style): the page behind dims and blurs while the panel rises gently into
 * place and fades in; the calendar settles a beat after. Closing sinks it back down.
 *
 * The calendar gets the whole panel (Cal.com has its own header), with a round close button
 * floating just outside the panel's corner and a quiet "open in a new tab" link underneath.
 *
 * Uses the browser's own <dialog>: it sits above everything (even the nav), keeps keyboard
 * focus inside, and closes with Esc. Clicking outside the panel closes it too. Cal.com only
 * starts loading the first time the pop-up opens, and stays loaded after that so it reopens
 * instantly. If it can't load, the pop-up offers the booking page in a new tab instead.
 */
export default function BookingModal() {
  const ref = useRef<HTMLDialogElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const calRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    const open = () => {
      if (dialog.open) return;
      // first open: start loading the calendar (later opens reuse it)
      if (!mounted.current && calRef.current) {
        mounted.current = true;
        const giveUp = window.setTimeout(() => setFailed(true), 15000);
        mountCal(calRef.current, {
          calLink: CAL_LINK,
          namespace: CAL_NAMESPACE,
          onReady: () => {
            window.clearTimeout(giveUp);
            setLoaded(true);
          },
          onFail: () => {
            window.clearTimeout(giveUp);
            setFailed(true);
          },
        });
      }
      setClosing(false);
      document.documentElement.style.overflow = "hidden"; // no scrolling the page behind
      dialog.showModal();
    };
    const stop = onOpenBooking(open);

    // The hero turns the mouse wheel into its own smooth scrolling: don't let wheel turns over
    // the pop-up reach it
    const stopWheel = (e: WheelEvent) => e.stopPropagation();
    dialog.addEventListener("wheel", stopWheel);

    const onClose = () => {
      document.documentElement.style.overflow = "";
      setClosing(false);
    };
    dialog.addEventListener("close", onClose);

    return () => {
      stop();
      dialog.removeEventListener("wheel", stopWheel);
      dialog.removeEventListener("close", onClose);
      document.documentElement.style.overflow = "";
    };
  }, []);

  // closing plays the sink-and-fade first (instantly with reduced motion)
  const close = () => {
    const dialog = ref.current;
    if (!dialog?.open) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) dialog.close();
    else setClosing(true);
  };

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      data-closing={closing || undefined}
      aria-label="Book a walkthrough"
      onCancel={(e) => {
        e.preventDefault(); // Esc: close with the animation
        close();
      }}
      onClick={(e) => {
        // a click on the backdrop, outside the panel and its controls
        if (e.target === e.currentTarget || e.target === stackRef.current) close();
      }}
    >
      {/* the panel with a close button floating at its corner and a quiet link underneath */}
      <div
        ref={stackRef}
        className={styles.stack}
        onAnimationEnd={(e) => {
          if (closing && e.target === e.currentTarget) ref.current?.close();
        }}
      >
        {/* focus lands here when the pop-up opens */}
        <button type="button" className={styles.close} onClick={close} aria-label="Close" autoFocus>
          <span aria-hidden="true" />
        </button>

        <div className={styles.panel}>
          <div className={styles.body} data-loaded={loaded || undefined} data-failed={(failed && !loaded) || undefined}>
            {/* shimmering placeholder in the shape of a booking page, until the real one loads */}
            <div className={styles.skeleton} aria-hidden="true">
              <div className={styles.skSide}>
                <i className={styles.skAvatar} />
                <i style={{ width: "40%" }} />
                <i className={styles.skBig} style={{ width: "75%" }} />
                <i style={{ width: "30%" }} />
                <i style={{ width: "55%" }} />
              </div>
              <div className={styles.skMain}>
                <i className={styles.skBig} style={{ width: "40%" }} />
                <div className={styles.skGrid}>
                  {Array.from({ length: 35 }, (_, i) => (
                    <b key={i} />
                  ))}
                </div>
              </div>
            </div>
            {/* Cal.com draws the calendar in here */}
            <div ref={calRef} className={styles.cal} />
            {failed && !loaded && (
              <div className={styles.failed}>
                <p>The calendar couldn&apos;t load here.</p>
                <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                  Open the booking page <span aria-hidden="true">↗</span>
                </a>
              </div>
            )}
          </div>
        </div>

        <a className={styles.newTab} href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
          Prefer a full page? Open in a new tab <span aria-hidden="true">↗</span>
        </a>
      </div>
    </dialog>
  );
}
