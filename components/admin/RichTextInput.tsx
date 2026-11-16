'use client';

import { useId, useRef, useState } from 'react';
import {
  formatRichText,
  parseRichText,
  replaceRichText,
  setRichTextAlignment,
  serializeRichText,
  type RichTextStyle,
  type TextAlignment,
} from '@/lib/rich-text';

const FONT_OPTIONS = [
  'The Seasons',
  'Cormorant Garamond',
  'Playfair Display',
  'Georgia',
  'Garet',
  'Inter',
  'Montserrat',
  'Open Sans',
  'Arial',
] as const;
const FONT_SIZE_OPTIONS = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64];

type RichTextInputProps = {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  className?: string;
  containerClassName?: string;
  'aria-label'?: string;
};

export default function RichTextInput({
  value,
  onChange,
  rows = 3,
  className = '',
  containerClassName = '',
  'aria-label': ariaLabel,
}: RichTextInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const controlId = useId();
  const [font, setFont] = useState<(typeof FONT_OPTIONS)[number]>('Arial');
  const [fontSize, setFontSize] = useState(18);
  const [color, setColor] = useState('#7C1D30');
  const [pendingStyle, setPendingStyle] = useState<RichTextStyle>({});
  const parsedValue = parseRichText(value);
  const plainText = parsedValue.text;

  function replaceSelection(insertedText: string, selectionStartOffset: number, selectionEndOffset = selectionStartOffset) {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const nextText = `${plainText.slice(0, start)}${insertedText}${plainText.slice(end)}`;
    let nextValue = replaceRichText(value, nextText);
    if (!plainText && Object.keys(pendingStyle).length > 0) {
      nextValue = serializeRichText(
        nextText,
        Array.from({ length: nextText.length }, () => ({ ...pendingStyle })),
        parsedValue.alignment,
      );
    }
    onChange(nextValue);

    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + selectionStartOffset, start + selectionEndOffset);
    });
  }

  function applyFormatting(marker: '**' | '*') {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const format = marker === '**' ? 'bold' : 'italic';
    if (!plainText) {
      setPendingStyle((current) => ({ ...current, [format]: !current[format] }));
      return;
    }
    onChange(formatRichText(value, start, end, { [format]: true }));

    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start, end);
    });
  }

  function applyStyle(kind: 'font' | 'size' | 'color', style: string) {
    const input = inputRef.current;
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const styleChange = kind === 'font'
      ? { font: style }
      : kind === 'size'
        ? { size: Number(style) }
        : { color: style };
    if (!plainText) {
      setPendingStyle((current) => ({ ...current, ...styleChange }));
      return;
    }

    onChange(formatRichText(value, start, end, styleChange));
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start, end);
    });
  }

  return (
    <div className={`min-w-0 space-y-2 ${containerClassName}`}>
      <div className="flex flex-wrap items-center gap-2" aria-label="Formatação do texto">
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyFormatting('**')}
          aria-label="Aplicar ou inserir negrito"
          title="Negrito"
          className="rounded border px-2 py-1 text-sm font-bold"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyFormatting('*')}
          aria-label="Aplicar ou inserir itálico"
          title="Itálico"
          className="rounded border px-2 py-1 text-sm italic"
        >
          I
        </button>
        <label className="sr-only" htmlFor={`${controlId}-font`}>Fonte do texto</label>
        <select
          id={`${controlId}-font`}
          aria-label="Fonte do texto"
          value={font}
          onChange={(event) => setFont(event.target.value as (typeof FONT_OPTIONS)[number])}
          className="rounded border px-2 py-1 text-xs"
        >
          {FONT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyStyle('font', font)}
          className="rounded border px-2 py-1 text-xs"
          title="Aplicar a fonte ao trecho selecionado ou ao bloco inteiro"
        >
          Aplicar fonte
        </button>
        <label className="sr-only" htmlFor={`${controlId}-font-size`}>Tamanho do texto</label>
        <select
          id={`${controlId}-font-size`}
          aria-label="Tamanho do texto"
          value={fontSize}
          onChange={(event) => setFontSize(Number(event.target.value))}
          className="rounded border px-2 py-1 text-xs"
        >
          {FONT_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}px</option>)}
        </select>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyStyle('size', String(fontSize))}
          className="rounded border px-2 py-1 text-xs"
          title="Aplicar o tamanho ao trecho selecionado ou ao bloco inteiro"
        >
          Aplicar tamanho
        </button>
        <label className="sr-only" htmlFor={`${controlId}-color`}>Cor do texto</label>
        <input
          id={`${controlId}-color`}
          type="color"
          aria-label="Cor do texto"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          className="h-8 w-9 cursor-pointer rounded border p-0.5"
        />
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyStyle('color', color)}
          className="rounded border px-2 py-1 text-xs"
          title="Aplicar a cor ao trecho selecionado ou ao bloco inteiro"
        >
          Aplicar cor
        </button>
        <label className="sr-only" htmlFor={`${controlId}-alignment`}>Alinhamento do bloco</label>
        <select
          id={`${controlId}-alignment`}
          aria-label="Alinhamento do bloco"
          value={parsedValue.alignment ?? ''}
          onChange={(event) => onChange(setRichTextAlignment(
            value,
            (event.target.value || undefined) as TextAlignment | undefined,
          ))}
          className="rounded border px-2 py-1 text-xs"
        >
          <option value="">Alinhamento da seção</option>
          <option value="left">À esquerda</option>
          <option value="center">Centralizado</option>
          <option value="right">À direita</option>
          <option value="justify">Justificado</option>
        </select>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => replaceSelection('\n', 1)}
          aria-label="Inserir nova linha"
          title="Nova linha"
          className="rounded border px-2 py-1 text-xs"
        >
          Nova linha
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => replaceSelection('\n\n', 2)}
          aria-label="Inserir novo parágrafo"
          title="Novo parágrafo"
          className="rounded border px-2 py-1 text-xs"
        >
          Novo parágrafo
        </button>
      </div>
      <textarea
        ref={inputRef}
        aria-label={ariaLabel}
        rows={rows}
        className={`w-full ${className}`}
        value={plainText}
        onChange={(event) => {
          let nextValue = replaceRichText(value, event.target.value);
          if (!plainText && Object.keys(pendingStyle).length > 0) {
            nextValue = serializeRichText(
              event.target.value,
              Array.from({ length: event.target.value.length }, () => ({ ...pendingStyle })),
              parsedValue.alignment,
            );
          }
          onChange(nextValue);
        }}
      />
    </div>
  );
}
