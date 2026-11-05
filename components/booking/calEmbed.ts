/**
 * Cal.com's official embed, loaded on demand (no npm package needed: this is the same loader
 * Cal.com's own snippet and @calcom/embed-react use). It draws the booking calendar inside an
 * element we give it.
 */

type CalApi = ((...args: unknown[]) => void) & { q?: unknown[][] };
type CalGlobal = CalApi & { loaded?: boolean; ns: Record<string, CalApi> };

const SCRIPT = "https://app.cal.com/embed/embed.js";
const ORIGIN = "https://app.cal.com";

/** Cal.com's loader: queues calls until embed.js arrives, then embed.js replays them. */
function cal(): CalGlobal {
  const w = window as unknown as { Cal?: CalGlobal };
  if (!w.Cal) {
    const push = (api: CalApi, args: unknown) => (api.q as unknown[]).push(args);
    const Cal = function (...args: unknown[]) {
      const c = w.Cal as CalGlobal;
      if (!c.loaded) {
        c.ns = {};
        c.q = c.q || [];
        const s = document.createElement("script");
        s.src = SCRIPT;
        s.async = true;
        s.onerror = () => window.dispatchEvent(new Event("tyode:cal-failed"));
        document.head.appendChild(s);
        c.loaded = true;
      }
      if (args[0] === "init") {
        const api: CalApi = function (...a: unknown[]) {
          push(api, a);
        };
        const namespace = args[1];
        api.q = api.q || [];
        if (typeof namespace === "string") {
          c.ns[namespace] = c.ns[namespace] || api;
          push(c.ns[namespace], args);
          push(c, ["initNamespace", namespace]);
        } else push(c, args);
        return;
      }
      push(c, args);
    } as CalGlobal;
    Cal.ns = {};
    w.Cal = Cal;
  }
  return w.Cal;
}

type Options = {
  /** Cal.com username/event, e.g. "tyode-0vitvo/30min" */
  calLink: string;
  namespace: string;
  /** called once the calendar is showing */
  onReady: () => void;
  /** called if Cal.com's script couldn't load */
  onFail: () => void;
};

/** Draw the Cal.com booking calendar inside `el`. Call once per element. */
export function mountCal(el: HTMLElement, { calLink, namespace, onReady, onFail }: Options) {
  window.addEventListener("tyode:cal-failed", onFail, { once: true });
  const Cal = cal();
  Cal("init", namespace, { origin: ORIGIN });
  const api = Cal.ns[namespace];
  api("inline", {
    elementOrSelector: el,
    calLink,
    config: { layout: "month_view", useSlotsViewOnSmallScreen: "true", theme: "light" },
  });
  // Light theme in the site's colours: near-black accent, softer grey date tiles and finer
  // borders than Cal.com's defaults, so it sits quietly in the white panel
  api("ui", {
    theme: "light",
    hideEventTypeDetails: false,
    layout: "month_view",
    cssVarsPerTheme: {
      light: {
        "cal-brand": "#0c0c0d",
        "cal-brand-emphasis": "#2a2a2e",
        "cal-brand-text": "#ffffff",
        "cal-text-emphasis": "#0c0c0d",
        "cal-bg-emphasis": "#f1f1f3",
        "cal-bg-subtle": "#f6f6f7",
        "cal-border-booker": "#ececed",
        "cal-border-subtle": "#ececed",
        "cal-border": "#e2e2e4",
      },
      dark: { "cal-brand": "#ffffff" },
    },
  });
  api("on", { action: "linkReady", callback: onReady });
}
