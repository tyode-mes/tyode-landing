import type { MouseEvent } from "react";

/** The team's Cal.com event ("username/event"). Every "Book a walkthrough" button opens it. */
export const CAL_LINK = "tyode-0vitvo/30min";
/** Cal.com embed namespace (any short name; matches the code Cal.com generated) */
export const CAL_NAMESPACE = "30min";
/** The same booking page as a normal link: new tabs, Ctrl/⌘-click, and before scripts load */
export const BOOKING_URL = `https://cal.com/${CAL_LINK}`;

const OPEN_EVENT = "tyode:open-booking";
let ready = false; // set while a BookingModal is on the page

/** Used by BookingModal: listen for open requests. Returns a function that stops listening. */
export function onOpenBooking(open: () => void) {
  ready = true;
  window.addEventListener(OPEN_EVENT, open);
  return () => {
    ready = false;
    window.removeEventListener(OPEN_EVENT, open);
  };
}

/**
 * Click handler for a link to BOOKING_URL: opens the booking pop-up instead of leaving the
 * page. Ctrl/⌘/Shift/middle-click (and pages without
 * the pop-up) keep the normal link behaviour, so the link always works.
 */
export function openBooking(e: MouseEvent<HTMLAnchorElement>) {
  if (!ready || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  window.dispatchEvent(new Event(OPEN_EVENT));
}
