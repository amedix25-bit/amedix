import { PDF_PAGE, FLOW_BOTTOM } from "@/lib/requestPdfLayout";

// The quality gate every AMedix clinical document passes before it reaches a
// doctor. The layout primitives report the exact box each line, label, cell and
// heading occupies; this module then checks the finished pages for content
// outside the margins, text printed over text, and a heading left alone at the
// foot of a page. A document that fails is re-rendered with tighter spacing —
// never smaller type — and audited again, so what the doctor receives is the
// cleanest of the two renders.

const BOUND_TOL = 0.6; // mm of slack allowed at the page edges
const OVERLAP_TOL = 0.2; // mm two boxes may touch before they count as overprinted
const CONTENT_TOP = 33; // the letterhead may not be printed over

// Spacing-only compression used by the corrective pass (1 = the design rhythm).
export function setDocumentDensity(doc, density) {
  const value = Number(density);
  doc.__pdfDensity = Number.isFinite(value) ? Math.min(1, Math.max(0.85, value)) : 1;
}

export function documentDensity(doc) {
  return typeof doc.__pdfDensity === "number" ? doc.__pdfDensity : 1;
}

// The box a line of text occupies, measured from its baseline: tall enough to
// catch real collisions, tight enough that correctly spaced lines never clash.
export function textBox(baseline, size) {
  const height = (Number(size) || 9) * 0.352778;
  return { top: baseline - height * 0.86, height: height * 1.1 };
}

export function recordPdfBox(doc, box) {
  if (!doc.__pdfBoxes) doc.__pdfBoxes = [];
  doc.__pdfBoxes.push({ page: doc.getCurrentPageInfo().pageNumber, ...box });
}

const overlaps = (a, b) =>
  a.x + a.width - OVERLAP_TOL > b.x &&
  b.x + b.width - OVERLAP_TOL > a.x &&
  a.top + a.height - OVERLAP_TOL > b.top &&
  b.top + b.height - OVERLAP_TOL > a.top;

const label = (box) => `“${String(box.label || "").slice(0, 28)}”`;

// Returns every problem found, in document order. An empty list means the
// sheets are print-ready: nothing clipped, nothing overlapping, no orphan.
export function auditPdfLayout(doc) {
  const boxes = doc.__pdfBoxes || [];
  const issues = [];
  const left = PDF_PAGE.margin;
  const right = PDF_PAGE.right;

  boxes.forEach((box) => {
    const where = `page ${box.page}: ${label(box)}`;
    if (box.x < left - BOUND_TOL) issues.push({ kind: "left-edge", page: box.page, detail: where });
    if (box.x + box.width > right + BOUND_TOL) issues.push({ kind: "right-edge", page: box.page, detail: where });
    if (box.top < CONTENT_TOP) issues.push({ kind: "top-edge", page: box.page, detail: where });
    if (box.top + box.height > FLOW_BOTTOM + 1) issues.push({ kind: "bottom-edge", page: box.page, detail: where });
  });

  const pages = new Map();
  boxes.forEach((box) => {
    if (!pages.has(box.page)) pages.set(box.page, []);
    pages.get(box.page).push(box);
  });

  pages.forEach((list, page) => {
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        if (overlaps(list[i], list[j])) {
          issues.push({ kind: "overlap", page, detail: `page ${page}: ${label(list[i])} over ${label(list[j])}` });
        }
      }
    }

    // A heading may never be the last thing on a page.
    const lowest = list.reduce((bottom, box) => (box.top > bottom.top ? box : bottom), list[0]);
    list
      .filter((box) => box.kind === "heading" && box === lowest)
      .forEach((box) => issues.push({ kind: "orphan-heading", page, detail: `page ${page}: ${label(box)}` }));
  });

  return issues;
}

// Renders a document, audits every page, and — when anything is wrong — rebuilds
// it with the spacing rhythm tightened, keeping whichever render is cleaner.
export async function renderAuditedDocument(build) {
  const first = await build(1);
  const issues = auditPdfLayout(first);
  if (issues.length === 0) return first;

  const second = await build(0.94);
  return auditPdfLayout(second).length <= issues.length ? second : first;
}