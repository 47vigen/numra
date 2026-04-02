import "@testing-library/jest-dom";

// jsdom doesn't define PointerEvent as a global constructor —
// polyfill it so component tests can dispatch pointer events.
if (typeof globalThis.PointerEvent === "undefined") {
  // Minimal polyfill: extend MouseEvent with pointer-specific properties
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    pointerType: string;
    isPrimary: boolean;
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 1;
      this.pointerType = params.pointerType ?? "mouse";
      this.isPrimary = params.isPrimary ?? true;
    }
  }
  (globalThis as unknown as Record<string, unknown>).PointerEvent = PointerEventPolyfill;
}
