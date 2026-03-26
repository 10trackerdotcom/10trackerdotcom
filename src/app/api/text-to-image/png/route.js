import { NextResponse } from 'next/server';

function safeFilename(name) {
  const base = String(name || 'text-image.png')
    .trim()
    .replaceAll('"', '')
    .replaceAll("'", '')
    .replaceAll('\n', '')
    .replaceAll('\r', '');
  return base.toLowerCase().endsWith('.png') ? base : `${base}.png`;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export async function GET(request) {
  const params = request.nextUrl.searchParams;
  const filename = safeFilename(params.get('filename'));

  // Pass through all params except filename to the SVG generator
  const svgParams = new URLSearchParams(params);
  svgParams.delete('filename');
  const svgUrl = `/api/text-to-image?${svgParams.toString()}`;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Downloading PNG…</title>
  </head>
  <body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; padding: 16px;">
    <div id="status">Preparing download…</div>
    <script>
      (async () => {
        const statusEl = document.getElementById('status');
        const svgUrl = ${JSON.stringify(svgUrl)};
        const filename = ${JSON.stringify(filename)};

        try {
          statusEl.textContent = 'Fetching SVG…';
          const res = await fetch(svgUrl, { cache: 'no-store' });
          if (!res.ok) throw new Error('Failed to generate SVG (HTTP ' + res.status + ')');
          const svgText = await res.text();

          // Extract width/height from query if provided, otherwise fall back.
          const u = new URL(svgUrl, window.location.origin);
          const width = Number(u.searchParams.get('width')) || 1200;
          const height = Number(u.searchParams.get('height')) || 628;
          const dpr = window.devicePixelRatio || 1;
          const scale = Math.min(3, Math.max(1, dpr));

          statusEl.textContent = 'Rendering PNG…';
          const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
          const svgObjectUrl = URL.createObjectURL(svgBlob);

          const img = await new Promise((resolve, reject) => {
            const i = new Image();
            i.onload = () => resolve(i);
            i.onerror = reject;
            i.src = svgObjectUrl;
          });

          const canvas = document.createElement('canvas');
          canvas.width = Math.round(width * scale);
          canvas.height = Math.round(height * scale);
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas not supported');
          ctx.setTransform(scale, 0, 0, scale, 0, 0);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          URL.revokeObjectURL(svgObjectUrl);

          statusEl.textContent = 'Downloading…';
          const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
          if (!blob) throw new Error('Failed to encode PNG');

          const pngUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(pngUrl);

          statusEl.textContent = 'Done. If download didn\\'t start, allow downloads/popups and refresh.';
        } catch (err) {
          statusEl.textContent = 'Error: ' + (err && err.message ? err.message : String(err));
        }
      })();
    </script>
    <noscript>${escapeHtml('This endpoint needs JavaScript enabled to download PNG.')}</noscript>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
