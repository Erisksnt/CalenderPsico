export type RichTextStyle = {
  bold?: boolean;
  italic?: boolean;
  font?: string;
  size?: number;
  color?: string;
};

export type TextAlignment = 'left' | 'center' | 'right' | 'justify';

export type ParsedRichText = {
  text: string;
  styles: RichTextStyle[];
  alignment?: TextAlignment;
};

const TOKEN_PATTERN = /(\[\[(?:font|size|color):[^\]]+\]\]|\[\[\/(?:font|size|color)\]\]|\[\[align:[^\]]+\]\]|\*\*|\*)/g;
const ALLOWED_FONTS = new Set([
  'The Seasons',
  'Cormorant Garamond',
  'Playfair Display',
  'Georgia',
  'Garet',
  'Inter',
  'Montserrat',
  'Open Sans',
  'Arial',
]);

function cloneStyle(style: RichTextStyle): RichTextStyle {
  return { ...style };
}

function isValidStyle(style: RichTextStyle): boolean {
  return Boolean(style.bold || style.italic || style.font || style.size || style.color);
}

export function parseRichText(value: string): ParsedRichText {
  const textParts: string[] = [];
  const styles: RichTextStyle[] = [];
  let style: RichTextStyle = {};
  const fontStack: Array<string | undefined> = [];
  const sizeStack: Array<number | undefined> = [];
  const colorStack: Array<string | undefined> = [];
  let alignment: TextAlignment | undefined;

  const tokens = value.split(TOKEN_PATTERN);
  for (const token of tokens) {
    if (!token) continue;

    const alignmentTag = token.match(/^\[\[align:(left|center|right|justify)\]\]$/);
    const openingTag = token.match(/^\[\[(font|size|color):([^\]]+)\]\]$/);
    if (alignmentTag) {
      alignment = alignmentTag[1] as TextAlignment;
    } else if (openingTag?.[1] === 'font') {
      fontStack.push(style.font);
      style = { ...style, font: ALLOWED_FONTS.has(openingTag[2]) ? openingTag[2] : undefined };
    } else if (openingTag?.[1] === 'size') {
      const size = Number(openingTag[2]);
      sizeStack.push(style.size);
      style = { ...style, size: Number.isInteger(size) && size >= 8 && size <= 72 ? size : undefined };
    } else if (openingTag?.[1] === 'color') {
      const color = openingTag[2];
      colorStack.push(style.color);
      style = { ...style, color: /^#[\da-fA-F]{6}$/.test(color) ? color : undefined };
    } else if (token === '**') {
      style = { ...style, bold: !style.bold };
    } else if (token === '*') {
      style = { ...style, italic: !style.italic };
    } else if (token === '[[/font]]') {
      if (fontStack.length > 0) style = { ...style, font: fontStack.pop() };
    } else if (token === '[[/size]]') {
      if (sizeStack.length > 0) style = { ...style, size: sizeStack.pop() };
    } else if (token === '[[/color]]') {
      if (colorStack.length > 0) style = { ...style, color: colorStack.pop() };
    } else {
      textParts.push(token);
      for (let index = 0; index < token.length; index += 1) {
        styles.push(cloneStyle(style));
      }
    }
  }

  return { text: textParts.join(''), styles, alignment };
}

function stylesEqual(left: RichTextStyle, right: RichTextStyle): boolean {
  return Boolean(left.bold) === Boolean(right.bold)
    && Boolean(left.italic) === Boolean(right.italic)
    && left.font === right.font
    && left.size === right.size
    && left.color === right.color;
}

export function serializeRichText(
  text: string,
  styles: RichTextStyle[],
  alignment?: TextAlignment,
): string {
  let result = alignment ? `[[align:${alignment}]]` : '';
  let index = 0;

  while (index < text.length) {
    const style = styles[index] ?? {};
    let end = index + 1;
    while (end < text.length && stylesEqual(style, styles[end] ?? {})) end += 1;
    const segment = text.slice(index, end);

    if (isValidStyle(style)) {
      if (style.font) result += `[[font:${style.font}]]`;
      if (style.size) result += `[[size:${style.size}]]`;
      if (style.color) result += `[[color:${style.color}]]`;
      if (style.bold) result += '**';
      if (style.italic) result += '*';
      result += segment;
      if (style.italic) result += '*';
      if (style.bold) result += '**';
      if (style.color) result += '[[/color]]';
      if (style.size) result += '[[/size]]';
      if (style.font) result += '[[/font]]';
    } else {
      result += segment;
    }
    index = end;
  }

  return result;
}

export function replaceRichText(
  value: string,
  nextText: string,
): string {
  const parsed = parseRichText(value);
  let commonPrefix = 0;
  while (
    commonPrefix < parsed.text.length
    && commonPrefix < nextText.length
    && parsed.text[commonPrefix] === nextText[commonPrefix]
  ) {
    commonPrefix += 1;
  }

  let commonSuffix = 0;
  while (
    commonSuffix < parsed.text.length - commonPrefix
    && commonSuffix < nextText.length - commonPrefix
    && parsed.text[parsed.text.length - 1 - commonSuffix] === nextText[nextText.length - 1 - commonSuffix]
  ) {
    commonSuffix += 1;
  }

  const oldChangedEnd = parsed.text.length - commonSuffix;
  const newChangedEnd = nextText.length - commonSuffix;
  const insertedStyle = parsed.styles[Math.max(0, commonPrefix - 1)]
    ?? parsed.styles[commonPrefix]
    ?? {};
  const nextStyles = [
    ...parsed.styles.slice(0, commonPrefix),
    ...Array.from({ length: newChangedEnd - commonPrefix }, () => cloneStyle(insertedStyle)),
    ...parsed.styles.slice(oldChangedEnd),
  ];

  return serializeRichText(nextText, nextStyles, parsed.alignment);
}

export function formatRichText(
  value: string,
  start: number,
  end: number,
  styleChange: Partial<RichTextStyle>,
): string {
  const parsed = parseRichText(value);
  if (parsed.text.length === 0) return value;

  const from = start === end ? 0 : Math.max(0, start);
  const to = start === end ? parsed.text.length : Math.min(parsed.text.length, end);
  const selected = parsed.styles.slice(from, to);
  const toggleMark = styleChange.bold !== undefined || styleChange.italic !== undefined;
  const shouldEnable = toggleMark
    ? selected.some((item) => !(styleChange.bold ? item.bold : item.italic))
    : true;

  for (let index = from; index < to; index += 1) {
    const current = parsed.styles[index] ?? {};
    parsed.styles[index] = {
      ...current,
      ...styleChange,
      ...(toggleMark ? {
        ...(styleChange.bold !== undefined ? { bold: shouldEnable } : {}),
        ...(styleChange.italic !== undefined ? { italic: shouldEnable } : {}),
      } : {}),
    };
  }

  return serializeRichText(parsed.text, parsed.styles, parsed.alignment);
}

export function setRichTextAlignment(value: string, alignment?: TextAlignment): string {
  const parsed = parseRichText(value);
  return serializeRichText(parsed.text, parsed.styles, alignment);
}
