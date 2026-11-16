import { Fragment, type ReactNode } from 'react';
import { parseRichText, type RichTextStyle } from '@/lib/rich-text';

const FONT_STACKS: Record<string, string> = {
  'The Seasons': '"The Seasons", "Palatino Linotype", "Book Antiqua", Georgia, serif',
  'Cormorant Garamond': '"Cormorant Garamond", "Palatino Linotype", Georgia, serif',
  'Playfair Display': '"Playfair Display", "Palatino Linotype", Georgia, serif',
  Georgia: 'Georgia, serif',
  Garet: 'Garet, "Century Gothic", "Trebuchet MS", Arial, sans-serif',
  Inter: 'Inter, "Segoe UI", Arial, sans-serif',
  Montserrat: 'Montserrat, "Century Gothic", Arial, sans-serif',
  'Open Sans': '"Open Sans", "Segoe UI", Arial, sans-serif',
  Arial: 'Arial, sans-serif',
};

function sameStyle(left: RichTextStyle, right: RichTextStyle): boolean {
  return Boolean(left.bold) === Boolean(right.bold)
    && Boolean(left.italic) === Boolean(right.italic)
    && left.font === right.font
    && left.size === right.size
    && left.color === right.color;
}

function renderStyledText(text: string, style: RichTextStyle, key: number): ReactNode {
  const content = text.split('\n').flatMap((line, index) => [
    ...(index > 0 ? [<br key={`br-${key}-${index}`} />] : []),
    line,
  ]);
  const fontFamily = style.font ? FONT_STACKS[style.font] : undefined;
  const styledContent = fontFamily || style.size
    ? <span style={{
      ...(fontFamily ? { fontFamily } : {}),
      ...(style.size ? { fontSize: `${style.size}px` } : {}),
      ...(style.color ? { color: style.color } : {}),
    }}>{content}</span>
    : content;
  const italicContent = style.italic ? <em>{styledContent}</em> : styledContent;
  return style.bold ? <strong key={key}>{italicContent}</strong> : <Fragment key={key}>{italicContent}</Fragment>;
}

export default function RichText({ text }: { text: string }) {
  const parsed = parseRichText(text);
  const nodes: ReactNode[] = [];
  let start = 0;

  while (start < parsed.text.length) {
    let end = start + 1;
    while (end < parsed.text.length && sameStyle(parsed.styles[start], parsed.styles[end])) {
      end += 1;
    }
    nodes.push(renderStyledText(parsed.text.slice(start, end), parsed.styles[start], start));
    start = end;
  }

  return parsed.alignment
    ? <span style={{ display: 'block', textAlign: parsed.alignment }}>{nodes}</span>
    : <>{nodes}</>;
}
