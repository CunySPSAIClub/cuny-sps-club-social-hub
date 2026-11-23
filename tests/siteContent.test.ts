import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SITE_CONTENT,
  ALLOWED_FONT_NAMES,
  normalizeSiteContent,
  isValidHexColor,
  sanitizeHref,
  sanitizeImageSrc,
  createSectionFromTemplate,
} from '../src/data/siteContent.ts';
import {
  getAdminAuthStatus,
  hashAdminPassword,
  verifyAdminPassword,
  issueEditorSessionToken,
  verifyEditorSessionToken,
  revokeEditorSessionToken,
  extractBearerToken,
} from '../server/siteContentAuth.ts';

test('normalizeSiteContent falls back to defaults when input is empty or malformed', () => {
  const normalized = normalizeSiteContent(null);
  assert.equal(normalized.settings.siteName, DEFAULT_SITE_CONTENT.settings.siteName);
  assert.equal(normalized.settings.colors.primary, DEFAULT_SITE_CONTENT.settings.colors.primary);
  assert.equal(normalized.navigation.topNav.length, DEFAULT_SITE_CONTENT.navigation.topNav.length);
  assert.equal(normalized.footer.contactEmail, DEFAULT_SITE_CONTENT.footer.contactEmail);
});

test('normalizeSiteContent validates hex colors and restricts fonts to allowlist', () => {
  const normalized = normalizeSiteContent({
    settings: {
      colors: {
        primary: '#1a2b3c',
        secondary: 'not-a-color',
        accent: 'rgb(255,0,0)',
        background: '#fefefe',
        text: '#111',
      },
      fonts: {
        heading: 'Lora',
        body: 'EvilFont; } body { display:none',
        brand: 'Plus Jakarta Sans',
      },
    },
  });

  assert.equal(isValidHexColor('#1a2b3c'), true);
  assert.equal(isValidHexColor('#111'), false);
  assert.equal(normalized.settings.colors.primary, '#1a2b3c');
  assert.equal(normalized.settings.colors.secondary, DEFAULT_SITE_CONTENT.settings.colors.secondary);
  assert.equal(normalized.settings.colors.accent, DEFAULT_SITE_CONTENT.settings.colors.accent);
  assert.equal(normalized.settings.colors.background, '#fefefe');
  assert.equal(normalized.settings.colors.text, DEFAULT_SITE_CONTENT.settings.colors.text);

  assert.ok(ALLOWED_FONT_NAMES.has('Lora'));
  assert.equal(normalized.settings.fonts.heading, 'Lora');
  assert.equal(normalized.settings.fonts.body, DEFAULT_SITE_CONTENT.settings.fonts.body);
  assert.equal(normalized.settings.fonts.brand, 'Plus Jakarta Sans');
});

test('sanitizeHref blocks javascript and data URIs while allowing safe links', () => {
  assert.equal(sanitizeHref('https://sps.cuny.edu'), 'https://sps.cuny.edu');
  assert.equal(sanitizeHref('http://example.com/page'), 'http://example.com/page');
  assert.equal(sanitizeHref('mailto:studentlife@sps.cuny.edu'), 'mailto:studentlife@sps.cuny.edu');
  assert.equal(sanitizeHref('#public'), '#public');
  assert.equal(sanitizeHref('/assets/logo.png'), '/assets/logo.png');

  assert.equal(sanitizeHref('javascript:alert(1)'), '#');
  assert.equal(sanitizeHref('  JAVASCRIPT:void(0)'), '#');
  assert.equal(sanitizeHref('data:text/html,<script>alert(1)</script>'), '#');
  assert.equal(sanitizeHref('vbscript:msgbox(1)'), '#');
});

test('sanitizeImageSrc allows local paths, http(s), and raster data URLs but blocks SVG and scripts', () => {
  assert.equal(sanitizeImageSrc('/assets/aistudio/logo.png'), '/assets/aistudio/logo.png');
  assert.equal(sanitizeImageSrc('https://example.com/photo.jpg'), 'https://example.com/photo.jpg');
  const validPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB';
  assert.equal(sanitizeImageSrc(validPng), validPng);

  assert.equal(sanitizeImageSrc('javascript:alert(1)'), '');
  assert.equal(sanitizeImageSrc('data:text/html;base64,PHNjcmlwdD4='), '');
  assert.equal(sanitizeImageSrc('data:image/svg+xml;base64,PHN2Zz4='), '');
  assert.equal(sanitizeImageSrc('//evil.example/img.png'), '');
});

test('createSectionFromTemplate produces valid section structures for all templates', () => {
  const templates = ['text', 'image-text', 'card-grid', 'cta'] as const;
  for (const tpl of templates) {
    const sec = createSectionFromTemplate(tpl);
    assert.equal(sec.type, tpl);
    assert.equal(sec.visible, true);
    assert.ok(sec.id.length > 0);
    assert.ok(sec.heading.length > 0);
    if (tpl === 'card-grid') {
      assert.ok(Array.isArray(sec.cards) && sec.cards.length >= 2);
    }
  }
});

test('siteContentAuth handles unclaimed, claimed scrypt, and env password precedence', () => {
  const prevEnv = process.env.SITE_EDITOR_ADMIN_PASSWORD;
  try {
    delete process.env.SITE_EDITOR_ADMIN_PASSWORD;

    assert.deepEqual(getAdminAuthStatus(null), { configured: false, source: 'unclaimed' });
    assert.equal(verifyAdminPassword('anything', null), false);

    const stored = hashAdminPassword('CampusEditor!2026');
    assert.deepEqual(getAdminAuthStatus(stored), { configured: true, source: 'claimed' });
    assert.equal(verifyAdminPassword('CampusEditor!2026', stored), true);
    assert.equal(verifyAdminPassword('WrongPassword', stored), false);

    process.env.SITE_EDITOR_ADMIN_PASSWORD = 'EnvOverridePassword#99';
    assert.deepEqual(getAdminAuthStatus(stored), { configured: true, source: 'env' });
    assert.equal(verifyAdminPassword('EnvOverridePassword#99', stored), true);
    assert.equal(verifyAdminPassword('CampusEditor!2026', stored), false);
  } finally {
    if (prevEnv === undefined) {
      delete process.env.SITE_EDITOR_ADMIN_PASSWORD;
    } else {
      process.env.SITE_EDITOR_ADMIN_PASSWORD = prevEnv;
    }
  }
});

test('siteContentAuth issues, verifies, rejects tampered, and revokes bearer tokens', () => {
  const { token, expiresAt } = issueEditorSessionToken();
  assert.ok(token.includes('.'));
  assert.ok(Date.parse(expiresAt) > Date.now());
  assert.equal(verifyEditorSessionToken(token), true);

  // Tampered payload or signature must fail
  const [payload, sig] = token.split('.');
  const tampered = `${payload}.${sig.slice(0, -1)}${sig.endsWith('a') ? 'b' : 'a'}`;
  assert.equal(verifyEditorSessionToken(tampered), false);
  assert.equal(verifyEditorSessionToken('invalid-token'), false);

  // Extract bearer helper
  assert.equal(extractBearerToken(`Bearer ${token}`), token);
  assert.equal(extractBearerToken('Basic abc123'), null);
  assert.equal(extractBearerToken(undefined), null);

  // Revocation invalidates token immediately
  revokeEditorSessionToken(token);
  assert.equal(verifyEditorSessionToken(token), false);
});
