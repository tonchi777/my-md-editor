import {
  Document, Packer, Paragraph, TextRun,
  HeadingLevel, Table, TableRow, TableCell, WidthType,
} from "docx";

interface InlineProps { bold?: boolean; italics?: boolean; code?: boolean }

function getInlineRuns(node: Node, props: InlineProps = {}): TextRun[] {
  const runs: TextRun[] = [];
  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent ?? "";
      if (text) {
        runs.push(new TextRun({
          text,
          bold: props.bold,
          italics: props.italics,
          font: props.code ? "Courier New" : undefined,
          size: props.code ? 18 : undefined,
        }));
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const tag = el.tagName;
      const p: InlineProps = { ...props };
      if (tag === "STRONG" || tag === "B") p.bold = true;
      if (tag === "EM" || tag === "I") p.italics = true;
      if (tag === "CODE") p.code = true;
      runs.push(...getInlineRuns(el, p));
    }
  }
  return runs;
}

const HEADING_MAP: Record<string, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
  H1: HeadingLevel.HEADING_1, H2: HeadingLevel.HEADING_2,
  H3: HeadingLevel.HEADING_3, H4: HeadingLevel.HEADING_4,
  H5: HeadingLevel.HEADING_5, H6: HeadingLevel.HEADING_6,
};

type Child = Paragraph | Table;

function convertElement(el: Element): Child[] {
  const tag = el.tagName;

  if (tag in HEADING_MAP) {
    return [new Paragraph({ heading: HEADING_MAP[tag], children: getInlineRuns(el) })];
  }
  if (tag === "P") {
    return [new Paragraph({ children: getInlineRuns(el) })];
  }
  if (tag === "BLOCKQUOTE") {
    return [new Paragraph({ children: getInlineRuns(el), indent: { left: 720 } })];
  }
  if (tag === "PRE") {
    return (el.textContent ?? "").split("\n").map(line =>
      new Paragraph({
        children: [new TextRun({ text: line || " ", font: "Courier New", size: 18 })],
        indent: { left: 720 },
      })
    );
  }
  if (tag === "UL") {
    return Array.from(el.querySelectorAll(":scope > li")).map(li =>
      new Paragraph({ children: [new TextRun("• "), ...getInlineRuns(li)], indent: { left: 360 } })
    );
  }
  if (tag === "OL") {
    return Array.from(el.querySelectorAll(":scope > li")).map((li, i) =>
      new Paragraph({ children: [new TextRun(`${i + 1}. `), ...getInlineRuns(li)], indent: { left: 360 } })
    );
  }
  if (tag === "TABLE") {
    const rows: TableRow[] = [];
    for (const tr of Array.from(el.querySelectorAll("tr"))) {
      const cells = Array.from(tr.querySelectorAll("th, td")).map(cell =>
        new TableCell({ children: [new Paragraph({ children: getInlineRuns(cell) })] })
      );
      if (cells.length) rows.push(new TableRow({ children: cells }));
    }
    if (rows.length) return [new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } })];
  }
  if (tag === "HR") {
    return [new Paragraph({ text: "────────────────────────────────────────" })];
  }
  const text = el.textContent?.trim();
  if (text) return [new Paragraph({ children: getInlineRuns(el) })];
  return [];
}

export async function generateDocxExport(html: string): Promise<Uint8Array> {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const children: Child[] = [];
  for (const el of Array.from(parsed.body.children)) {
    children.push(...convertElement(el));
  }
  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  return new Uint8Array(await blob.arrayBuffer());
}
