// Shared test environment for the PDF layout checks (canvas is stubbed).
export function stubCanvas() {
  const ctx = {
    font: "",
    fillStyle: "",
    textBaseline: "",
    measureText: (t) => ({ width: String(t).length * 5.2 }),
    fillText: () => {},
    drawImage: () => {},
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ctx,
    toDataURL: () =>
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  };
  globalThis.document = { createElement: () => canvas };
  globalThis.Image = class {};
  globalThis.FileReader = class {};
}