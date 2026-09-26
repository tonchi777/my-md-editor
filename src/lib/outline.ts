export interface Heading {
  level: number;
  text: string;
  line: number; // 1-based line number in the source
}

const ATX = /^ {0,3}(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/;
const SETEXT = /^ {0,3}(=+|-+)[ \t]*$/;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;
// Lines that can't be the text of a setext heading (lists, quotes, tables, HTML, other headings).
const NOT_PARAGRAPH = /^ {0,3}([-*+>#|<]|\d+[.)])/;

function stripInline(text: string): string {
  return text
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__|\*|_|~~|`)/g, "")
    .trim();
}

// Extracts ATX (`## Title`) and setext (`Title\n---`) headings, ignoring fenced code blocks.
export function parseHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  const lines = markdown.split(/\r?\n/);
  let fence: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fenceMatch = line.match(FENCE);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (!fence) fence = marker;
      else if (marker[0] === fence[0] && marker.length >= fence.length) fence = null;
      continue;
    }
    if (fence) continue;

    const atx = line.match(ATX);
    if (atx) {
      const text = stripInline(atx[2]);
      if (text) headings.push({ level: atx[1].length, text, line: i + 1 });
      continue;
    }

    const setext = line.match(SETEXT);
    const prev = lines[i - 1];
    if (setext && prev?.trim() && !NOT_PARAGRAPH.test(prev) && !FENCE.test(prev)) {
      const text = stripInline(prev);
      if (text) headings.push({ level: setext[1][0] === "=" ? 1 : 2, text, line: i });
    }
  }
  return headings;
}
