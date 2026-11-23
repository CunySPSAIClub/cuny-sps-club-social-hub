export type SectionTemplateType = 'text' | 'image-text' | 'card-grid' | 'cta';

export interface EditableLinkData {
  label: string;
  href: string;
}

export interface EditableImageData {
  src: string;
  alt: string;
}

export interface CustomSectionCard {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  imageAlt?: string;
  linkLabel?: string;
  linkHref?: string;
}

export interface PageSection {
  id: string;
  type: SectionTemplateType;
  visible: boolean;
  eyebrow?: string;
  heading: string;
  body: string;
  image?: EditableImageData;
  imagePosition?: 'left' | 'right';
  primaryCta?: EditableLinkData;
  secondaryCta?: EditableLinkData;
  cards?: CustomSectionCard[];
}

export interface TopNavItem {
  id: string;
  label: string;
  target: string;
  kind: 'builtin-login' | 'builtin-directory' | 'custom-page' | 'external';
  visible: boolean;
}

export interface PortalNavItemConfig {
  id: string;
  label: string;
  section: string;
  visible: boolean;
  customUrl?: string;
  customPageId?: string;
}

export interface SocialFooterLink {
  id: string;
  label: string;
  url: string;
}

export interface CustomPage {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  visible: boolean;
  sections: PageSection[];
}

export interface PageRegistryItem {
  id: string;
  title: string;
  slug: string;
  visible: boolean;
  isBuiltin: boolean;
  builtinTarget?: 'login' | 'directory' | 'portal';
}

export interface OverviewShortcutItem {
  id: string;
  tab: string;
  label: string;
  detail: string;
}

export interface SiteBrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface SiteFontsConfig {
  heading: string;
  body: string;
  brand: string;
}

export interface SiteSettingsContent {
  siteName: string;
  browserTitle: string;
  tagline: string;
  sidebarSubtitle: string;
  pilotBadgeSubtitle: string;
  logoUrl: string;
  logoAlt: string;
  partnerLogoUrl: string;
  partnerLogoAlt: string;
  faviconUrl: string;
  colors: SiteBrandColors;
  fonts: SiteFontsConfig;
}

export interface SiteFooterContent {
  text: string;
  subtext: string;
  contactEmail: string;
  socialLinks: SocialFooterLink[];
}

export interface LandingPageContent {
  headerStatusText: string;
  partnerClubName: string;
  partnerClubRole: string;
  partnerClubLogoUrl: string;
  partnerClubLogoAlt: string;
  eyebrow: string;
  headline: string;
  leadParagraph: string;
  browseEventsCta: EditableLinkData;
  loginCardHeading: string;
  loginCardSubtext: string;
  emailFieldLabel: string;
  loginSubmitLabel: string;
  quickLaunchLabel: string;
  adminConsoleBtnLabel: string;
  clubPortalBtnLabel: string;
  securityNote1: string;
  securityNote2: string;
  personaDirectoryHeading: string;
  personaDirectorySubtext: string;
  enterPortalBtnLabel: string;
  sectionVisibility: {
    hero: boolean;
    loginCard: boolean;
    personaDirectory: boolean;
  };
  sectionOrder: ('hero' | 'loginCard' | 'personaDirectory')[];
  customSections: PageSection[];
}

export interface PublicDirectoryPageContent {
  heroTitle: string;
  heroDescription: string;
  requestJoinCtaLabel: string;
  memberSignInLabel: string;
  eventsSectionTitle: string;
  blogSectionTitle: string;
  clubsSectionTitle: string;
  sectionVisibility: {
    hero: boolean;
    events: boolean;
    blog: boolean;
    clubs: boolean;
  };
  sectionOrder: ('hero' | 'events' | 'blog' | 'clubs')[];
  customSections: PageSection[];
}

export interface PortalChromeContent {
  adminPortalBreadcrumb: string;
  clubPortalBreadcrumb: string;
  demoBannerTitle: string;
  demoBannerText: string;
  searchLabel: string;
  searchPlaceholder: string;
  switchIdentityLabel: string;
  notificationsLabel: string;
  announcementsBannerPrefix: string;
  announcementsBannerSuffix: string;
  clubDashboardHeading: string;
  upcomingEventsHeading: string;
  customSections: PageSection[];
}

export interface ClubOverviewPageContent {
  clubBlogBtnLabel: string;
  editProfileBtnLabel: string;
  charterPdfBtnLabel: string;
  charterCsvBtnLabel: string;
  createPostBtnLabel: string;
  scheduledPostsHeading: string;
  draftsHeading: string;
  activityHeading: string;
  shortcuts: OverviewShortcutItem[];
  sectionVisibility: {
    clubLinks: boolean;
    publishingGrid: boolean;
    shortcuts: boolean;
    budgetAndAdvisor: boolean;
    accountsAndEngagement: boolean;
    notifications: boolean;
  };
  customSections: PageSection[];
}

export interface SiteContent {
  version: number;
  settings: SiteSettingsContent;
  navigation: {
    topNav: TopNavItem[];
    adminNav: PortalNavItemConfig[];
    clubNav: PortalNavItemConfig[];
  };
  footer: SiteFooterContent;
  pageRegistry: PageRegistryItem[];
  pages: {
    landing: LandingPageContent;
    publicDirectory: PublicDirectoryPageContent;
    portal: PortalChromeContent;
    clubOverview: ClubOverviewPageContent;
  };
  customPages: CustomPage[];
}

export const GOOGLE_FONT_OPTIONS = [
  {
    name: 'Plus Jakarta Sans',
    googleSpec: 'Plus+Jakarta+Sans:wght@400;500;600;700;800',
    category: 'Sans-Serif (Modern)',
  },
  {
    name: 'Public Sans',
    googleSpec: 'Public+Sans:wght@400;500;600;700',
    category: 'Sans-Serif (Civic)',
  },
  {
    name: 'Archivo',
    googleSpec: 'Archivo:wght@500;600;700;800',
    category: 'Display Sans',
  },
  {
    name: 'DM Sans',
    googleSpec: 'DM+Sans:wght@400;500;600;700',
    category: 'Sans-Serif (Clean)',
  },
  {
    name: 'Manrope',
    googleSpec: 'Manrope:wght@400;500;600;700;800',
    category: 'Sans-Serif (Geometric)',
  },
  {
    name: 'Outfit',
    googleSpec: 'Outfit:wght@400;500;600;700',
    category: 'Display Sans',
  },
  {
    name: 'IBM Plex Sans',
    googleSpec: 'IBM+Plex+Sans:wght@400;500;600;700',
    category: 'Sans-Serif (Institutional)',
  },
  {
    name: 'Space Grotesk',
    googleSpec: 'Space+Grotesk:wght@400;500;600;700',
    category: 'Display Sans',
  },
  {
    name: 'Lora',
    googleSpec: 'Lora:wght@400;500;600;700',
    category: 'Serif (Editorial)',
  },
  {
    name: 'Merriweather',
    googleSpec: 'Merriweather:wght@400;700',
    category: 'Serif (Academic)',
  },
] as const;

export const ALLOWED_FONT_NAMES = new Set<string>(GOOGLE_FONT_OPTIONS.map((f) => f.name));

export const DEFAULT_SITE_CONTENT: SiteContent = {
  version: 1,
  settings: {
    siteName: 'Club Social Hub',
    browserTitle: 'CUNY SPS Club Social Hub',
    tagline: 'CUNY SPS · Office of Student Life',
    sidebarSubtitle: 'CUNY SPS · Student Life',
    pilotBadgeSubtitle: 'A CUNY SPS AI Club Engineering Pilot',
    logoUrl: '',
    logoAlt: 'CUNY SPS Club Social Hub logo',
    partnerLogoUrl: '/assets/aistudio/concept_idea_2_final-01_a0d17aff.png',
    partnerLogoAlt: 'CUNY SPS Office of Student Life',
    faviconUrl: '/club-social-hub-mark.svg',
    colors: {
      primary: '#004b87',
      secondary: '#0b0b0f',
      accent: '#c4f500',
      background: '#f8fafc',
      text: '#0f172a',
    },
    fonts: {
      heading: 'Plus Jakarta Sans',
      body: 'Public Sans',
      brand: 'Archivo',
    },
  },
  navigation: {
    topNav: [
      {
        id: 'nav-login',
        label: 'Demo Sign-In',
        target: 'login',
        kind: 'builtin-login',
        visible: true,
      },
      {
        id: 'nav-directory',
        label: 'Public Events & Join Clubs',
        target: 'directory',
        kind: 'builtin-directory',
        visible: true,
      },
    ],
    adminNav: [
      { id: 'dashboard', label: 'Student Life Console', section: 'Student Life Governance (L1)', visible: true },
      { id: 'clubs', label: 'Clubs & Membership', section: 'Student Life Governance (L1)', visible: true },
      { id: 'account-requests', label: 'Account Requests', section: 'Student Life Governance (L1)', visible: true },
      { id: 'club-leaders', label: 'Club Leaders', section: 'Student Life Governance (L1)', visible: true },
      { id: 'social-accounts', label: 'Social Accounts', section: 'Student Life Governance (L1)', visible: true },
      { id: 'users-permissions', label: 'Users & Access Control', section: 'Student Life Governance (L1)', visible: true },
      { id: 'activity-logs', label: 'Audit Logs', section: 'Student Life Governance (L1)', visible: true },
      { id: 'reports', label: 'Governance Reports', section: 'Student Life Governance (L1)', visible: true },
      { id: 'settings', label: 'Platform Settings', section: 'Student Life Governance (L1)', visible: true },
      { id: 'club-dashboard', label: 'Club Overview Table', section: 'Campus & Club Oversight (L2)', visible: true },
      { id: 'club-announcements', label: 'Club Announcements', section: 'Campus & Club Oversight (L2)', visible: true },
      { id: 'upcoming-events', label: 'Upcoming Events', section: 'Campus & Club Oversight (L2)', visible: true },
      { id: 'event-calendar', label: 'Club Event Calendar', section: 'Campus & Club Oversight (L2)', visible: true },
      { id: 'event-analytics', label: 'Event Analytics', section: 'Campus & Club Oversight (L2)', visible: true },
      { id: 'event-reminders', label: 'Email Reminders', section: 'Campus & Club Oversight (L2)', visible: true },
      { id: 'club-forums', label: 'Club Forums', section: 'Campus & Club Oversight (L2)', visible: true },
      { id: 'project-tasks', label: 'Project Tasks', section: 'Campus & Club Oversight (L2)', visible: true },
      { id: 'member-directory', label: 'Member Directory', section: 'Campus & Club Oversight (L2)', visible: true },
      { id: 'messaging-center', label: 'Club Messaging Center', section: 'Campus & Club Oversight (L2)', visible: true },
      { id: 'club-blog', label: 'Club Blog', section: 'Campus & Club Oversight (L2)', visible: true },
      { id: 'campus-directory', label: 'Campus Directory', section: 'Campus & Club Oversight (L2)', visible: true },
      { id: 'club-resources', label: 'Club Resources', section: 'Campus & Club Oversight (L2)', visible: true },
      { id: 'ai-assistant', label: 'AI Assistant', section: 'Campus & Club Oversight (L2)', visible: true },
    ],
    clubNav: [
      { id: 'overview', label: 'Overview', section: 'Workspace', visible: true },
      { id: 'club-announcements', label: 'Club Announcements', section: 'Workspace', visible: true },
      { id: 'create-post', label: 'Create Post', section: 'Social Publishing', visible: true },
      { id: 'calendar', label: 'Content Calendar', section: 'Social Publishing', visible: true },
      { id: 'social-accounts', label: 'My Social Accounts', section: 'Social Publishing', visible: true },
      { id: 'ai-assistant', label: 'AI Assistant', section: 'Social Publishing', visible: true },
      { id: 'inbox', label: 'Inbox', section: 'Social Publishing', visible: true },
      { id: 'analytics', label: 'Analytics', section: 'Social Publishing', visible: true },
      { id: 'upcoming-events', label: 'Upcoming Events', section: 'Club Community', visible: true },
      { id: 'event-calendar', label: 'Club Event Calendar', section: 'Club Community', visible: true },
      { id: 'event-analytics', label: 'Event Analytics', section: 'Club Community', visible: true },
      { id: 'event-reminders', label: 'Email Reminders', section: 'Club Community', visible: true },
      { id: 'club-forums', label: 'Club Forums', section: 'Club Community', visible: true },
      { id: 'ask-club', label: 'Ask the Club', section: 'Club Community', visible: true },
      { id: 'member-questions', label: 'Member Questions', section: 'Club Community', visible: true },
      { id: 'messaging-center', label: 'Messaging Center', section: 'Club Community', visible: true },
      { id: 'whatsapp', label: 'WhatsApp Group', section: 'Club Community', visible: true },
      { id: 'club-blog', label: 'Club Blog', section: 'Club Community', visible: true },
      { id: 'project-tasks', label: 'Project Tasks', section: 'Club Community', visible: true },
      { id: 'club-dashboard', label: 'Club Dashboard', section: 'Administration', visible: true },
      { id: 'member-directory', label: 'Member Directory', section: 'Administration', visible: true },
      { id: 'team', label: 'Team Management', section: 'Administration', visible: true },
      { id: 'account-requests', label: 'Account Requests', section: 'Administration', visible: true },
      { id: 'club-resources', label: 'Club Resources', section: 'Administration', visible: true },
      { id: 'campus-directory', label: 'Campus Directory', section: 'Administration', visible: true },
      { id: 'settings', label: 'Settings', section: 'Administration', visible: true },
    ],
  },
  footer: {
    text: '© 2026 CUNY School of Professional Studies · Office of Student Life',
    subtext: 'Centralized governance, events, and communications for CUNY SPS student organizations.',
    contactEmail: 'studentlife@sps.cuny.edu',
    socialLinks: [
      {
        id: 'soc-sps',
        label: 'CUNY SPS Student Life',
        url: 'https://sps.cuny.edu/student-services/student-life/student-clubs-and-organizations',
      },
      {
        id: 'soc-ig',
        label: 'Instagram',
        url: 'https://www.instagram.com/cunysps',
      },
      {
        id: 'soc-li',
        label: 'LinkedIn',
        url: 'https://www.linkedin.com/school/cuny-school-of-professional-studies/',
      },
    ],
  },
  pageRegistry: [
    {
      id: 'page-login',
      title: 'Home & Demo Sign-In',
      slug: 'home',
      visible: true,
      isBuiltin: true,
      builtinTarget: 'login',
    },
    {
      id: 'page-directory',
      title: 'Public Events & Join Clubs',
      slug: 'public',
      visible: true,
      isBuiltin: true,
      builtinTarget: 'directory',
    },
  ],
  pages: {
    landing: {
      headerStatusText: 'Demonstration — institutional SSO not connected',
      partnerClubName: 'Artificial Intelligence Club',
      partnerClubRole: 'Pilot Build Partner',
      partnerClubLogoUrl: '/assets/aistudio/c40622e2-7fb5-4f17-b219-706c74628073_ba47136b.jpg',
      partnerClubLogoAlt: 'Artificial Intelligence Club profile picture',
      eyebrow: 'CUNY School of Professional Studies',
      headline: 'Centralized social media governance and publishing for student clubs',
      leadParagraph:
        'Explore example workspaces for student officers, faculty advisors, and Student Life administrators. This demonstration uses synthetic identities and is not ready for real student records or official social publishing.',
      browseEventsCta: {
        label: 'Browse Approved Club Events & Request to Join',
        href: '#public',
      },
      loginCardHeading: 'Demo Workspace Access',
      loginCardSubtext:
        'Explore with a listed demo @sps.cuny.edu or @spsmail.cuny.edu address.',
      emailFieldLabel: 'CUNY Institutional Email',
      loginSubmitLabel: 'Enter Demo Workspace',
      quickLaunchLabel: 'Quick Demo Portal Launch',
      adminConsoleBtnLabel: 'Student Life Admin Console',
      clubPortalBtnLabel: 'Club Officer Workspace',
      securityNote1: 'Demo role restrictions — institutional security review outstanding',
      securityNote2: 'Do not enter passwords or real social account credentials',
      personaDirectoryHeading: 'Demo Persona Directory',
      personaDirectorySubtext:
        'Choose a synthetic persona to explore permissions. This does not verify your identity.',
      enterPortalBtnLabel: 'Enter Portal',
      sectionVisibility: {
        hero: true,
        loginCard: true,
        personaDirectory: true,
      },
      sectionOrder: ['hero', 'loginCard', 'personaDirectory'],
      customSections: [],
    },
    publicDirectory: {
      heroTitle: 'Approved Campus Club Events & Membership Directory',
      heroDescription:
        'Browse officially approved CUNY SPS student club events and activities, export dates to your calendar, and submit a Request to Join application for any club.',
      requestJoinCtaLabel: 'Request to Join a Club',
      memberSignInLabel: 'Member Sign-In',
      eventsSectionTitle: 'Approved Club Events & Campus Activities',
      blogSectionTitle: 'Club Blog Stories & Event Recaps',
      clubsSectionTitle: 'Recognized Student Clubs & Membership Applications',
      sectionVisibility: {
        hero: true,
        events: true,
        blog: true,
        clubs: true,
      },
      sectionOrder: ['hero', 'events', 'blog', 'clubs'],
      customSections: [],
    },
    portal: {
      adminPortalBreadcrumb: 'University Administration Portal',
      clubPortalBreadcrumb: 'Club Management Portal',
      demoBannerTitle: 'Demonstration workspace.',
      demoBannerText:
        'Persona sign-in does not verify institutional identity. Sample account, publishing and analytics records are not evidence of live integrations. Do not enter confidential student information.',
      searchLabel: 'Find a page or tool',
      searchPlaceholder: 'Search posts, members, reminders…',
      switchIdentityLabel: 'Switch Identity / Sign Out',
      notificationsLabel: 'Notifications',
      announcementsBannerPrefix: 'Student Life announcements',
      announcementsBannerSuffix: 'View updates and deadlines →',
      clubDashboardHeading: 'Club Dashboard — Active Student Clubs & Governance Status',
      upcomingEventsHeading: 'Upcoming Club Events & Meetings',
      customSections: [],
    },
    clubOverview: {
      clubBlogBtnLabel: 'Club Blog',
      editProfileBtnLabel: 'Edit Profile & Picture',
      charterPdfBtnLabel: 'Charter Renewal PDF',
      charterCsvBtnLabel: 'CSV',
      createPostBtnLabel: 'Create Post',
      scheduledPostsHeading: 'Upcoming Scheduled Posts',
      draftsHeading: 'Drafts & Peer Review Queue',
      activityHeading: 'Recorded Publishing Activity',
      shortcuts: [
        {
          id: 'sc-events',
          tab: 'upcoming-events',
          label: 'Upcoming events',
          detail: 'View event schedule and RSVPs',
        },
        {
          id: 'sc-messaging',
          tab: 'messaging-center',
          label: 'Messaging Center',
          detail: 'Broadcasts and replies',
        },
        {
          id: 'sc-whatsapp',
          tab: 'whatsapp',
          label: 'WhatsApp Group',
          detail: 'Linked groups & share links',
        },
        {
          id: 'sc-resources',
          tab: 'club-resources',
          label: 'Club Resources',
          detail: 'Forms and submissions',
        },
      ],
      sectionVisibility: {
        clubLinks: true,
        publishingGrid: true,
        shortcuts: true,
        budgetAndAdvisor: true,
        accountsAndEngagement: true,
        notifications: true,
      },
      customSections: [],
    },
  },
  customPages: [],
};

export function cloneSiteContent(content: SiteContent): SiteContent {
  return JSON.parse(JSON.stringify(content)) as SiteContent;
}

export function isValidHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

export function sanitizeHref(raw: string | undefined | null): string {
  const val = (raw ?? '').trim();
  if (!val) return '#';
  if (val.startsWith('#') || val.startsWith('/')) {
    return val;
  }
  const lower = val.toLowerCase();
  if (
    lower.startsWith('https://') ||
    lower.startsWith('http://') ||
    lower.startsWith('mailto:')
  ) {
    return val;
  }
  return '#';
}

export function sanitizeImageSrc(raw: string | undefined | null): string {
  const val = (raw ?? '').trim();
  if (!val) return '';
  if (val.startsWith('/') && !val.startsWith('//')) {
    return val;
  }
  const lower = val.toLowerCase();
  if (lower.startsWith('https://') || lower.startsWith('http://')) {
    return val;
  }
  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(val)) {
    return val;
  }
  return '';
}

function safeString(value: unknown, fallback: string, maxLength = 2000): string {
  if (typeof value !== 'string') return fallback;
  return value.slice(0, maxLength);
}

function normalizePageSection(raw: unknown, idx: number): PageSection | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const type = obj.type;
  if (type !== 'text' && type !== 'image-text' && type !== 'card-grid' && type !== 'cta') {
    return null;
  }
  const id = safeString(obj.id, `sec-${Date.now()}-${idx}`, 80).trim() || `sec-${idx}`;
  const cardsRaw = Array.isArray(obj.cards) ? obj.cards : [];
  const cards: CustomSectionCard[] = cardsRaw
    .slice(0, 24)
    .map((c, cIdx) => {
      const co = (c && typeof c === 'object' ? c : {}) as Record<string, unknown>;
      return {
        id: safeString(co.id, `card-${cIdx + 1}`, 80).trim() || `card-${cIdx + 1}`,
        title: safeString(co.title, 'Card Title', 160),
        description: safeString(co.description, '', 600),
        imageUrl: sanitizeImageSrc(typeof co.imageUrl === 'string' ? co.imageUrl : ''),
        imageAlt: safeString(co.imageAlt, '', 160),
        linkLabel: safeString(co.linkLabel, '', 80),
        linkHref: typeof co.linkHref === 'string' && co.linkHref.trim() ? sanitizeHref(co.linkHref) : '',
      };
    });

  const imgObj = obj.image && typeof obj.image === 'object' ? (obj.image as Record<string, unknown>) : null;
  const pCta = obj.primaryCta && typeof obj.primaryCta === 'object' ? (obj.primaryCta as Record<string, unknown>) : null;
  const sCta = obj.secondaryCta && typeof obj.secondaryCta === 'object' ? (obj.secondaryCta as Record<string, unknown>) : null;

  return {
    id,
    type,
    visible: obj.visible !== false,
    eyebrow: safeString(obj.eyebrow, '', 120),
    heading: safeString(obj.heading, 'Section Heading', 200),
    body: safeString(obj.body, '', 4000),
    image: imgObj
      ? {
          src: sanitizeImageSrc(typeof imgObj.src === 'string' ? imgObj.src : ''),
          alt: safeString(imgObj.alt, '', 200),
        }
      : undefined,
    imagePosition: obj.imagePosition === 'right' ? 'right' : 'left',
    primaryCta: pCta
      ? {
          label: safeString(pCta.label, 'Learn More', 80),
          href: sanitizeHref(typeof pCta.href === 'string' ? pCta.href : '#'),
        }
      : undefined,
    secondaryCta: sCta
      ? {
          label: safeString(sCta.label, '', 80),
          href: sanitizeHref(typeof sCta.href === 'string' ? sCta.href : '#'),
        }
      : undefined,
    cards: type === 'card-grid' ? cards : undefined,
  };
}

function normalizeSectionList(raw: unknown): PageSection[] {
  if (!Array.isArray(raw)) return [];
  const out: PageSection[] = [];
  for (let i = 0; i < Math.min(raw.length, 30); i++) {
    const sec = normalizePageSection(raw[i], i);
    if (sec) out.push(sec);
  }
  return out;
}

export function normalizeSiteContent(raw?: unknown): SiteContent {
  const def = cloneSiteContent(DEFAULT_SITE_CONTENT);
  if (!raw || typeof raw !== 'object') return def;
  const src = raw as Record<string, unknown>;

  // Settings
  const s = (src.settings && typeof src.settings === 'object' ? src.settings : {}) as Record<string, unknown>;
  const c = (s.colors && typeof s.colors === 'object' ? s.colors : {}) as Record<string, unknown>;
  const f = (s.fonts && typeof s.fonts === 'object' ? s.fonts : {}) as Record<string, unknown>;

  const headingFont = safeString(f.heading, def.settings.fonts.heading, 60);
  const bodyFont = safeString(f.body, def.settings.fonts.body, 60);
  const brandFont = safeString(f.brand, def.settings.fonts.brand, 60);

  def.settings = {
    siteName: safeString(s.siteName, def.settings.siteName, 120),
    browserTitle: safeString(s.browserTitle, def.settings.browserTitle, 140),
    tagline: safeString(s.tagline, def.settings.tagline, 160),
    sidebarSubtitle: safeString(s.sidebarSubtitle, def.settings.sidebarSubtitle, 120),
    pilotBadgeSubtitle: safeString(s.pilotBadgeSubtitle, def.settings.pilotBadgeSubtitle, 160),
    logoUrl: sanitizeImageSrc(typeof s.logoUrl === 'string' ? s.logoUrl : def.settings.logoUrl),
    logoAlt: safeString(s.logoAlt, def.settings.logoAlt, 160),
    partnerLogoUrl:
      sanitizeImageSrc(typeof s.partnerLogoUrl === 'string' ? s.partnerLogoUrl : def.settings.partnerLogoUrl) ||
      def.settings.partnerLogoUrl,
    partnerLogoAlt: safeString(s.partnerLogoAlt, def.settings.partnerLogoAlt, 160),
    faviconUrl:
      sanitizeImageSrc(typeof s.faviconUrl === 'string' ? s.faviconUrl : def.settings.faviconUrl) ||
      def.settings.faviconUrl,
    colors: {
      primary:
        typeof c.primary === 'string' && isValidHexColor(c.primary)
          ? c.primary.trim()
          : def.settings.colors.primary,
      secondary:
        typeof c.secondary === 'string' && isValidHexColor(c.secondary)
          ? c.secondary.trim()
          : def.settings.colors.secondary,
      accent:
        typeof c.accent === 'string' && isValidHexColor(c.accent)
          ? c.accent.trim()
          : def.settings.colors.accent,
      background:
        typeof c.background === 'string' && isValidHexColor(c.background)
          ? c.background.trim()
          : def.settings.colors.background,
      text:
        typeof c.text === 'string' && isValidHexColor(c.text)
          ? c.text.trim()
          : def.settings.colors.text,
    },
    fonts: {
      heading: ALLOWED_FONT_NAMES.has(headingFont) ? headingFont : def.settings.fonts.heading,
      body: ALLOWED_FONT_NAMES.has(bodyFont) ? bodyFont : def.settings.fonts.body,
      brand: ALLOWED_FONT_NAMES.has(brandFont) ? brandFont : def.settings.fonts.brand,
    },
  };

  // Navigation
  const nav = (src.navigation && typeof src.navigation === 'object' ? src.navigation : {}) as Record<string, unknown>;
  if (Array.isArray(nav.topNav) && nav.topNav.length > 0) {
    def.navigation.topNav = nav.topNav.slice(0, 20).map((item, idx) => {
      const o = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
      const kind =
        o.kind === 'builtin-login' ||
        o.kind === 'builtin-directory' ||
        o.kind === 'custom-page' ||
        o.kind === 'external'
          ? o.kind
          : 'external';
      const target =
        kind === 'external'
          ? sanitizeHref(typeof o.target === 'string' ? o.target : '#')
          : safeString(o.target, 'login', 120);
      return {
        id: safeString(o.id, `top-nav-${idx + 1}`, 80).trim() || `top-nav-${idx + 1}`,
        label: safeString(o.label, 'Link', 80),
        target,
        kind,
        visible: o.visible !== false,
      };
    });
  }
  const normalizePortalNav = (arr: unknown, fallback: PortalNavItemConfig[]) => {
    if (!Array.isArray(arr) || arr.length === 0) return fallback;
    return arr.slice(0, 40).map((item, idx) => {
      const o = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
      return {
        id: safeString(o.id, `nav-item-${idx + 1}`, 80).trim() || `nav-item-${idx + 1}`,
        label: safeString(o.label, 'Item', 80),
        section: safeString(o.section, 'Navigation', 80),
        visible: o.visible !== false,
        customUrl: typeof o.customUrl === 'string' && o.customUrl.trim() ? sanitizeHref(o.customUrl) : undefined,
        customPageId: typeof o.customPageId === 'string' && o.customPageId.trim() ? safeString(o.customPageId, '', 80) : undefined,
      };
    });
  };
  def.navigation.adminNav = normalizePortalNav(nav.adminNav, def.navigation.adminNav);
  def.navigation.clubNav = normalizePortalNav(nav.clubNav, def.navigation.clubNav);

  // Footer
  const ft = (src.footer && typeof src.footer === 'object' ? src.footer : {}) as Record<string, unknown>;
  def.footer = {
    text: safeString(ft.text, def.footer.text, 240),
    subtext: safeString(ft.subtext, def.footer.subtext, 300),
    contactEmail: safeString(ft.contactEmail, def.footer.contactEmail, 120),
    socialLinks: Array.isArray(ft.socialLinks)
      ? ft.socialLinks.slice(0, 15).map((item, idx) => {
          const o = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
          return {
            id: safeString(o.id, `soc-${idx + 1}`, 80).trim() || `soc-${idx + 1}`,
            label: safeString(o.label, 'Link', 60),
            url: sanitizeHref(typeof o.url === 'string' ? o.url : '#'),
          };
        })
      : def.footer.socialLinks,
  };

  // Page Registry
  if (Array.isArray(src.pageRegistry) && src.pageRegistry.length > 0) {
    def.pageRegistry = src.pageRegistry.slice(0, 30).map((item, idx) => {
      const o = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
      return {
        id: safeString(o.id, `page-${idx + 1}`, 80).trim() || `page-${idx + 1}`,
        title: safeString(o.title, 'Page', 100),
        slug: safeString(o.slug, `page-${idx + 1}`, 80)
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-'),
        visible: o.visible !== false,
        isBuiltin: Boolean(o.isBuiltin),
        builtinTarget:
          o.builtinTarget === 'login' || o.builtinTarget === 'directory' || o.builtinTarget === 'portal'
            ? o.builtinTarget
            : undefined,
      };
    });
  }

  // Pages
  const pages = (src.pages && typeof src.pages === 'object' ? src.pages : {}) as Record<string, unknown>;

  const l = (pages.landing && typeof pages.landing === 'object' ? pages.landing : {}) as Record<string, unknown>;
  const lCta = (l.browseEventsCta && typeof l.browseEventsCta === 'object' ? l.browseEventsCta : {}) as Record<string, unknown>;
  const lVis = (l.sectionVisibility && typeof l.sectionVisibility === 'object' ? l.sectionVisibility : {}) as Record<string, unknown>;
  def.pages.landing = {
    headerStatusText: safeString(l.headerStatusText, def.pages.landing.headerStatusText, 180),
    partnerClubName: safeString(l.partnerClubName, def.pages.landing.partnerClubName, 120),
    partnerClubRole: safeString(l.partnerClubRole, def.pages.landing.partnerClubRole, 120),
    partnerClubLogoUrl:
      sanitizeImageSrc(typeof l.partnerClubLogoUrl === 'string' ? l.partnerClubLogoUrl : def.pages.landing.partnerClubLogoUrl) ||
      def.pages.landing.partnerClubLogoUrl,
    partnerClubLogoAlt: safeString(l.partnerClubLogoAlt, def.pages.landing.partnerClubLogoAlt, 160),
    eyebrow: safeString(l.eyebrow, def.pages.landing.eyebrow, 160),
    headline: safeString(l.headline, def.pages.landing.headline, 240),
    leadParagraph: safeString(l.leadParagraph, def.pages.landing.leadParagraph, 1000),
    browseEventsCta: {
      label: safeString(lCta.label, def.pages.landing.browseEventsCta.label, 120),
      href: sanitizeHref(typeof lCta.href === 'string' ? lCta.href : def.pages.landing.browseEventsCta.href),
    },
    loginCardHeading: safeString(l.loginCardHeading, def.pages.landing.loginCardHeading, 120),
    loginCardSubtext: safeString(l.loginCardSubtext, def.pages.landing.loginCardSubtext, 300),
    emailFieldLabel: safeString(l.emailFieldLabel, def.pages.landing.emailFieldLabel, 100),
    loginSubmitLabel: safeString(l.loginSubmitLabel, def.pages.landing.loginSubmitLabel, 80),
    quickLaunchLabel: safeString(l.quickLaunchLabel, def.pages.landing.quickLaunchLabel, 100),
    adminConsoleBtnLabel: safeString(l.adminConsoleBtnLabel, def.pages.landing.adminConsoleBtnLabel, 100),
    clubPortalBtnLabel: safeString(l.clubPortalBtnLabel, def.pages.landing.clubPortalBtnLabel, 100),
    securityNote1: safeString(l.securityNote1, def.pages.landing.securityNote1, 200),
    securityNote2: safeString(l.securityNote2, def.pages.landing.securityNote2, 200),
    personaDirectoryHeading: safeString(l.personaDirectoryHeading, def.pages.landing.personaDirectoryHeading, 120),
    personaDirectorySubtext: safeString(l.personaDirectorySubtext, def.pages.landing.personaDirectorySubtext, 300),
    enterPortalBtnLabel: safeString(l.enterPortalBtnLabel, def.pages.landing.enterPortalBtnLabel, 60),
    sectionVisibility: {
      hero: lVis.hero !== false,
      loginCard: lVis.loginCard !== false,
      personaDirectory: lVis.personaDirectory !== false,
    },
    sectionOrder: Array.isArray(l.sectionOrder)
      ? (l.sectionOrder.filter((x) => x === 'hero' || x === 'loginCard' || x === 'personaDirectory') as LandingPageContent['sectionOrder'])
      : def.pages.landing.sectionOrder,
    customSections: normalizeSectionList(l.customSections),
  };
  if (def.pages.landing.sectionOrder.length !== 3) {
    def.pages.landing.sectionOrder = ['hero', 'loginCard', 'personaDirectory'];
  }

  const pd = (pages.publicDirectory && typeof pages.publicDirectory === 'object' ? pages.publicDirectory : {}) as Record<string, unknown>;
  const pdVis = (pd.sectionVisibility && typeof pd.sectionVisibility === 'object' ? pd.sectionVisibility : {}) as Record<string, unknown>;
  def.pages.publicDirectory = {
    heroTitle: safeString(pd.heroTitle, def.pages.publicDirectory.heroTitle, 200),
    heroDescription: safeString(pd.heroDescription, def.pages.publicDirectory.heroDescription, 600),
    requestJoinCtaLabel: safeString(pd.requestJoinCtaLabel, def.pages.publicDirectory.requestJoinCtaLabel, 80),
    memberSignInLabel: safeString(pd.memberSignInLabel, def.pages.publicDirectory.memberSignInLabel, 80),
    eventsSectionTitle: safeString(pd.eventsSectionTitle, def.pages.publicDirectory.eventsSectionTitle, 160),
    blogSectionTitle: safeString(pd.blogSectionTitle, def.pages.publicDirectory.blogSectionTitle, 160),
    clubsSectionTitle: safeString(pd.clubsSectionTitle, def.pages.publicDirectory.clubsSectionTitle, 160),
    sectionVisibility: {
      hero: pdVis.hero !== false,
      events: pdVis.events !== false,
      blog: pdVis.blog !== false,
      clubs: pdVis.clubs !== false,
    },
    sectionOrder: Array.isArray(pd.sectionOrder)
      ? (pd.sectionOrder.filter((x) => x === 'hero' || x === 'events' || x === 'blog' || x === 'clubs') as PublicDirectoryPageContent['sectionOrder'])
      : def.pages.publicDirectory.sectionOrder,
    customSections: normalizeSectionList(pd.customSections),
  };
  if (def.pages.publicDirectory.sectionOrder.length !== 4) {
    def.pages.publicDirectory.sectionOrder = ['hero', 'events', 'blog', 'clubs'];
  }

  const pt = (pages.portal && typeof pages.portal === 'object' ? pages.portal : {}) as Record<string, unknown>;
  def.pages.portal = {
    adminPortalBreadcrumb: safeString(pt.adminPortalBreadcrumb, def.pages.portal.adminPortalBreadcrumb, 120),
    clubPortalBreadcrumb: safeString(pt.clubPortalBreadcrumb, def.pages.portal.clubPortalBreadcrumb, 120),
    demoBannerTitle: safeString(pt.demoBannerTitle, def.pages.portal.demoBannerTitle, 120),
    demoBannerText: safeString(pt.demoBannerText, def.pages.portal.demoBannerText, 600),
    searchLabel: safeString(pt.searchLabel, def.pages.portal.searchLabel, 100),
    searchPlaceholder: safeString(pt.searchPlaceholder, def.pages.portal.searchPlaceholder, 140),
    switchIdentityLabel: safeString(pt.switchIdentityLabel, def.pages.portal.switchIdentityLabel, 80),
    notificationsLabel: safeString(pt.notificationsLabel, def.pages.portal.notificationsLabel, 60),
    announcementsBannerPrefix: safeString(pt.announcementsBannerPrefix, def.pages.portal.announcementsBannerPrefix, 120),
    announcementsBannerSuffix: safeString(pt.announcementsBannerSuffix, def.pages.portal.announcementsBannerSuffix, 120),
    clubDashboardHeading: safeString(pt.clubDashboardHeading, def.pages.portal.clubDashboardHeading, 180),
    upcomingEventsHeading: safeString(pt.upcomingEventsHeading, def.pages.portal.upcomingEventsHeading, 180),
    customSections: normalizeSectionList(pt.customSections),
  };

  const co = (pages.clubOverview && typeof pages.clubOverview === 'object' ? pages.clubOverview : {}) as Record<string, unknown>;
  const coVis = (co.sectionVisibility && typeof co.sectionVisibility === 'object' ? co.sectionVisibility : {}) as Record<string, unknown>;
  def.pages.clubOverview = {
    clubBlogBtnLabel: safeString(co.clubBlogBtnLabel, def.pages.clubOverview.clubBlogBtnLabel, 60),
    editProfileBtnLabel: safeString(co.editProfileBtnLabel, def.pages.clubOverview.editProfileBtnLabel, 60),
    charterPdfBtnLabel: safeString(co.charterPdfBtnLabel, def.pages.clubOverview.charterPdfBtnLabel, 60),
    charterCsvBtnLabel: safeString(co.charterCsvBtnLabel, def.pages.clubOverview.charterCsvBtnLabel, 40),
    createPostBtnLabel: safeString(co.createPostBtnLabel, def.pages.clubOverview.createPostBtnLabel, 60),
    scheduledPostsHeading: safeString(co.scheduledPostsHeading, def.pages.clubOverview.scheduledPostsHeading, 120),
    draftsHeading: safeString(co.draftsHeading, def.pages.clubOverview.draftsHeading, 120),
    activityHeading: safeString(co.activityHeading, def.pages.clubOverview.activityHeading, 120),
    shortcuts: Array.isArray(co.shortcuts)
      ? co.shortcuts.slice(0, 12).map((item, idx) => {
          const o = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
          return {
            id: safeString(o.id, `sc-${idx + 1}`, 80).trim() || `sc-${idx + 1}`,
            tab: safeString(o.tab, 'upcoming-events', 80),
            label: safeString(o.label, 'Shortcut', 80),
            detail: safeString(o.detail, '', 160),
          };
        })
      : def.pages.clubOverview.shortcuts,
    sectionVisibility: {
      clubLinks: coVis.clubLinks !== false,
      publishingGrid: coVis.publishingGrid !== false,
      shortcuts: coVis.shortcuts !== false,
      budgetAndAdvisor: coVis.budgetAndAdvisor !== false,
      accountsAndEngagement: coVis.accountsAndEngagement !== false,
      notifications: coVis.notifications !== false,
    },
    customSections: normalizeSectionList(co.customSections),
  };

  // Custom Pages
  if (Array.isArray(src.customPages)) {
    def.customPages = src.customPages.slice(0, 20).map((item, idx) => {
      const o = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
      return {
        id: safeString(o.id, `custom-page-${idx + 1}`, 80).trim() || `custom-page-${idx + 1}`,
        title: safeString(o.title, 'New Page', 120),
        slug: safeString(o.slug, `page-${idx + 1}`, 80)
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-'),
        subtitle: safeString(o.subtitle, '', 240),
        visible: o.visible !== false,
        sections: normalizeSectionList(o.sections),
      };
    });
  }

  return def;
}

export function createSectionFromTemplate(type: SectionTemplateType): PageSection {
  const id = `sec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  switch (type) {
    case 'text':
      return {
        id,
        type: 'text',
        visible: true,
        eyebrow: 'Campus Announcement',
        heading: 'Add your section heading here',
        body: 'Click directly on any text in this block while Edit Mode is ON to customize your message for students, officers, and faculty.',
      };
    case 'image-text':
      return {
        id,
        type: 'image-text',
        visible: true,
        eyebrow: 'Featured Spotlight',
        heading: 'Highlight a club initiative or event',
        body: 'Pair a visual banner or photo with concise storytelling. Click the image to upload a new photo or paste a URL and update the alt text.',
        image: {
          src: '/assets/aistudio/Club_Social_Hub_-_Logo_Sheet_352913ad.jpg',
          alt: 'CUNY SPS Club Social Hub showcase visual',
        },
        imagePosition: 'left',
        primaryCta: {
          label: 'Learn More',
          href: '#public',
        },
      };
    case 'card-grid':
      return {
        id,
        type: 'card-grid',
        visible: true,
        eyebrow: 'Highlights',
        heading: 'Featured Resources & Programs',
        body: 'Use the controls below to add, duplicate, reorder, or remove cards.',
        cards: [
          {
            id: `card-${id}-1`,
            title: 'Student Leadership Workshops',
            description: 'Monthly hands-on sessions for incoming club officers and social media chairs.',
            linkLabel: 'View Schedule',
            linkHref: '#public',
          },
          {
            id: `card-${id}-2`,
            title: 'Event Funding & Proposals',
            description: 'Submit semester event proposals, budget requests, and reimbursement vouchers.',
            linkLabel: 'Explore Resources',
            linkHref: '#public',
          },
          {
            id: `card-${id}-3`,
            title: 'Cross-Club Collaborations',
            description: 'Co-sponsor campus panels, build nights, and student showcase fairs.',
            linkLabel: 'Browse Clubs',
            linkHref: '#public',
          },
        ],
      };
    case 'cta':
      return {
        id,
        type: 'cta',
        visible: true,
        eyebrow: 'Get Involved',
        heading: 'Ready to start or join a CUNY SPS student club?',
        body: 'Connect with peers across degree programs, attend approved campus events, and build leadership experience.',
        primaryCta: {
          label: 'Browse Student Clubs',
          href: '#public',
        },
        secondaryCta: {
          label: 'Contact Student Life',
          href: 'mailto:studentlife@sps.cuny.edu',
        },
      };
  }
}
