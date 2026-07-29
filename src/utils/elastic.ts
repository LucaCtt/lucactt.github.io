// elastic.ts

export interface ElasticOptions {
  stiffness?: number;
  damping?: number;
  maxDrag?: number;
  clickThreshold?: number;
  preventClickOnDrag?: boolean;
}

const DEFAULTS: Required<ElasticOptions> = {
  stiffness: 0.18,
  damping: 0.72,
  maxDrag: 36,
  clickThreshold: 4,
  preventClickOnDrag: true,
};

/**
 * Makes an element draggable with an elastic snap-back on release.
 * Returns a cleanup function to remove all listeners.
 */
export function makeElastic(
  el: HTMLElement,
  options: ElasticOptions = {},
): () => void {
  const { stiffness, damping, maxDrag, clickThreshold, preventClickOnDrag } = {
    ...DEFAULTS,
    ...options,
  };

  let dragging = false;
  let moved = false;
  let originX = 0;
  let originY = 0;
  let x = 0;
  let y = 0;
  let vx = 0;
  let vy = 0;
  let rafId: number | null = null;

  const setTransform = (px: number, py: number) => {
    el.style.transform = `translate(${px}px, ${py}px)`;
  };

  // rubber-band resistance: pulling further gives diminishing displacement
  const rubberBand = (distance: number): number => {
    const sign = Math.sign(distance);
    const abs = Math.abs(distance);
    return sign * maxDrag * (1 - Math.exp(-abs / maxDrag));
  };

  const animateBack = () => {
    const ax = -x * stiffness;
    const ay = -y * stiffness;
    vx = (vx + ax) * damping;
    vy = (vy + ay) * damping;
    x += vx;
    y += vy;

    if (
      Math.abs(x) < 0.5 &&
      Math.abs(y) < 0.5 &&
      Math.abs(vx) < 0.5 &&
      Math.abs(vy) < 0.5
    ) {
      x = 0;
      y = 0;
      el.style.transform = "";
      rafId = null;
      return;
    }
    setTransform(x, y);
    rafId = requestAnimationFrame(animateBack);
  };

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") {
      return;
    }

    dragging = true;
    moved = false;
    originX = e.clientX - x;
    originY = e.clientY - y;
    if (rafId) cancelAnimationFrame(rafId);
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) {
      return;
    }

    const rawX = e.clientX - originX;
    const rawY = e.clientY - originY;
    if (Math.abs(rawX) > clickThreshold || Math.abs(rawY) > clickThreshold) {
      moved = true;
    }
    x = rubberBand(rawX);
    y = rubberBand(rawY);
    setTransform(x, y);
  };

  const onPointerEnd = (e: PointerEvent) => {
    if (!dragging) {
      return;
    }

    dragging = false;
    el.releasePointerCapture(e.pointerId);
    vx = 0;
    vy = 0;
    animateBack();
  };

  const onClick = (e: MouseEvent) => {
    if (preventClickOnDrag && moved) e.preventDefault();
  };

  const onDragStart = (e: DragEvent) => e.preventDefault();

  el.addEventListener("pointerdown", onPointerDown);
  el.addEventListener("pointermove", onPointerMove);
  el.addEventListener("pointerup", onPointerEnd);
  el.addEventListener("pointercancel", onPointerEnd);
  el.addEventListener("click", onClick);
  el.addEventListener("dragstart", onDragStart);

  return function cleanup() {
    if (rafId) cancelAnimationFrame(rafId);
    el.style.transform = "";
    el.removeEventListener("pointerdown", onPointerDown);
    el.removeEventListener("pointermove", onPointerMove);
    el.removeEventListener("pointerup", onPointerEnd);
    el.removeEventListener("pointercancel", onPointerEnd);
    el.removeEventListener("click", onClick);
    el.removeEventListener("dragstart", onDragStart);
  };
}
