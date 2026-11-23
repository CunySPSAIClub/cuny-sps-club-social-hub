/**
 * Central authentication & onboarding configuration.
 *
 * - DEMO_MODE: defaults to ON (true) so demo sign-in personas keep working until
 *   you set DEMO_MODE=false in your environment variables / Settings -> Secrets.
 * - GOOGLE_CLIENT_ID: paste your Google OAuth 2.0 Web Client ID in one place
 *   (GOOGLE_CLIENT_ID env var, or directly below as GOOGLE_CLIENT_ID_SETTING).
 * - STUDENT_LIFE_ADMIN_EMAILS: authoritative list of @sps.cuny.edu staff emails
 *   that receive Student Life Admin access.
 */

// Optional single-setting override if you prefer setting it in code instead of .env:
export const GOOGLE_CLIENT_ID_SETTING = '';

export const ALLOWED_STUDENT_DOMAIN = '@spsmail.cuny.edu';
export const ALLOWED_STAFF_DOMAIN = '@sps.cuny.edu';

export const DEFAULT_STUDENT_LIFE_ADMIN_EMAILS = [
  'elena.vance@sps.cuny.edu',
  'marcus.sterling@sps.cuny.edu',
];

export const ONBOARDING_INTEREST_OPTIONS = [
  'AI & tech',
  'Careers',
  'Arts & design',
  'Wellness',
  'Gaming',
  'Volunteering',
  'Culture',
  'Entrepreneurship',
  'Writing',
  'Sports',
  'Music',
  'Faith',
] as const;

export const ALLOWED_INTEREST_SET = new Set<string>(ONBOARDING_INTEREST_OPTIONS);

export function isDemoModeEnabled(): boolean {
  const raw = (process.env.DEMO_MODE ?? 'true').trim().toLowerCase();
  return raw !== 'false' && raw !== '0' && raw !== 'off';
}

export function getGoogleClientId(): string {
  return (
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    process.env.VITE_GOOGLE_CLIENT_ID?.trim() ||
    GOOGLE_CLIENT_ID_SETTING.trim()
  );
}

export function getStudentLifeAdminEmails(): Set<string> {
  const envList = (process.env.STUDENT_LIFE_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return new Set<string>([...DEFAULT_STUDENT_LIFE_ADMIN_EMAILS, ...envList]);
}

export function classifyCunyEmail(
  rawEmail: string
): { valid: true; email: string; kind: 'student' | 'staff' } | { valid: false; error: string } {
  const email = (rawEmail ?? '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return { valid: false, error: 'Please use your CUNY SPS email.' };
  }
  if (email.endsWith(ALLOWED_STUDENT_DOMAIN)) {
    return { valid: true, email, kind: 'student' };
  }
  if (email.endsWith(ALLOWED_STAFF_DOMAIN)) {
    return { valid: true, email, kind: 'staff' };
  }
  return { valid: false, error: 'Please use your CUNY SPS email.' };
}

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const cleaned = (fullName ?? '').trim().replace(/\s+/g, ' ');
  if (!cleaned) return { firstName: 'Student', lastName: '' };
  const parts = cleaned.split(' ');
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  // Preserve academic prefixes like "Dr." or "Prof." with the first name
  if (/^(dr\.|prof\.|mr\.|ms\.|mrs\.)$/i.test(parts[0]) && parts.length >= 3) {
    return {
      firstName: `${parts[0]} ${parts[1]}`,
      lastName: parts.slice(2).join(' '),
    };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}
