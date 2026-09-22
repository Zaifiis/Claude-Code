/**
 * The script area is plain Markdown: headings, bullets, bold and italic.
 * Keeping it as text means the writing surface stays a real textarea — no
 * contentEditable quirks — while still rendering structure in preview.
 */

export interface InlineSpan {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

export type ScriptBlock =
  | { kind: "heading"; level: 1 | 2 | 3; spans: InlineSpan[] }
  | { kind: "list"; items: InlineSpan[][] }
  | { kind: "paragraph"; spans: InlineSpan[] };

const HEADING = /^(#{1,3})\s+(.*)$/;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const EMPHASIS = /(\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_)/g;

/** Splits one line into bold / italic / plain runs. */
export function parseInline(line: string): InlineSpan[] {
  const spans: InlineSpan[] = [];

  for (const part of line.split(EMPHASIS)) {
    if (!part) continue;
    if (part.length > 4 && ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__")))) {
      spans.push({ text: part.slice(2, -2), bold: true });
    } else if (part.length > 2 && ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_")))) {
      spans.push({ text: part.slice(1, -1), italic: true });
    } else {
      spans.push({ text: part });
    }
  }

  return spans.length > 0 ? spans : [{ text: "" }];
}

/** Groups the script into heading / bullet-list / paragraph blocks. */
export function parseScript(script: string): ScriptBlock[] {
  const blocks: ScriptBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({ kind: "paragraph", spans: parseInline(paragraph.join(" ")) });
    paragraph = [];
  };

  const flushList = () => {
    if (list.length === 0) return;
    blocks.push({ kind: "list", items: list.map(parseInline) });
    list = [];
  };

  for (const line of script.split("\n")) {
    const heading = HEADING.exec(line);
    const bullet = BULLET.exec(line);

    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({
        kind: "heading",
        level: heading[1].length as 1 | 2 | 3,
        spans: parseInline(heading[2]),
      });
    } else if (bullet) {
      flushParagraph();
      list.push(bullet[1]);
    } else if (line.trim() === "") {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(line.trim());
    }
  }

  flushParagraph();
  flushList();
  return blocks;
}

/** Words in the script, ignoring Markdown markers. */
export function countWords(text: string): number {
  const prose = text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/[*_`~]/g, "")
    .trim();
  return prose === "" ? 0 : prose.split(/\s+/).length;
}

/** Rough read-aloud time, at the ~150 wpm most people talk to camera. */
export function speakingMinutes(words: number): string {
  if (words === 0) return "—";
  const seconds = Math.round((words / 150) * 60);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;
}

/** First meaningful line of the script, for a card preview. */
export function scriptPreview(script: string): string {
  for (const line of script.split("\n")) {
    const text = line.replace(/^#{1,6}\s+/, "").replace(/^\s*[-*+]\s+/, "").replace(/[*_`~]/g, "").trim();
    if (text) return text;
  }
  return "";
}
