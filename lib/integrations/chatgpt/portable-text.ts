import { randomUUID } from "node:crypto";

import type { CreateBlogDraftRequest } from "./schemas";
import type {
  PortableTextBlock,
  PortableTextImage,
  PortableTextMarkDef,
  PortableTextSpan,
  PortableTextValue,
} from "./types";
import { normalizeContentValue } from "./rules";

type InternalLink = NonNullable<CreateBlogDraftRequest["internalLinks"]>[number];

interface InlineState {
  links: InternalLink[];
  usedAutomaticLinks: Set<string>;
}

const key = () => randomUUID().replace(/-/g, "").slice(0, 12);

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function normalizeInputMarkup(value: string): string {
  return decodeEntities(value)
    .replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n## $1\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n")
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n#### $1\n")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n- $1")
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, "\n> $1\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\r\n?/g, "\n");
}

function createMarkDef(href: string): PortableTextMarkDef {
  return { _key: key(), _type: "link", href };
}

function createSpan(text: string, marks: string[] = []): PortableTextSpan {
  return { _key: key(), _type: "span", text, marks };
}

function appendAutomaticLinks(text: string, spans: PortableTextSpan[], markDefs: PortableTextMarkDef[], state: InlineState): void {
  let remainder = text;
  while (remainder) {
    let selected: { link: InternalLink; index: number } | undefined;
    for (const link of state.links) {
      if (state.usedAutomaticLinks.has(link.url)) continue;
      const index = remainder.toLocaleLowerCase().indexOf(link.text.toLocaleLowerCase());
      if (index >= 0 && (!selected || index < selected.index || (index === selected.index && link.text.length > selected.link.text.length))) {
        selected = { link, index };
      }
    }
    if (!selected) {
      if (remainder) spans.push(createSpan(remainder));
      break;
    }
    if (selected.index > 0) spans.push(createSpan(remainder.slice(0, selected.index)));
    const matched = remainder.slice(selected.index, selected.index + selected.link.text.length);
    const markDef = createMarkDef(selected.link.url);
    markDefs.push(markDef);
    spans.push(createSpan(matched, [markDef._key]));
    state.usedAutomaticLinks.add(selected.link.url);
    remainder = remainder.slice(selected.index + selected.link.text.length);
  }
}

function parseInline(value: string, state: InlineState): Pick<PortableTextBlock, "children" | "markDefs"> {
  const children: PortableTextSpan[] = [];
  const markDefs: PortableTextMarkDef[] = [];
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let cursor = 0;

  for (const match of value.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) appendAutomaticLinks(value.slice(cursor, index), children, markDefs, state);
    if (match[1] && match[2]) {
      const definition = createMarkDef(match[2]);
      markDefs.push(definition);
      children.push(createSpan(match[1], [definition._key]));
      state.usedAutomaticLinks.add(match[2]);
    } else if (match[3]) {
      children.push(createSpan(match[3], ["strong"]));
    } else if (match[4]) {
      children.push(createSpan(match[4], ["em"]));
    }
    cursor = index + match[0].length;
  }
  if (cursor < value.length) appendAutomaticLinks(value.slice(cursor), children, markDefs, state);
  if (children.length === 0) children.push(createSpan(value));
  return { children, markDefs };
}

function createBlock(
  value: string,
  style: PortableTextBlock["style"],
  state: InlineState,
  listItem?: PortableTextBlock["listItem"],
): PortableTextBlock {
  return {
    _key: key(),
    _type: "block",
    style,
    ...parseInline(value.trim(), state),
    ...(listItem ? { listItem, level: 1 } : {}),
  };
}

export function markdownToPortableText(content: string, links: InternalLink[] = []): PortableTextValue {
  const state: InlineState = {
    links: [...links].sort((left, right) => right.text.length - left.text.length),
    usedAutomaticLinks: new Set<string>(),
  };
  const lines = normalizeInputMarkup(content).split("\n");
  const body: PortableTextValue = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    const value = paragraph.join(" ").replace(/\s+/g, " ").trim();
    if (value) body.push(createBlock(value, "normal", state));
    paragraph = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      continue;
    }
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      const level = heading[1].length;
      const style = level <= 2 ? "h2" : level === 3 ? "h3" : "h4";
      body.push(createBlock(heading[2], style, state));
      continue;
    }
    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      body.push(createBlock(bullet[1], "normal", state, "bullet"));
      continue;
    }
    const numbered = line.match(/^\d+[.)]\s+(.+)$/);
    if (numbered) {
      flushParagraph();
      body.push(createBlock(numbered[1], "normal", state, "number"));
      continue;
    }
    if (line.startsWith("> ")) {
      flushParagraph();
      body.push(createBlock(line.slice(2), "blockquote", state));
      continue;
    }
    paragraph.push(line);
  }
  flushParagraph();
  return body;
}

function blockText(block: PortableTextBlock): string {
  return block.children.map((child) => child.text).join("").trim();
}

export function insertContentImages(
  body: PortableTextValue,
  images: PortableTextImage[],
): { body: PortableTextValue; warnings: string[] } {
  const result = [...body];
  const warnings: string[] = [];

  images.forEach((image, imageIndex) => {
    const requested = normalizeContentValue(image.insertAfterHeading ?? "");
    const headings = result
      .map((block, index) => ({ block, index }))
      .filter((entry): entry is { block: PortableTextBlock; index: number } => entry.block._type === "block" && ["h2", "h3", "h4"].includes(entry.block.style));
    let target = requested
      ? headings.find((entry) => {
          const heading = normalizeContentValue(blockText(entry.block));
          return heading === requested || heading.includes(requested) || requested.includes(heading);
        })
      : undefined;

    if (!target && headings.length > 0) {
      target = headings[Math.min(imageIndex, headings.length - 1)];
      if (requested) warnings.push(`Content image ${imageIndex + 1} was placed after the nearest available heading.`);
    }
    const insertAt = target ? target.index + 1 : result.length;
    result.splice(Math.min(insertAt, result.length), 0, image);
    if (!target && requested) warnings.push(`Content image ${imageIndex + 1} heading was not found; the image was placed at the end.`);
  });

  return { body: result, warnings };
}
