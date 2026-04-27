/**
 * Lightweight content parser for posts.
 * Parses tags (#react), fenced code blocks (```ts ... ```) and project-update
 * markers (lines starting with "📦 update:" or "/update").
 *
 * No DB schema changes — we derive structure from the post text itself.
 * It's not pretty, but it works and keeps things simple.
 */

export type PostSegment =
  | { kind: "text"; value: string }
  | { kind: "code"; lang: string; value: string }
  | { kind: "tag"; value: string };

export interface ParsedPost {
  segments: PostSegment[];
  tags: string[];
  isProjectUpdate: boolean;
}

const TAG_RE = /(^|\s)(#[a-zA-Z][a-zA-Z0-9_-]{1,29})/g;
// Matches ```lang\n...\n``` (lang optional)
const CODE_RE = /```([a-zA-Z0-9+#-]*)\n?([\s\S]*?)```/g;
const UPDATE_RE = /^\s*(?:📦\s*update:|\/update\b)\s*/i;

export function parsePostContent(raw: string): ParsedPost {
  const isProjectUpdate = UPDATE_RE.test(raw);
  const content = raw.replace(UPDATE_RE, "").trimStart();

  const segments: PostSegment[] = [];
  const tags = new Set<string>();

  let cursor = 0;
  let m: RegExpExecArray | null;

  // Reset lastIndex on the regex (it's stateful)
  CODE_RE.lastIndex = 0;
  while ((m = CODE_RE.exec(content)) !== null) {
    if (m.index > cursor) {
      pushTextWithTags(segments, tags, content.slice(cursor, m.index));
    }
    segments.push({
      kind: "code",
      lang: (m[1] || "").toLowerCase(),
      value: m[2].replace(/\n$/, ""),
    });
    cursor = m.index + m[0].length;
  }
  if (cursor < content.length) {
    pushTextWithTags(segments, tags, content.slice(cursor));
  }

  return {
    segments,
    tags: Array.from(tags),
    isProjectUpdate,
  };
}

function pushTextWithTags(
  out: PostSegment[],
  tagSet: Set<string>,
  text: string,
) {
  if (!text) return;

  let cursor = 0;
  let m: RegExpExecArray | null;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(text)) !== null) {
    const [full, prefix, tag] = m;
    const tagStart = m.index + prefix.length;
    if (tagStart > cursor) {
      out.push({ kind: "text", value: text.slice(cursor, tagStart) });
    }
    const normalized = tag.toLowerCase();
    tagSet.add(normalized);
    out.push({ kind: "tag", value: normalized });
    cursor = tagStart + tag.length;
  }
  if (cursor < text.length) {
    out.push({ kind: "text", value: text.slice(cursor) });
  }
}

/**
 * Profile bio convention: lines starting with "Stack:" become skill chips.
 *   Stack: react, typescript, node
 * Returns the cleaned bio (stack line stripped) plus the parsed skills list.
 */
export function parseProfileBio(bio?: string | null): {
  text: string;
  skills: string[];
} {
  if (!bio) return { text: "", skills: [] };
  const lines = bio.split(/\r?\n/);
  const skills: string[] = [];
  const kept: string[] = [];
  for (const line of lines) {
    const m = /^\s*stack\s*:\s*(.+)$/i.exec(line);
    if (m) {
      m[1]
        .split(/[,|]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((s) => skills.push(s));
    } else {
      kept.push(line);
    }
  }
  return { text: kept.join("\n").trim(), skills };
}

/** Compose a bio string back together when saving from the edit dialog. */
export function composeProfileBio(text: string, skills: string[]): string {
  const cleanSkills = skills
    .map((s) => s.trim().replace(/^#/, ""))
    .filter(Boolean);
  const parts: string[] = [];
  if (text.trim()) parts.push(text.trim());
  if (cleanSkills.length) parts.push(`Stack: ${cleanSkills.join(", ")}`);
  return parts.join("\n");
}
