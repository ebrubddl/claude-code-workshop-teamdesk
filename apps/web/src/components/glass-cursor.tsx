import { useEffect } from "react";

const INTERACTIVE =
  "a[href],button,select,summary,label[for],[role='button'],[role='tab'],input[type='checkbox'],input[type='radio'],input[type='button'],input[type='submit']";
const TEXT_FIELD =
  "input:not([type='checkbox'],[type='radio'],[type='button'],[type='submit'],[type='range']),textarea,[contenteditable='true']";

type CursorState = "default" | "link" | "text";

/** How far the lens trails the pointer: 1 is no lag, lower is floatier. */
const FOLLOW = 0.2;
const MAX_STRETCH = 0.55;

function stateFor(target: EventTarget | null): CursorState {
  if (!(target instanceof Element)) {
    return "default";
  }
  if (target.closest(TEXT_FIELD)) {
    return "text";
  }
  const interactive = target.closest(INTERACTIVE);
  if (interactive && !interactive.matches(":disabled")) {
    return "link";
  }
  return "default";
}

/**
 * A glass droplet in place of the arrow. The dot is the real pointer position;
 * the lens trails it and stretches along the direction of travel. It swells
 * over links and buttons, becomes a text bar over fields and squishes on
 * press. Touch devices keep their normal behaviour, and the system cursor
 * stays until this has mounted.
 */
export default function GlassCursor() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".glass-cursor");
    const lens = root?.querySelector<HTMLElement>(".glass-cursor-lens");
    const dot = root?.querySelector<HTMLElement>(".glass-cursor-dot");
    if (!(root && lens && dot)) {
      return;
    }
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const target = { x: -100, y: -100 };
    const pos = { x: -100, y: -100 };
    let frame = 0;
    let seen = false;

    const render = () => {
      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      pos.x += dx * (calm ? 1 : FOLLOW);
      pos.y += dy * (calm ? 1 : FOLLOW);

      const speed = Math.hypot(dx, dy);
      const stretch = calm ? 0 : Math.min(speed * 0.012, MAX_STRETCH);
      const angle = Math.atan2(dy, dx);
      lens.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) rotate(${angle}rad) scale(${1 + stretch}, ${1 - stretch * 0.45}) translate(-50%, -50%)`;
      dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%)`;

      frame = speed > 0.1 ? requestAnimationFrame(render) : 0;
    };

    const kick = () => {
      if (!frame) {
        frame = requestAnimationFrame(render);
      }
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        return;
      }
      target.x = event.clientX;
      target.y = event.clientY;
      if (!seen) {
        seen = true;
        pos.x = target.x;
        pos.y = target.y;
        root.dataset.active = "true";
        document.documentElement.classList.add("has-glass-cursor");
      }
      root.dataset.state = stateFor(event.target);
      kick();
    };
    const onLeave = () => {
      root.dataset.active = "false";
      seen = false;
    };
    const onDown = () => {
      root.dataset.down = "true";
    };
    const onUp = () => {
      root.dataset.down = "false";
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.documentElement.classList.remove("has-glass-cursor");
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="glass-cursor"
      data-active="false"
      data-down="false"
      data-state="default"
    >
      <div className="glass-cursor-lens" />
      <div className="glass-cursor-dot" />
    </div>
  );
}
