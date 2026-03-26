// app/api/text-to-image/route.js  (Next.js 13+ App Router)
// Returns a .png image directly — no browser canvas needed.
// Dependencies: npm install sharp
//
// GET /api/text-to-image?text=Hello&width=1200&height=628&background=%23ffffff&color=%23111827&fontSize=64&padding=64&align=center

import sharp from 'sharp';

export const runtime = 'nodejs';

/** Escape special XML/SVG characters. */
function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Wrap text into lines that fit within maxPx pixels at a given fontSize.
 * Uses a conservative avg char-width estimate for bold Arial.
 */
function wrapText(text, maxPx, fontSize) {
  const avgCharWidth = fontSize * 0.58;
  const maxChars = Math.max(1, Math.floor(maxPx / avgCharWidth));

  const lines = [];
  for (const para of text.split('\n')) {
    if (para.trim() === '') { lines.push(''); continue; }
    const words = para.split(' ');
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length > maxChars && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

/**
 * Auto-fit fontSize so the wrapped text block fits inside the available
 * vertical space (height minus padding top/bottom minus room for watermark).
 *
 * Strategy:
 *  1. Start with the requested fontSize.
 *  2. Wrap at that size.
 *  3. If the block is too tall, shrink fontSize by 1 and retry.
 *  4. Stop at MIN_FONT_SIZE (never go smaller than that).
 */
function autoFitFontSize(text, width, height, padding, requestedFontSize) {
  const MIN_FONT_SIZE = 18;
  const WATERMARK_RESERVED = 48; // px reserved at bottom for "By 10Tracker.com"
  const innerWidth = width - padding * 2;
  // Available vertical space for the main text block
  const availableHeight = height - padding * 2 - WATERMARK_RESERVED;

  let fontSize = requestedFontSize;

  while (fontSize >= MIN_FONT_SIZE) {
    const lineHeight = fontSize * 1.4;
    const lines = wrapText(text, innerWidth, fontSize);
    const totalTextHeight = lines.length * lineHeight;

    if (totalTextHeight <= availableHeight) {
      return { fontSize, lines };
    }
    fontSize -= 1;
  }

  // At minimum size, just return whatever we have
  const lines = wrapText(text, innerWidth, MIN_FONT_SIZE);
  return { fontSize: MIN_FONT_SIZE, lines };
}

/** Build the final SVG. */
function buildSvg({ text, width, height, background, color, fontSize, padding, align }) {
  const WATERMARK_RESERVED = 48;

  // Auto-fit font size to available space
  const { fontSize: fitFontSize, lines } = autoFitFontSize(
    text, width, height, padding, fontSize
  );

  const lineHeight = fitFontSize * 1.4;
  const totalTextHeight = lines.length * lineHeight;

  // Available area for main text (top padding to above watermark zone)
  const availableTop    = padding;
  const availableBottom = height - padding - WATERMARK_RESERVED;
  const availableHeight = availableBottom - availableTop;

  // Vertically centre the text block within the available area
  const startY = availableTop + (availableHeight - totalTextHeight) / 2 + fitFontSize;

  // Horizontal alignment
  let textAnchor = 'middle';
  let x = width / 2;
  if (align === 'left')  { textAnchor = 'start'; x = padding; }
  if (align === 'right') { textAnchor = 'end';   x = width - padding; }

  // Build <tspan> elements for each wrapped line
  const tspans = lines
    .map((line, i) =>
      `<tspan x="${x}" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
    )
    .join('');

  // Watermark — always bottom-center, small, slightly muted
  const watermarkFontSize = Math.max(14, Math.round(width * 0.016)); // ~20px at 1200w
  const watermarkY = height - padding * 0.5;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${width}" height="${height}"
     viewBox="0 0 ${width} ${height}">

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${escapeXml(background)}"/>

  <!-- Main text -->
  <text
    x="${x}"
    y="${startY}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="${fitFontSize}"
    font-weight="700"
    fill="${escapeXml(color)}"
    text-anchor="${textAnchor}"
    dominant-baseline="auto"
  >${tspans}</text>

  <!-- Watermark: -By 10Tracker.com -->
  <text
    x="${width / 2}"
    y="${watermarkY}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="${watermarkFontSize}"
    font-weight="400"
    fill="${escapeXml(color)}"
    opacity="0.45"
    text-anchor="middle"
    dominant-baseline="auto"
  >-By 10Tracker.com</text>

</svg>`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const text       = searchParams.get('text')       ?? 'Hello World';
  const width      = Math.min(2400, Math.max(200, Number(searchParams.get('width'))    || 1200));
  const height     = Math.min(2400, Math.max(200, Number(searchParams.get('height'))   || 628));
  const background = searchParams.get('background') ?? '#ffffff';
  const color      = searchParams.get('color')      ?? '#111827';
  const fontSize   = Math.min(160, Math.max(18,    Number(searchParams.get('fontSize')) || 64));
  const padding    = Math.min(200, Math.max(0,     Number(searchParams.get('padding'))  || 64));
  const align      = ['left', 'center', 'right'].includes(searchParams.get('align') ?? '')
                       ? (searchParams.get('align') ?? 'center')
                       : 'center';

  try {
    const svg = buildSvg({ text, width, height, background, color, fontSize, padding, align });

    const pngBuffer = await sharp(Buffer.from(svg))
      .png({ compressionLevel: 9 })
      .toBuffer();

    return new Response(pngBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="text-image.png"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[text-to-image]', err);
    return new Response(JSON.stringify({ error: err?.message ?? 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}