import type {
  ClubAdditionalLink,
  ClubFixedLink,
  ClubLinksConfig,
  FixedClubLinkKey,
} from '../types.ts';

export const FIXED_CLUB_LINK_ORDER: readonly FixedClubLinkKey[] = [
  'website',
  'facebook',
  'instagram',
  'tiktok',
  'whatsapp',
] as const;

export const MAX_ADDITIONAL_LINKS = 10;
export const MAX_ADDITIONAL_LABEL_LENGTH = 40;
export const MAX_LINK_DESCRIPTION_LENGTH = 100;

export const FIXED_CLUB_LINK_META: Record<
  FixedClubLinkKey,
  {
    label: string;
    urlPlaceholder: string;
    descriptionPlaceholder: string;
  }
> = {
  website: {
    label: 'Website',
    urlPlaceholder: 'https://sps.cuny.edu/...',
    descriptionPlaceholder: 'Official club site and resources',
  },
  facebook: {
    label: 'Facebook',
    urlPlaceholder: 'https://www.facebook.com/...',
    descriptionPlaceholder: 'Campus announcements and event pages',
  },
  instagram: {
    label: 'Instagram',
    urlPlaceholder: 'https://www.instagram.com/...',
    descriptionPlaceholder: 'Weekly updates and event photos',
  },
  tiktok: {
    label: 'TikTok',
    urlPlaceholder: 'https://www.tiktok.com/@...',
    descriptionPlaceholder: 'Short clips and campus highlights',
  },
  whatsapp: {
    label: 'WhatsApp Group',
    urlPlaceholder: 'https://chat.whatsapp.com/...',
    descriptionPlaceholder: 'Member chat and quick announcements',
  },
};

export interface FixedLinkFieldErrors {
  url?: string;
  description?: string;
}

export interface AdditionalLinkFieldErrors {
  label?: string;
  url?: string;
  description?: string;
}

export interface ClubLinksValidationResult {
  valid: boolean;
  fixedErrors: Partial<Record<FixedClubLinkKey, FixedLinkFieldErrors>>;
  additionalErrors: Record<string, AdditionalLinkFieldErrors>;
  formError?: string;
}

export function createDefaultClubLinks(): ClubLinksConfig {
  return {
    fixed: FIXED_CLUB_LINK_ORDER.map((key) => ({
      key,
      active: false,
      url: '',
      description: '',
    })),
    additional: [],
  };
}

export function createSeedAiClubLinks(): ClubLinksConfig {
  return {
    fixed: [
      {
        key: 'website',
        active: true,
        url: 'https://sps.cuny.edu/student-services/student-life/student-clubs-and-organizations',
        description: 'Official club hub, semester schedule, and resources',
      },
      {
        key: 'facebook',
        active: true,
        url: 'https://www.facebook.com/cunyspsaiclub',
        description: 'Campus announcements and event RSVPs',
      },
      {
        key: 'instagram',
        active: true,
        url: 'https://www.instagram.com/cunysps.ai',
        description: 'Weekly updates and event photos',
      },
      {
        key: 'tiktok',
        active: false,
        url: '',
        description: '',
      },
      {
        key: 'whatsapp',
        active: true,
        url: 'https://chat.whatsapp.com/LiEAv8DRlII7pMqN60PGj6?s=cl&p=a&iam=2',
        description: 'Member chat, study jams, and event reminders',
      },
    ],
    additional: [
      {
        id: 'link-ai-project-showcase',
        label: 'Project Showcase',
        url: 'https://ai-showcase.sps.cuny.edu',
        description: 'Student demos, capstone builds, and hackathon archives',
        active: false,
      },
    ],
  };
}

export function createSeedMsaClubLinks(): ClubLinksConfig {
  return {
    fixed: [
      {
        key: 'website',
        active: true,
        url: 'https://sps.cuny.edu/student-services/student-life/student-clubs-and-organizations',
        description: 'Official CUNY SPS MSA portal, events, and campus initiatives',
      },
      {
        key: 'facebook',
        active: true,
        url: 'https://www.facebook.com/cunyspsmsa',
        description: 'Campus interfaith announcements and community gatherings',
      },
      {
        key: 'instagram',
        active: true,
        url: 'https://www.instagram.com/cunysps.msa',
        description: 'Community tea circles, event photos, and student features',
      },
      {
        key: 'tiktok',
        active: false,
        url: '',
        description: '',
      },
      {
        key: 'whatsapp',
        active: true,
        url: 'https://chat.whatsapp.com/CunySpsMsaCommunity',
        description: 'MSA tea & study circles, event alerts & community chat',
      },
    ],
    additional: [],
  };
}

export function normalizeClubLinks(raw?: Partial<ClubLinksConfig> | null): ClubLinksConfig {
  const rawFixed = Array.isArray(raw?.fixed) ? raw.fixed : [];
  const fixedMap = new Map<FixedClubLinkKey, Partial<ClubFixedLink>>();
  for (const item of rawFixed) {
    if (item && FIXED_CLUB_LINK_ORDER.includes(item.key as FixedClubLinkKey)) {
      fixedMap.set(item.key as FixedClubLinkKey, item);
    }
  }

  const fixed: ClubFixedLink[] = FIXED_CLUB_LINK_ORDER.map((key) => {
    const existing = fixedMap.get(key);
    return {
      key,
      active: Boolean(existing?.active),
      url: typeof existing?.url === 'string' ? existing.url.trim() : '',
      description: typeof existing?.description === 'string' ? existing.description.trim() : '',
    };
  });

  const rawAdditional = Array.isArray(raw?.additional) ? raw.additional : [];
  const seenIds = new Set<string>();
  const additional: ClubAdditionalLink[] = rawAdditional.map((item, idx) => {
    const candidateId =
      typeof item?.id === 'string' && item.id.trim().length > 0
        ? item.id.trim()
        : `link-${idx + 1}`;
    let uniqueId = candidateId;
    let suffix = 2;
    while (seenIds.has(uniqueId)) {
      uniqueId = `${candidateId}-${suffix++}`;
    }
    seenIds.add(uniqueId);
    return {
      id: uniqueId,
      label: typeof item?.label === 'string' ? item.label.trim() : '',
      url: typeof item?.url === 'string' ? item.url.trim() : '',
      description: typeof item?.description === 'string' ? item.description.trim() : '',
      active: Boolean(item?.active),
    };
  });

  return { fixed, additional };
}

function parseStrictHttpsUrl(value: string): { url?: URL; error?: string } {
  const trimmed = value.trim();
  if (!trimmed.startsWith('https://')) {
    return { error: 'URL must start with https://' };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' || !parsed.hostname || !parsed.hostname.includes('.')) {
      return { error: 'Enter a valid https:// URL.' };
    }
    return { url: parsed };
  } catch {
    return { error: 'Enter a valid https:// URL.' };
  }
}

function isDomainMatch(hostname: string, domain: string): boolean {
  const lower = hostname.toLowerCase();
  return lower === domain || lower.endsWith(`.${domain}`);
}

function validateFixedDomain(key: FixedClubLinkKey, parsed: URL): string | undefined {
  const host = parsed.hostname.toLowerCase();
  switch (key) {
    case 'facebook':
      if (!isDomainMatch(host, 'facebook.com') && !isDomainMatch(host, 'fb.com')) {
        return 'Facebook link must be a facebook.com or fb.com URL.';
      }
      return undefined;
    case 'instagram':
      if (!isDomainMatch(host, 'instagram.com')) {
        return 'Instagram link must be an instagram.com URL.';
      }
      return undefined;
    case 'tiktok':
      if (!isDomainMatch(host, 'tiktok.com')) {
        return 'TikTok link must be a tiktok.com URL.';
      }
      return undefined;
    case 'whatsapp':
      if (host !== 'chat.whatsapp.com') {
        return 'WhatsApp Group link must be a chat.whatsapp.com URL.';
      }
      return undefined;
    case 'website':
    default:
      return undefined;
  }
}

export function validateClubLinks(input: ClubLinksConfig): ClubLinksValidationResult {
  const fixedErrors: Partial<Record<FixedClubLinkKey, FixedLinkFieldErrors>> = {};
  const additionalErrors: Record<string, AdditionalLinkFieldErrors> = {};
  let formError: string | undefined;

  for (const row of input.fixed) {
    const rowErrors: FixedLinkFieldErrors = {};
    const url = row.url.trim();
    const description = row.description.trim();

    if (description.length > MAX_LINK_DESCRIPTION_LENGTH) {
      rowErrors.description = `Description must be ${MAX_LINK_DESCRIPTION_LENGTH} characters or fewer.`;
    }

    if (row.active && !url) {
      rowErrors.url = 'URL is required when this link is active.';
    } else if (url) {
      const parsed = parseStrictHttpsUrl(url);
      if (parsed.error) {
        rowErrors.url = parsed.error;
      } else if (parsed.url) {
        const domainError = validateFixedDomain(row.key, parsed.url);
        if (domainError) {
          rowErrors.url = domainError;
        }
      }
    }

    if (rowErrors.url || rowErrors.description) {
      fixedErrors[row.key] = rowErrors;
    }
  }

  if (input.additional.length > MAX_ADDITIONAL_LINKS) {
    formError = `You can add up to ${MAX_ADDITIONAL_LINKS} additional links.`;
  }

  for (const item of input.additional) {
    const itemErrors: AdditionalLinkFieldErrors = {};
    const label = item.label.trim();
    const url = item.url.trim();
    const description = item.description.trim();

    if (!label) {
      itemErrors.label = 'Label is required.';
    } else if (label.length > MAX_ADDITIONAL_LABEL_LENGTH) {
      itemErrors.label = `Label must be ${MAX_ADDITIONAL_LABEL_LENGTH} characters or fewer.`;
    }

    if (!url) {
      itemErrors.url = 'URL is required.';
    } else {
      const parsed = parseStrictHttpsUrl(url);
      if (parsed.error) {
        itemErrors.url = parsed.error;
      }
    }

    if (description.length > MAX_LINK_DESCRIPTION_LENGTH) {
      itemErrors.description = `Description must be ${MAX_LINK_DESCRIPTION_LENGTH} characters or fewer.`;
    }

    if (itemErrors.label || itemErrors.url || itemErrors.description) {
      additionalErrors[item.id] = itemErrors;
    }
  }

  const valid =
    !formError &&
    Object.keys(fixedErrors).length === 0 &&
    Object.keys(additionalErrors).length === 0;

  return {
    valid,
    fixedErrors,
    additionalErrors,
    formError,
  };
}

export function sanitizeClubLinksForPublic(links?: ClubLinksConfig | null): ClubLinksConfig {
  const normalized = normalizeClubLinks(links);
  return {
    fixed: normalized.fixed.map((item) =>
      item.key === 'whatsapp'
        ? {
            ...item,
            url: '',
          }
        : item
    ),
    additional: normalized.additional.map((item) => ({ ...item })),
  };
}

export function hasActiveClubLinks(links?: ClubLinksConfig | null): boolean {
  if (!links) return false;
  return (
    links.fixed.some((item) => item.active) ||
    links.additional.some((item) => item.active)
  );
}

export function diffClubLinks(previous: ClubLinksConfig, next: ClubLinksConfig): string[] {
  const prevNorm = normalizeClubLinks(previous);
  const nextNorm = normalizeClubLinks(next);
  const changes: string[] = [];

  for (const key of FIXED_CLUB_LINK_ORDER) {
    const prevRow = prevNorm.fixed.find((f) => f.key === key)!;
    const nextRow = nextNorm.fixed.find((f) => f.key === key)!;
    const rowChanges: string[] = [];
    if (prevRow.active !== nextRow.active) {
      rowChanges.push(nextRow.active ? 'activated' : 'deactivated');
    }
    if (prevRow.url !== nextRow.url) {
      rowChanges.push('URL updated');
    }
    if (prevRow.description !== nextRow.description) {
      rowChanges.push('description updated');
    }
    if (rowChanges.length > 0) {
      changes.push(`${FIXED_CLUB_LINK_META[key].label} (${rowChanges.join(', ')})`);
    }
  }

  const prevAddMap = new Map(prevNorm.additional.map((item) => [item.id, item]));
  const nextAddMap = new Map(nextNorm.additional.map((item) => [item.id, item]));

  for (const item of nextNorm.additional) {
    const prevItem = prevAddMap.get(item.id);
    if (!prevItem) {
      changes.push(`Additional link "${item.label || item.id}" (added)`);
      continue;
    }
    const itemChanges: string[] = [];
    if (prevItem.active !== item.active) {
      itemChanges.push(item.active ? 'activated' : 'deactivated');
    }
    if (prevItem.label !== item.label) {
      itemChanges.push(`renamed from "${prevItem.label}"`);
    }
    if (prevItem.url !== item.url) {
      itemChanges.push('URL updated');
    }
    if (prevItem.description !== item.description) {
      itemChanges.push('description updated');
    }
    if (itemChanges.length > 0) {
      changes.push(`Additional link "${item.label || item.id}" (${itemChanges.join(', ')})`);
    }
  }

  for (const prevItem of prevNorm.additional) {
    if (!nextAddMap.has(prevItem.id)) {
      changes.push(`Additional link "${prevItem.label || prevItem.id}" (removed)`);
    }
  }

  const prevCommonOrder = prevNorm.additional
    .filter((item) => nextAddMap.has(item.id))
    .map((item) => item.id);
  const nextCommonOrder = nextNorm.additional
    .filter((item) => prevAddMap.has(item.id))
    .map((item) => item.id);
  if (
    prevCommonOrder.length > 1 &&
    prevCommonOrder.some((id, index) => id !== nextCommonOrder[index])
  ) {
    changes.push('Additional links (reordered)');
  }

  return changes;
}
