import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { detectPWAEnvironment } from '../src/context/PWAContext.tsx';

function readPngDimensions(filePath: string): { width: number; height: number } {
  const buf = fs.readFileSync(filePath);
  const sig = buf.subarray(0, 8);
  assert.deepEqual(
    Array.from(sig),
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    `${filePath} must be a valid PNG file`
  );
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

test('manifest.webmanifest satisfies Chrome installability and brand requirements', () => {
  const manifestPath = path.resolve(process.cwd(), 'public/manifest.webmanifest');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  assert.equal(manifest.id, '/');
  assert.equal(manifest.name, 'CUNY SPS Club Social Hub');
  assert.equal(manifest.short_name, 'Club Hub');
  assert.ok(manifest.short_name.length <= 12);
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.orientation, 'portrait');
  assert.equal(manifest.theme_color, '#0B0B0F');
  assert.equal(manifest.background_color, '#0B0B0F');

  assert.ok(Array.isArray(manifest.icons));
  const byKey = new Map(manifest.icons.map((i: any) => [`${i.sizes}:${i.purpose}`, i]));
  assert.ok(byKey.has('192x192:any'));
  assert.ok(byKey.has('512x512:any'));
  assert.ok(byKey.has('192x192:maskable'));
  assert.ok(byKey.has('512x512:maskable'));

  // Verify every referenced icon file exists and matches its declared PNG dimensions
  for (const icon of manifest.icons) {
    assert.equal(icon.type, 'image/png');
    const diskPath = path.resolve(process.cwd(), 'public', icon.src.replace(/^\//, ''));
    const [w, h] = String(icon.sizes).split('x').map(Number);
    const dims = readPngDimensions(diskPath);
    assert.deepEqual(dims, { width: w, height: h });
  }

  // Verify 180x180 apple-touch-icon PNG
  const appleDims = readPngDimensions(path.resolve(process.cwd(), 'public/apple-touch-icon.png'));
  assert.deepEqual(appleDims, { width: 180, height: 180 });
});

test('index.html links manifest.webmanifest and iOS PWA tags', () => {
  const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
  assert.match(html, /<link\s+rel="manifest"\s+href="\/manifest\.webmanifest"\s*\/?>/);
  assert.match(html, /<link\s+rel="apple-touch-icon"[^>]+href="\/apple-touch-icon\.png"/);
  assert.match(html, /<meta\s+name="apple-mobile-web-app-capable"\s+content="yes"\s*\/?>/);
  assert.match(html, /<meta\s+name="apple-mobile-web-app-title"\s+content="Club Hub"\s*\/?>/);
  assert.match(html, /<meta\s+name="theme-color"\s+content="#0B0B0F"\s*\/?>/);
});

test('service worker excludes /api responses, serves offline fallback, and supports update refresh', () => {
  const sw = fs.readFileSync(path.resolve(process.cwd(), 'public/sw.js'), 'utf8');
  assert.match(sw, /url\.pathname\.startsWith\('\/api\/'\)/);
  assert.match(sw, /caches\.match\('\/offline\.html'\)/);
  assert.match(sw, /SKIP_WAITING/);
  assert.equal(fs.existsSync(path.resolve(process.cwd(), 'public/offline.html')), true);
});

test('detectPWAEnvironment accurately distinguishes iOS Safari, iOS non-Safari, Android, and standalone', () => {
  const iosSafari = detectPWAEnvironment(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    'iPhone',
    5,
    false,
    false,
    false
  );
  assert.equal(iosSafari.isIOS, true);
  assert.equal(iosSafari.isIOSSafari, true);
  assert.equal(iosSafari.isIOSNonSafari, false);
  assert.equal(iosSafari.isStandalone, false);

  const iosChrome = detectPWAEnvironment(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1',
    'iPhone',
    5,
    false,
    false,
    false
  );
  assert.equal(iosChrome.isIOS, true);
  assert.equal(iosChrome.isIOSSafari, false);
  assert.equal(iosChrome.isIOSNonSafari, true);

  const androidStandalone = detectPWAEnvironment(
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36',
    'Linux armv8l',
    5,
    true,
    false,
    false
  );
  assert.equal(androidStandalone.isIOS, false);
  assert.equal(androidStandalone.isStandalone, true);
});
