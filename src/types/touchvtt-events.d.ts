// TouchVTT dispatches synthetic DOM events (see src/logic/FakeTouchEvent.js) and tags them with
// this custom flag so the rest of the module can recognize "our own" events vs. real browser ones.
export {}

declare global {
  interface Event {
    touchvttTrusted?: boolean
  }
}
