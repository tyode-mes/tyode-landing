import type { MouseEvent } from "react";

/**
 * Web3Forms access key: messages sent with the contact form are emailed to the address it was
 * created for. This key is meant to be public (it can only send to that one inbox).
 */
export const WEB3FORMS_KEY = "cff80172-c61e-466b-ad39-80a0802fe9ad";

const OPEN_EVENT = "tyode:open-contact";
let ready = false; // set while a ContactModal is on the page

/** Used by ContactModal: listen for open requests. Returns a function that stops listening. */
export function onOpenContact(open: () => void) {
  ready = true;
  window.addEventListener(OPEN_EVENT, open);
  return () => {
    ready = false;
    window.removeEventListener(OPEN_EVENT, open);
  };
}

/** Click handler for "Get in touch" links: opens the contact pop-up. */
export function openContact(e: MouseEvent<HTMLElement>) {
  if (!ready || e.defaultPrevented) return;
  e.preventDefault();
  window.dispatchEvent(new Event(OPEN_EVENT));
}
