import assert from 'node:assert/strict';
import test from 'node:test';
import { canEditClubLinks, canViewClubWhatsAppLink } from '../server/rbac.ts';
import type { ClubMembership, ClubLinksConfig, User } from '../src/types.ts';
import {
  FIXED_CLUB_LINK_ORDER,
  createDefaultClubLinks,
  createSeedAiClubLinks,
  diffClubLinks,
  sanitizeClubLinksForPublic,
  validateClubLinks,
} from '../src/utils/clubLinks.ts';

test('seed AI club links match required order, active states, and additional link', () => {
  const seeded = createSeedAiClubLinks();
  assert.deepEqual(
    seeded.fixed.map((r) => r.key),
    ['website', 'facebook', 'instagram', 'tiktok', 'whatsapp']
  );
  assert.deepEqual(FIXED_CLUB_LINK_ORDER, ['website', 'facebook', 'instagram', 'tiktok', 'whatsapp']);

  const byKey = new Map(seeded.fixed.map((r) => [r.key, r]));
  assert.equal(byKey.get('website')?.active, true);
  assert.equal(byKey.get('facebook')?.active, true);
  assert.equal(byKey.get('instagram')?.active, true);
  assert.equal(byKey.get('tiktok')?.active, false);
  assert.equal(byKey.get('whatsapp')?.active, true);

  assert.equal(seeded.additional.length, 1);
  assert.equal(seeded.additional[0].label, 'Project Showcase');
  assert.equal(seeded.additional[0].active, false);

  const validation = validateClubLinks(seeded);
  assert.equal(validation.valid, true);
});

test('validation enforces https://, domain rules, field lengths, and max 10 additional links', () => {
  const base = createDefaultClubLinks();

  // Inactive fixed rows with empty URLs are valid
  assert.equal(validateClubLinks(base).valid, true);

  // Active fixed rows require valid https:// and exact platform domains
  const invalidLinks: ClubLinksConfig = {
    fixed: [
      { key: 'website', active: true, url: 'http://sps.cuny.edu', description: 'a'.repeat(101) },
      { key: 'facebook', active: true, url: 'https://evilfacebook.com/page', description: '' },
      { key: 'instagram', active: true, url: 'https://instagram.com.evil.com/ai', description: '' },
      { key: 'tiktok', active: true, url: 'https://example.com/@ai', description: '' },
      { key: 'whatsapp', active: true, url: 'https://whatsapp.com/group', description: '' },
    ],
    additional: [
      { id: 'a1', label: '', url: 'http://bad.example.com', description: 'b'.repeat(101), active: true },
      { id: 'a2', label: 'x'.repeat(41), url: '', description: '', active: false },
    ],
  };

  const res = validateClubLinks(invalidLinks);
  assert.equal(res.valid, false);
  assert.ok(res.fixedErrors.website?.url);
  assert.ok(res.fixedErrors.website?.description);
  assert.ok(res.fixedErrors.facebook?.url);
  assert.ok(res.fixedErrors.instagram?.url);
  assert.ok(res.fixedErrors.tiktok?.url);
  assert.ok(res.fixedErrors.whatsapp?.url);
  assert.ok(res.additionalErrors.a1?.label);
  assert.ok(res.additionalErrors.a1?.url);
  assert.ok(res.additionalErrors.a1?.description);
  assert.ok(res.additionalErrors.a2?.label);
  assert.ok(res.additionalErrors.a2?.url);

  // Valid fb.com, subdomains, and chat.whatsapp.com pass
  const validLinks: ClubLinksConfig = {
    fixed: [
      { key: 'website', active: true, url: 'https://sps.cuny.edu', description: 'Club home' },
      { key: 'facebook', active: true, url: 'https://fb.com/cunysps', description: '' },
      { key: 'instagram', active: true, url: 'https://www.instagram.com/cunysps', description: '' },
      { key: 'tiktok', active: true, url: 'https://www.tiktok.com/@cunysps', description: '' },
      { key: 'whatsapp', active: true, url: 'https://chat.whatsapp.com/ABC123xyz', description: '' },
    ],
    additional: Array.from({ length: 10 }, (_, idx) => ({
      id: `link-${idx}`,
      label: `Resource ${idx + 1}`,
      url: `https://example.org/r/${idx + 1}`,
      description: 'Valid note',
      active: true,
    })),
  };
  assert.equal(validateClubLinks(validLinks).valid, true);

  // 11 additional links fails
  const tooMany: ClubLinksConfig = {
    ...validLinks,
    additional: [
      ...validLinks.additional,
      { id: 'link-11', label: 'Extra', url: 'https://example.org/11', description: '', active: true },
    ],
  };
  const tooManyRes = validateClubLinks(tooMany);
  assert.equal(tooManyRes.valid, false);
  assert.ok(tooManyRes.formError);
});

test('permissions allow active CLUB_LEAD, EDITOR, CONTRIBUTOR, and Student Life admins, and reject VIEWER and non-members', () => {
  const member = { userId: 'u-1', status: 'Active', systemRole: 'STANDARD_USER' } as User;
  const superAdmin = { userId: 'u-sa', status: 'Active', systemRole: 'SL_SUPER_ADMIN' } as User;
  const scopedAdmin = {
    userId: 'u-adm',
    status: 'Active',
    systemRole: 'SL_ADMIN',
    assignedAdminClubIds: ['club-ai'],
  } as User;

  const makeMembership = (role: ClubMembership['role'], status: ClubMembership['status'] = 'Active') =>
    [{ userId: member.userId, clubId: 'club-ai', role, status }] as ClubMembership[];

  assert.equal(canEditClubLinks(member, 'club-ai', makeMembership('CLUB_LEAD')), true);
  assert.equal(canEditClubLinks(member, 'club-ai', makeMembership('EDITOR')), true);
  assert.equal(canEditClubLinks(member, 'club-ai', makeMembership('CONTRIBUTOR')), true);
  assert.equal(canEditClubLinks(member, 'club-ai', makeMembership('VIEWER')), false);
  assert.equal(canEditClubLinks(member, 'club-other', makeMembership('CLUB_LEAD')), false);
  assert.equal(canEditClubLinks(member, 'club-ai', makeMembership('CLUB_LEAD', 'Revoked')), false);
  assert.equal(canEditClubLinks({ ...member, status: 'Revoked' } as User, 'club-ai', makeMembership('CLUB_LEAD')), false);

  // Student Life admins can edit any club's links
  assert.equal(canEditClubLinks(superAdmin, 'club-any', []), true);
  assert.equal(canEditClubLinks(scopedAdmin, 'club-any', []), true);
  assert.equal(canEditClubLinks({ ...scopedAdmin, status: 'Revoked' } as User, 'club-any', []), false);
});

test('privacy strips WhatsApp invite link on public payload and restricts viewing to club members or admins', () => {
  const seeded = createSeedAiClubLinks();
  const sanitized = sanitizeClubLinksForPublic(seeded);
  const wa = sanitized.fixed.find((f) => f.key === 'whatsapp');
  assert.equal(wa?.active, true);
  assert.equal(wa?.url, '');

  const member = { userId: 'u-1', status: 'Active', systemRole: 'STANDARD_USER' } as User;
  const viewerMem = [{ userId: 'u-1', clubId: 'club-ai', role: 'VIEWER', status: 'Active' }] as ClubMembership[];
  assert.equal(canViewClubWhatsAppLink(null, 'club-ai', viewerMem), false);
  assert.equal(canViewClubWhatsAppLink(member, 'club-other', viewerMem), false);
  assert.equal(canViewClubWhatsAppLink(member, 'club-ai', viewerMem), true);
});

test('diffClubLinks reports fixed link toggles, URL edits, and additional link reorder/add/remove', () => {
  const prev = createSeedAiClubLinks();
  const next: ClubLinksConfig = {
    fixed: prev.fixed.map((r) =>
      r.key === 'tiktok'
        ? { ...r, active: true, url: 'https://www.tiktok.com/@cunyspsai' }
        : r
    ),
    additional: [
      { id: 'link-2', label: 'GitHub', url: 'https://github.com/cunysps-ai', description: '', active: true },
      prev.additional[0],
    ],
  };

  const changes = diffClubLinks(prev, next);
  assert.ok(changes.some((c) => c.includes('TikTok') && c.includes('activated')));
  assert.ok(changes.some((c) => c.includes('GitHub') && c.includes('added')));
});
