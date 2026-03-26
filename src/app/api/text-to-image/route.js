// app/api/text-to-image/route.js
// Production-ready for Vercel Edge Runtime
// Install: npm install @vercel/og
//
// GET /api/text-to-image?text=Hello&width=1200&height=628&background=%23ffffff&color=%23111827&fontSize=64&padding=64&align=center&watermark=10Tracker.com

import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse & clamp params
    const text       = searchParams.get('text')       ?? 'Hello World';
    const width      = clamp(Number(searchParams.get('width'))    || 1200, 200, 2400);
    const height     = clamp(Number(searchParams.get('height'))   || 628,  200, 2400);
    const background = searchParams.get('background') ?? '#ffffff';
    const color      = searchParams.get('color')      ?? '#111827';
    const fontSize   = clamp(Number(searchParams.get('fontSize')) || 64,   16,  200);
    const padding    = clamp(Number(searchParams.get('padding'))  || 64,    0,  300);
    const watermark  = searchParams.get('watermark')  ?? '10Tracker.com';
    const alignParam = searchParams.get('align')      ?? 'center';
    const align      = ['left', 'center', 'right'].includes(alignParam) ? alignParam : 'center';

    const justifyContent =
      align === 'left'  ? 'flex-start' :
      align === 'right' ? 'flex-end'   : 'center';

    const textAlign =
      align === 'left'  ? 'left'  :
      align === 'right' ? 'right' : 'center';

    // Watermark sizing
    const wmFontSize = Math.max(12, Math.round(width * 0.016));
    const wmPadding  = Math.round(height * 0.025);

    return new ImageResponse(
      (
        <div
          style={{
            display:         'flex',
            flexDirection:   'column',
            width:           '100%',
            height:          '100%',
            backgroundColor: background,
            padding:         `${padding}px`,
            boxSizing:       'border-box',
          }}
        >
          {/* Main text area */}
          <div
            style={{
              display:        'flex',
              flex:           1,
              alignItems:     'center',
              justifyContent: justifyContent,
              overflow:       'hidden',
            }}
          >
            <p
              style={{
                fontSize:   fontSize,
                fontWeight: 700,
                color:      color,
                textAlign:  textAlign,
                margin:     0,
                padding:    0,
                lineHeight: 1.45,
                wordBreak:  'break-word',
                whiteSpace: 'pre-wrap',
                width:      '100%',
              }}
            >
              {text}
            </p>
          </div>

          {/* Watermark */}
          {watermark && (
            <div
              style={{
                display:        'flex',
                justifyContent: 'center',
                paddingBottom:  `${wmPadding}px`,
              }}
            >
              <span
                style={{
                  fontSize:   wmFontSize,
                  fontWeight: 400,
                  color:      color,
                  opacity:    0.4,
                  textAlign:  'center',
                }}
              >
                -{watermark}
              </span>
            </div>
          )}
        </div>
      ),
      {
        width,
        height,
        headers: {
          'Content-Type':        'image/png',
          'Content-Disposition': 'attachment; filename="text-image.png"',
          'Cache-Control':       'public, max-age=31536000, immutable',
        },
      }
    );
  } catch (err) {
    console.error('[text-to-image]', err);
    return new Response(
      JSON.stringify({ error: err?.message ?? 'Unknown error' }),
      {
        status:  500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val || 0));
}