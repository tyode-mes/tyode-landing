/* Unified AAA Lenis-grade inertia scroll engine & layout cache.
   - True butter glide-to-stop on mouse wheel (~1.1s velvet deceleration, zero instant stop)
   - Silky weighted feathering on precision touchpads
   - Immune to Chrome async scroll snap-backs, Windows DPI scaling, and wrapper overflow false positives
   - Frame-rate independent (60Hz / 120Hz / 144Hz+) and 0% CPU when idle */

export type ScrollState = {
  /** Current smoothed scroll position in px (sub-pixel accurate) */
  y: number;
  /** Target scroll position in px */
  targetY: number;
  /** Instantaneous velocity in px/sec */
  velocity: number;
  /** Normalized page progress 0..1 */
  progress: number;
  /** Viewport height in px */
  vh: number;
  /** Maximum scrollable Y in px */
  maxScroll: number;
  /** Smoothly damped scroll activity 0..1 */
  wheelImpulse: number;
};

type ScrollListener = (state: ScrollState) => void;
type ResizeListener = () => void;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function createScrollBus() {
  const listeners = new Set<ScrollListener>();
  const resizeListeners = new Set<ResizeListener>();

  const state: ScrollState = {
    y: 0,
    targetY: 0,
    velocity: 0,
    progress: 0,
    vh: 1,
    maxScroll: 1,
    wheelImpulse: 0,
  };

  let initialized = false;
  let raf = 0;
  let lastNow = 0;
  let resizeRaf = 0;

  // 2-stage S-curve state (velvet launch + long luxury glide-to-stop, zero frame-1 jerk)
  let chaseY = 0;

  // Device detection: defaults to luxury mouse glide; only softens to touchpad mode
  // after clear multi-event precision-trackpad proof (never flips back to instant stop)
  let inputMode: "mouse" | "touchpad" = "mouse";
  let lastWheelTime = 0;
  let tinyStreak = 0;
  let spinStreak = 0;

  // Touch & keyboard guards
  let isTouchActive = false;

  // Programmatic glide state (anchor links & stage buttons)
  let animActive = false;
  let animFrom = 0;
  let animTo = 0;
  let animStart = 0;
  let animDur = 1100;

  const measureDoc = () => {
    if (typeof window === "undefined") return;
    state.vh = window.innerHeight || 1;
    state.maxScroll = Math.max(0, document.documentElement.scrollHeight - state.vh);
    state.targetY = clamp(state.targetY, 0, state.maxScroll);
    chaseY = clamp(chaseY, 0, state.maxScroll);
    state.y = clamp(state.y, 0, state.maxScroll);
    state.progress = state.maxScroll > 0 ? clamp(state.y / state.maxScroll, 0, 1) : 0;
  };

  const emit = () => {
    listeners.forEach((fn) => fn(state));
  };

  const scheduleResize = () => {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;
      measureDoc();
      resizeListeners.forEach((fn) => fn());
      emit();
    });
  };

  const wake = () => {
    if (raf || typeof window === "undefined") return;
    lastNow = performance.now();
    raf = requestAnimationFrame(tick);
  };

  // Only yield to genuine inner scrollable panels/modals — NEVER full-page wrappers with overflow-x:hidden
  const isInnerScrollable = (el: HTMLElement | null, deltaY: number): boolean => {
    let node = el;
    while (node && node !== document.body && node !== document.documentElement) {
      if (node.hasAttribute("data-scroll-lock") || node.hasAttribute("data-lenis-prevent")) {
        return true;
      }
      if (node.getAttribute("role") === "dialog" || node.getAttribute("aria-modal") === "true") {
        return true;
      }
      const tag = node.tagName;
      if (tag !== "MAIN" && tag !== "SECTION" && node.clientHeight > 0 && node.clientHeight < state.vh * 0.94) {
        const oy = window.getComputedStyle(node).overflowY;
        if ((oy === "auto" || oy === "scroll") && node.scrollHeight > node.clientHeight + 4) {
          if (deltaY > 0 && node.scrollTop + node.clientHeight < node.scrollHeight - 2) return true;
          if (deltaY < 0 && node.scrollTop > 2) return true;
        }
      }
      node = node.parentElement;
    }
    return false;
  };

  /* stop any glide in progress and take the page's real position as ours */
  const haltGlide = () => {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    animActive = false;
    state.y = chaseY = state.targetY = window.scrollY;
    state.velocity = 0;
  };

  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey) return; // keep browser pinch-to-zoom
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.5 && Math.abs(e.deltaY) < 4) return;
    if (isInnerScrollable(e.target as HTMLElement | null, e.deltaY)) {
      // Something else is handling this wheel (an inner panel, or the hero's own pinned scrolling).
      // Stop our glide on the spot so the two never pull the page in different directions.
      haltGlide();
      return;
    }

    e.preventDefault();
    animActive = false;
    // Starting fresh (nothing gliding): begin from where the page really is. Something else (the hero's own
    // scrolling, the scrollbar, the keyboard) may have moved it since we last looked.
    if (!raf) state.y = chaseY = state.targetY = window.scrollY;

    // Keep maxScroll fresh if dynamic content grew
    const liveMax = Math.max(0, document.documentElement.scrollHeight - state.vh);
    if (Math.abs(liveMax - state.maxScroll) > 2) state.maxScroll = liveMax;

    const now = performance.now();
    const gap = now - lastWheelTime;
    lastWheelTime = now;

    let rawDelta = e.deltaY;
    if (e.deltaMode === 1) rawDelta *= 36;
    else if (e.deltaMode === 2) rawDelta *= state.vh * 0.85;

    const absD = Math.abs(rawDelta);

    // Require clear multi-frame proof before entering touchpad mode
    const isTinyFluid = e.deltaMode === 0 && (Math.abs(e.deltaX) > 0 || (absD < 26 && gap < 28));
    if (isTinyFluid) {
      tinyStreak = Math.min(tinyStreak + 1, 10);
      if (tinyStreak >= 3 || Math.abs(e.deltaX) > 0) {
        inputMode = "touchpad";
      }
    } else if (e.deltaMode !== 0 || absD >= 36) {
      tinyStreak = 0;
      inputMode = "mouse";
    }

    if (inputMode === "mouse") {
      // Normalize single notch across Windows 100%/125%/150% DPI & mice
      const sign = Math.sign(rawDelta);
      const notches = clamp(absD / 100, 0.8, 2.5);
      if (gap < 150) spinStreak = Math.min(spinStreak + 1, 8);
      else spinStreak = 0;

      // Rich travel + smooth spin acceleration when flicking the wheel multiple notches
      const spinBoost = 1 + spinStreak * 0.085;
      const step = sign * notches * 145 * spinBoost;
      state.targetY = clamp(state.targetY + step, 0, state.maxScroll);
    } else {
      spinStreak = 0;
      const clamped = clamp(rawDelta, -220, 220);
      state.targetY = clamp(state.targetY + clamped * 1.06, 0, state.maxScroll);
    }

    wake();
  };

  const onNativeScroll = () => {
    const nativeY = window.scrollY;

    // While our inertia loop is running, ignore async echoes of our own window.scrollTo()
    // Only yield if touch is active OR the user jumped far via scrollbar drag / Home / End
    if (raf) {
      if (!isTouchActive && Math.abs(nativeY - state.y) < 120) {
        return;
      }
      cancelAnimationFrame(raf);
      raf = 0;
    }

    animActive = false;
    state.y = nativeY;
    chaseY = nativeY;
    state.targetY = nativeY;
    state.velocity = 0;
    state.progress = state.maxScroll > 0 ? clamp(state.y / state.maxScroll, 0, 1) : 0;
    emit();
  };

  const onTouchStart = () => {
    isTouchActive = true;
    animActive = false;
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    state.y = chaseY = state.targetY = window.scrollY;
    state.velocity = 0;
  };

  const onTouchEnd = () => {
    isTouchActive = false;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const k = e.key;
    if (
      k === "ArrowDown" ||
      k === "ArrowUp" ||
      k === "PageDown" ||
      k === "PageUp" ||
      k === "Home" ||
      k === "End" ||
      k === " "
    ) {
      animActive = false;
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      state.targetY = chaseY = state.y = window.scrollY;
    }
  };

  const onAnchorClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const target = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
    if (!target) return;
    const hash = target.getAttribute("href");
    if (!hash || hash === "#") return;
    const dest = hash === "#top" ? document.body : document.querySelector<HTMLElement>(hash);
    if (!dest) return;

    e.preventDefault();
    const top = hash === "#top" ? 0 : dest.getBoundingClientRect().top + window.scrollY;
    scrollTo(top, { duration: 1.15 });
    if (window.location.hash !== hash) {
      history.pushState(null, "", hash);
    }
  };

  const tick = (now: number) => {
    const dt = clamp((now - lastNow) / 1000, 0.001, 0.05);
    lastNow = now;

    const prevY = state.y;

    if (animActive) {
      const t = clamp((now - animStart) / animDur, 0, 1);
      // Luxury expo-quart ease: smooth launch, long silky landing
      const ease = t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
      state.y = animFrom + (animTo - animFrom) * ease;
      chaseY = state.y;
      state.targetY = state.y;
      if (t >= 1) {
        state.y = chaseY = state.targetY = animTo;
        animActive = false;
      }
    } else if (inputMode === "mouse") {
      // True AAA Lenis-grade butter glide:
      // chaseY smooths out frame-1 notch harshness; state.y glides smoothly for ~1.1s to a feather stop
      chaseY += (state.targetY - chaseY) * (1 - Math.exp(-14 * dt));
      state.y += (chaseY - state.y) * (1 - Math.exp(-3.6 * dt));
    } else {
      // Touchpad: silky luxury feathering (never instant stop)
      chaseY += (state.targetY - chaseY) * (1 - Math.exp(-22 * dt));
      state.y += (chaseY - state.y) * (1 - Math.exp(-7.2 * dt));
    }

    state.velocity = (state.y - prevY) / dt;
    const targetImpulse = clamp(Math.abs(state.velocity) / 2400, 0, 1);
    state.wheelImpulse += (targetImpulse - state.wheelImpulse) * (1 - Math.exp(-6 * dt));
    if (state.wheelImpulse < 0.001) state.wheelImpulse = 0;

    state.progress = state.maxScroll > 0 ? clamp(state.y / state.maxScroll, 0, 1) : 0;

    window.scrollTo({ top: state.y, behavior: "instant" as ScrollBehavior });
    emit();

    const settled =
      !animActive &&
      Math.abs(state.targetY - state.y) < 0.12 &&
      Math.abs(chaseY - state.y) < 0.12 &&
      Math.abs(state.velocity) < 0.8 &&
      state.wheelImpulse < 0.001;

    if (settled) {
      state.y = chaseY = state.targetY;
      state.velocity = 0;
      state.wheelImpulse = 0;
      window.scrollTo({ top: state.y, behavior: "instant" as ScrollBehavior });
      emit();
      raf = 0;
    } else {
      raf = requestAnimationFrame(tick);
    }
  };

  const ensureInit = () => {
    if (initialized || typeof window === "undefined") return;
    initialized = true;

    // Ensure CSS smooth scrolling never fights the JS inertia loop
    document.documentElement.style.scrollBehavior = "auto";
    if (document.body) document.body.style.scrollBehavior = "auto";

    state.y = chaseY = state.targetY = window.scrollY;
    measureDoc();

    // Capture phase guarantees wheel events reach scrollBus first
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("scroll", onNativeScroll, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKeyDown, { passive: true });
    window.addEventListener("resize", scheduleResize, { passive: true });
    document.addEventListener("click", onAnchorClick);

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(scheduleResize);
      ro.observe(document.documentElement);
    }
  };

  const scrollTo = (target: number | HTMLElement, opts?: { duration?: number; immediate?: boolean }) => {
    ensureInit();
    measureDoc();
    const rawY =
      typeof target === "number" ? target : target.getBoundingClientRect().top + window.scrollY;
    const destY = clamp(rawY, 0, state.maxScroll);

    if (opts?.immediate) {
      animActive = false;
      state.y = chaseY = state.targetY = destY;
      state.velocity = 0;
      state.progress = state.maxScroll > 0 ? clamp(state.y / state.maxScroll, 0, 1) : 0;
      window.scrollTo({ top: destY, behavior: "instant" as ScrollBehavior });
      emit();
      return;
    }

    animActive = true;
    animFrom = state.y;
    animTo = destY;
    animStart = performance.now();
    animDur = Math.max(250, (opts?.duration ?? 1.1) * 1000);
    wake();
  };

  return {
    getState(): ScrollState {
      ensureInit();
      return state;
    },
    subscribe(fn: ScrollListener): () => void {
      ensureInit();
      listeners.add(fn);
      fn(state);
      return () => {
        listeners.delete(fn);
      };
    },
    onResize(fn: ResizeListener): () => void {
      ensureInit();
      resizeListeners.add(fn);
      return () => {
        resizeListeners.delete(fn);
      };
    },
    refresh() {
      ensureInit();
      scheduleResize();
    },
    scrollTo,
  };
}

export const scrollBus = createScrollBus();