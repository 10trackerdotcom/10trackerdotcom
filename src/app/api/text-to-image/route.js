import { NextResponse } from 'next/server';

function escapeXml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function clampNumber(value, { min, max, fallback }) {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function wrapText(text, maxCharsPerLine) {
  const normalized = String(text ?? '').replaceAll('\r\n', '\n');
  const paragraphs = normalized.split('\n');
  const lines = [];

  for (const p of paragraphs) {
    const words = p.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }

    let current = '';
    for (const w of words) {
      const next = current ? `${current} ${w}` : w;
      if (next.length <= maxCharsPerLine) {
        current = next;
      } else {
        if (current) lines.push(current);
        if (w.length > maxCharsPerLine) {
          for (let i = 0; i < w.length; i += maxCharsPerLine) {
            lines.push(w.slice(i, i + maxCharsPerLine));
          }
          current = '';
        } else {
          current = w;
        }
      }
    }
    if (current) lines.push(current);
  }

  return lines;
}

function getLinesForFontSize({ text, width, padding, fontSize }) {
  const approxCharWidth = fontSize * 0.6;
  const maxTextWidth = Math.max(1, width - padding * 2);
  const maxCharsPerLine = Math.max(5, Math.floor(maxTextWidth / approxCharWidth));
  return wrapText(String(text ?? ''), maxCharsPerLine);
}

function fitText({
  text,
  width,
  height,
  padding,
  fontSize,
  lineHeight,
  minFontSize,
  maxLines,
  reserveBottom,
}) {
  let size = fontSize;
  const hasCustomLineHeight = lineHeight !== undefined && lineHeight !== null && lineHeight !== '';

  while (size >= minFontSize) {
    const lh = hasCustomLineHeight ? Number(lineHeight) : Math.round(size * 1.25);
    const lines = getLinesForFontSize({ text, width, padding, fontSize: size });
    const totalHeight = size + Math.max(0, lines.length - 1) * lh;
    const availableHeight = Math.max(1, height - padding - reserveBottom);

    const okHeight = padding + totalHeight <= availableHeight;
    const okLines = typeof maxLines === 'number' ? lines.length <= maxLines : true;

    if (okHeight && okLines) {
      return { fittedFontSize: size, fittedLineHeight: lh, lines };
    }
    size -= 2;
  }

  const fallbackSize = minFontSize;
  const fallbackLh = hasCustomLineHeight ? Number(lineHeight) : Math.round(fallbackSize * 1.25);
  const fallbackLines = getLinesForFontSize({ text, width, padding, fontSize: fallbackSize });
  return { fittedFontSize: fallbackSize, fittedLineHeight: fallbackLh, lines: fallbackLines };
}

function buildSvg({
  text,
  width,
  height,
  padding,
  background,
  color,
  fontFamily,
  fontSize,
  lineHeight,
  fontWeight,
  align,
  autoFit,
  minFontSize,
  maxLines,
  watermarkText,
  watermarkColor,
  watermarkFontSize,
}) {
  const safeText = String(text ?? '');

  const x =
    align === 'left' ? padding : align === 'right' ? width - padding : width / 2;
  const textAnchor = align === 'left' ? 'start' : align === 'right' ? 'end' : 'middle';

  const wmText = String(watermarkText ?? '').trim();
  const wmEnabled = wmText.length > 0;
  const wmSize = watermarkFontSize ?? Math.max(14, Math.round((fontSize || 64) * 0.3));
  const reserveBottom = wmEnabled ? Math.max(padding, wmSize + 12) : padding;

  const fitted = autoFit
    ? fitText({
        text: safeText,
        width,
        height,
        padding,
        fontSize,
        lineHeight,
        minFontSize,
        maxLines,
        reserveBottom,
      })
    : {
        fittedFontSize: fontSize,
        fittedLineHeight: lineHeight,
        lines: getLinesForFontSize({ text: safeText, width, padding, fontSize }),
      };

  const usedFontSize = fitted.fittedFontSize;
  const usedLineHeight = fitted.fittedLineHeight;
  const lines = fitted.lines;

  const firstLineY = padding + usedFontSize;

  const tspans = lines
    .map((line, idx) => {
      const dy = idx === 0 ? 0 : usedLineHeight;
      return `<tspan x="${x}" dy="${dy}">${escapeXml(line)}</tspan>`;
    })
    .join('');

  const watermark = wmEnabled
    ? `
  <text
    x="${width - padding}"
    y="${height - Math.round(padding * 0.5)}"
    fill="${escapeXml(watermarkColor)}"
    font-family="${escapeXml(fontFamily)}"
    font-size="${wmSize}"
    font-weight="600"
    text-anchor="end"
    opacity="0.55"
  >${escapeXml(wmText)}</text>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${escapeXml(background)}"/>
  <text
    x="${x}"
    y="${firstLineY}"
    fill="${escapeXml(color)}"
    font-family="${escapeXml(fontFamily)}"
    font-size="${usedFontSize}"
    font-weight="${escapeXml(fontWeight)}"
    text-anchor="${textAnchor}"
  >${tspans}</text>
  ${watermark}
</svg>`;
}

function parseParams(params) {
  const text = params.get('text') ?? '';
  const width = clampNumber(params.get('width'), { min: 200, max: 2400, fallback: 1200 });
  const height = clampNumber(params.get('height'), { min: 200, max: 2400, fallback: 628 });
  const padding = clampNumber(params.get('padding'), { min: 0, max: 200, fallback: 64 });
  const fontSize = clampNumber(params.get('fontSize'), { min: 12, max: 160, fallback: 64 });
  const lineHeightRaw = params.get('lineHeight');
  const lineHeight = clampNumber(lineHeightRaw, {
    min: 12,
    max: 240,
    fallback: Math.round(fontSize * 1.25),
  });
  const background = params.get('background') ?? '#ffffff';
  const color = params.get('color') ?? '#111827';
  const fontFamily = params.get('fontFamily') ?? 'Inter, Arial, sans-serif';
  const fontWeight = params.get('fontWeight') ?? '700';
  const align = params.get('align') ?? 'center';
  const autoFit = (params.get('autoFit') ?? 'true') !== 'false';
  const minFontSize = clampNumber(params.get('minFontSize'), { min: 10, max: 160, fallback: 24 });
  const maxLines = clampNumber(params.get('maxLines'), { min: 1, max: 12, fallback: 4 });
  const watermarkText = params.get('watermark') ?? 'By 10Tracker.com';
  const watermarkColor = params.get('watermarkColor') ?? '#111827';
  const watermarkFontSize = clampNumber(params.get('watermarkFontSize'), {
    min: 10,
    max: 64,
    fallback: Math.max(14, Math.round(fontSize * 0.3)),
  });

  return {
    text,
    width,
    height,
    padding,
    background,
    color,
    fontFamily,
    fontSize,
    lineHeight: lineHeightRaw === null ? undefined : lineHeight,
    fontWeight,
    align: align === 'left' || align === 'right' ? align : 'center',
    autoFit,
    minFontSize,
    maxLines,
    watermarkText,
    watermarkColor,
    watermarkFontSize,
  };
}

export async function GET(request) {
  const params = request.nextUrl.searchParams;
  const config = parseParams(params);
  const svg = buildSvg(config);

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(body || {})) {
    if (v === undefined || v === null) continue;
    params.set(k, String(v));
  }
  const config = parseParams(params);
  const svg = buildSvg(config);

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
