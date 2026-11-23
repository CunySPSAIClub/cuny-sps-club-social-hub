import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import campusHeroImg from '../../assets/images/cuny_sps_campus_hero_1795402660106.jpg';
import { useAuth } from '../../context/AuthContext';
import { usePWA } from '../../context/PWAContext';
import type { OnboardingSummary, PublicClubSummary } from '../../types';
import { ClubLogoMark, HubLogoLockup, HubLogoMark } from '../BrandMarks';

const PROGRAM_OPTIONS = [
  'M.S. Generative AI · SPS',
  'M.S. Data Science · SPS',
  'M.S. Health Information Management · SPS',
  'B.S. Information Systems · SPS',
  'B.A. Psychology · SPS',
  'B.A. Communication and Media · SPS',
  'B.S. Nursing · SPS',
  'B.S. Business · SPS',
  'M.S. Business Management and Leadership · SPS',
  'M.A. Applied Theatre · SPS',
  'M.S. Research Administration and Compliance · SPS',
  'CUNY SPS Undergraduate / Graduate Program',
];

const INTEREST_OPTIONS = [
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
];

async function resizeAvatarFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxSide = 320;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Unable to process image.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Please select a valid PNG, JPEG, or WebP photo.'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Unable to read image file.'));
    reader.readAsDataURL(file);
  });
}

type StepKey = 'cuny-signin' | 'identity' | 'avatar' | 'role' | 'interests' | 'notifications' | 'done';

export function OnboardingFlow() {
  const { session, apiFetch, updateProfile, setPortalMode, setActiveClubId } = useAuth();
  const { isIOS, isInstalled } = usePWA();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [summary, setSummary] = useState<OnboardingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [stepIdx, setStepIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Step 2: Identity fields
  const initialFirst =
    session?.user.displayName ||
    (session?.user.name ?? '').split(/\s+/)[0] ||
    '';
  const lockedLastName =
    session?.user.lastName ??
    (session?.user.name ?? '').split(/\s+/).slice(1).join(' ');

  const [displayName, setDisplayName] = useState(initialFirst);
  const [program, setProgram] = useState(
    session?.user.program || session?.user.departmentOrMajor || PROGRAM_OPTIONS[0]
  );

  // Step 3: Avatar
  const [avatarPreview, setAvatarPreview] = useState<string>(session?.user.avatarUrl ?? '');

  // Step 4 (No-club student): Find your club + Want to lead a club
  const [publicClubs, setPublicClubs] = useState<PublicClubSummary[]>([]);
  const [clubSearch, setClubSearch] = useState('');
  const [requestedClubIds, setRequestedClubIds] = useState<string[]>([]);
  const [requestingClubId, setRequestingClubId] = useState<string | null>(null);
  const [showLeadClubForm, setShowLeadClubForm] = useState(false);
  const [leadClubName, setLeadClubName] = useState('');
  const [leadClubReason, setLeadClubReason] = useState('');
  const [leadFacultyAdvisor, setLeadFacultyAdvisor] = useState('');
  const [leadClubSubmitted, setLeadClubSubmitted] = useState(false);

  // Step 5: Interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    session?.user.interests ?? []
  );

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const [sum, pubRes] = await Promise.all([
        apiFetch<OnboardingSummary>('/api/onboarding/summary'),
        fetch('/api/public/campus')
          .then((r) => (r.ok ? r.json() : { clubs: [] }))
          .catch(() => ({ clubs: [] })),
      ]);
      setSummary(sum);
      setRequestedClubIds(sum.pendingJoinRequestClubIds ?? []);
      setPublicClubs((pubRes as { clubs?: PublicClubSummary[] }).clubs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load onboarding details.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const roleType = summary?.roleType ?? (session?.effectiveAdminRole ? 'ADMIN' : 'CONTRIBUTOR');
  const isAdmin = roleType === 'ADMIN';

  const steps: StepKey[] = useMemo(() => {
    if (isAdmin) {
      return ['cuny-signin', 'identity', 'avatar', 'role', 'notifications', 'done'];
    }
    return ['cuny-signin', 'identity', 'avatar', 'role', 'interests', 'notifications', 'done'];
  }, [isAdmin]);

  const totalNumberedSteps = steps.length - 1; // Exclude 'done' screen from "Step X of Y"
  const currentStep = steps[stepIdx] ?? 'done';

  const finishOnboarding = async () => {
    setSaving(true);
    setError('');
    try {
      await updateProfile({ onboardingCompleted: true });
      if (isAdmin) {
        setPortalMode('ADMIN');
      } else {
        setPortalMode('CLUB');
        if (summary?.clubs?.[0]?.clubId) {
          setActiveClubId(summary.clubs[0].clubId);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete setup.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIdentity = async () => {
    const clean = displayName.trim();
    if (!clean) {
      setError('Please enter the name people should see.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const patch: { displayName: string; program?: string } = { displayName: clean };
      if (!isAdmin && !session?.user.programLocked && program.trim()) {
        patch.program = program.trim();
      }
      await updateProfile(patch);
      setStepIdx((i) => Math.min(steps.length - 1, i + 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const dataUrl = await resizeAvatarFile(file);
      setAvatarPreview(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load that image.');
    }
  };

  const handleSaveAvatarAndNext = async () => {
    setSaving(true);
    setError('');
    try {
      if (avatarPreview) {
        await updateProfile({ avatarUrl: avatarPreview });
      }
      setStepIdx((i) => Math.min(steps.length - 1, i + 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile photo.');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestJoinClub = async (club: PublicClubSummary) => {
    setRequestingClubId(club.clubId);
    setError('');
    try {
      await apiFetch(`/api/clubs/${club.clubId}/join-requests`, {
        method: 'POST',
        body: JSON.stringify({
          reason: `Joining ${club.name} via CUNY SPS Club Social Hub onboarding.`,
          preferredInterest: selectedInterests[0] || 'Club Contributor & Member',
        }),
      });
      setRequestedClubIds((prev) => (prev.includes(club.clubId) ? prev : [...prev, club.clubId]));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send join request.');
    } finally {
      setRequestingClubId(null);
    }
  };

  const handleLeadClubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiFetch('/api/onboarding/lead-club-request', {
        method: 'POST',
        body: JSON.stringify({
          clubName: leadClubName,
          reason: leadClubReason,
          facultyAdvisor: leadFacultyAdvisor,
        }),
      });
      setLeadClubSubmitted(true);
      setShowLeadClubForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit leadership request.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInterestsAndNext = async () => {
    setSaving(true);
    setError('');
    try {
      await updateProfile({ interests: selectedInterests });
      setStepIdx((i) => Math.min(steps.length - 1, i + 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save interests.');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationsChoice = async (enable: boolean) => {
    setSaving(true);
    setError('');
    try {
      await updateProfile({ notificationsEnabled: enable });
      setStepIdx((i) => Math.min(steps.length - 1, i + 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save notification setting.');
    } finally {
      setSaving(false);
    }
  };

  const toggleInterest = (chip: string) => {
    setSelectedInterests((prev) =>
      prev.includes(chip) ? prev.filter((item) => item !== chip) : [...prev, chip]
    );
  };

  const filteredPublicClubs = useMemo(() => {
    const q = clubSearch.trim().toLowerCase();
    if (!q) return publicClubs;
    return publicClubs.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [clubSearch, publicClubs]);

  const primaryClub = summary?.clubs?.[0];
  const friendlyFirstName = displayName.trim() || initialFirst || 'there';

  const finalRoleTag = useMemo(() => {
    if (roleType === 'ADMIN') return 'Admin · Student Life';
    if (roleType === 'CLUB_LEAD' && primaryClub) return `Club Lead · ${primaryClub.name}`;
    if (roleType === 'CONTRIBUTOR' && primaryClub) return `Contributor · ${primaryClub.name}`;
    if (roleType === 'PENDING_STAFF') return 'Staff Access Pending · Student Life';
    return 'Student · CUNY SPS';
  }, [primaryClub, roleType]);

  const finalSummaryLine = useMemo(() => {
    const stats = summary?.finalStats;
    if (roleType === 'ADMIN') {
      const reqs = stats?.accountRequestsCount ?? 0;
      const handovers = stats?.officerHandoversCount ?? 0;
      return `${reqs} account ${reqs === 1 ? 'request' : 'requests'} and ${handovers} officer ${handovers === 1 ? 'handover' : 'handovers'} waiting for review.`;
    }
    if (roleType === 'CLUB_LEAD') {
      const waiting = stats?.postsWaitingReview ?? 0;
      const members = stats?.newMembers ?? 0;
      return `${waiting} ${waiting === 1 ? 'post' : 'posts'} waiting for your review and ${members} active club ${members === 1 ? 'member' : 'members'}.`;
    }
    if (roleType === 'CONTRIBUTOR') {
      const anns = stats?.newAnnouncements ?? 0;
      return `${anns} club ${anns === 1 ? 'announcement' : 'announcements'} and upcoming events waiting for you.`;
    }
    if (roleType === 'PENDING_STAFF') {
      return 'Student Life administrators have been notified about your staff access request.';
    }
    return requestedClubIds.length > 0
      ? `You requested to join ${requestedClubIds.length} ${requestedClubIds.length === 1 ? 'club' : 'clubs'}. Explore campus events while you wait.`
      : 'Browse approved campus clubs and upcoming events across CUNY SPS.';
  }, [requestedClubIds.length, roleType, summary?.finalStats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-sm text-slate-600">
        Preparing your CUNY SPS Club Social Hub welcome...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar: Back arrow, Segmented Progress, Skip intro */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 py-3">
        <div className="max-w-lg mx-auto space-y-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setError('');
                setStepIdx((i) => Math.max(0, i - 1));
              }}
              disabled={stepIdx === 0 || saving}
              aria-label="Go back"
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                stepIdx === 0
                  ? 'opacity-0 pointer-events-none'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {currentStep !== 'done' ? (
              <span className="text-xs font-semibold text-slate-500 font-mono-tabular">
                Step {stepIdx + 1} of {totalNumberedSteps}
              </span>
            ) : (
              <span className="text-xs font-semibold text-[#004B87]">All set</span>
            )}

            <button
              type="button"
              disabled={saving}
              onClick={() => void finishOnboarding()}
              className="text-xs font-semibold text-slate-600 hover:text-[#004B87] px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Skip intro
            </button>
          </div>

          {currentStep !== 'done' && (
            <div
              className="grid gap-1.5"
              style={{ gridTemplateColumns: `repeat(${totalNumberedSteps}, minmax(0, 1fr))` }}
              aria-label={`Progress: step ${stepIdx + 1} of ${totalNumberedSteps}`}
            >
              {Array.from({ length: totalNumberedSteps }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-colors ${
                    idx <= stepIdx ? 'bg-[#004B87]' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Centered Mobile-First Card */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {error && (
            <div
              role="alert"
              className="mx-6 mt-6 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg"
            >
              {error}
            </div>
          )}

          {/* STEP 1: Sign in with CUNY */}
          {currentStep === 'cuny-signin' && (
            <div className="p-6 sm:p-8 space-y-6 text-center">
              <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-[#0B0B0F] shadow-sm">
                <HubLogoLockup theme="dark" size="md" showSubtitle subtitle="CUNY SPS" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Sign in with CUNY
                </h1>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Use your CUNY SPS email. The Hub never sees your password.
                </p>
              </div>

              <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-left flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#004B87] shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs text-slate-700">
                  <p className="font-medium text-slate-900">
                    Signed in as <span className="font-mono">{session?.user.email}</span>
                  </p>
                  <p>
                    Your club role comes from Student Life, so you only see what you&apos;re allowed
                    to.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStepIdx(1)}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#004B87] hover:bg-[#003865] transition-colors cursor-pointer"
              >
                Continue with CUNY email
              </button>
            </div>
          )}

          {/* STEP 2: Is this you? */}
          {currentStep === 'identity' && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Is this you?</h1>
                <p className="text-sm text-slate-600">
                  Change the name people see if you go by something else.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="onboarding-display-name"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Name people see
                  </label>
                  <input
                    id="onboarding-display-name"
                    type="text"
                    maxLength={60}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="First name or preferred name"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004B87]/20 focus:border-[#004B87]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Last name
                  </label>
                  <div className="flex items-center justify-between px-3.5 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-600">
                    <span>{lockedLastName || 'From your CUNY record'}</span>
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" aria-label="Locked" />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="onboarding-program"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Program
                  </label>
                  {isAdmin ? (
                    <div className="flex items-center justify-between px-3.5 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium">
                      <span>CUNY SPS Student Life</span>
                      <Lock className="w-4 h-4 text-slate-400 shrink-0" aria-label="Locked" />
                    </div>
                  ) : session?.user.programLocked ? (
                    <div className="flex items-center justify-between px-3.5 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-700">
                      <span>{session.user.program || program}</span>
                      <Lock className="w-4 h-4 text-slate-400 shrink-0" aria-label="Locked" />
                    </div>
                  ) : (
                    <select
                      id="onboarding-program"
                      value={PROGRAM_OPTIONS.includes(program) ? program : PROGRAM_OPTIONS[0]}
                      onChange={(e) => setProgram(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004B87]/20 focus:border-[#004B87]"
                    >
                      {PROGRAM_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}
                  {!isAdmin && !session?.user.programLocked && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Locked after you save so club rosters stay accurate.
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSaveIdentity()}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#004B87] hover:bg-[#003865] disabled:opacity-60 transition-colors cursor-pointer"
              >
                {saving ? 'Saving...' : 'Looks good'}
              </button>
            </div>
          )}

          {/* STEP 3: Add a profile pic */}
          {currentStep === 'avatar' && (
            <div className="p-6 sm:p-8 space-y-6 text-center">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Add a profile pic
                </h1>
                <p className="text-sm text-slate-600">
                  So club members know who&apos;s posting and who&apos;s coming.
                </p>
              </div>

              <div className="flex justify-center py-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-32 h-32 rounded-full border-2 border-dashed border-slate-300 bg-slate-100 hover:border-[#004B87] flex items-center justify-center overflow-hidden transition-colors cursor-pointer group"
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Your profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-slate-500 group-hover:text-[#004B87]">
                      <Camera className="w-8 h-8" />
                      <span className="text-[11px] font-medium">Upload photo</span>
                    </div>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => void handlePhotoSelected(e)}
                />
              </div>

              {avatarPreview ? (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSaveAvatarAndNext()}
                    className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#004B87] hover:bg-[#003865] disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {saving ? 'Saving...' : 'Next'}
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Choose another
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#004B87] hover:bg-[#003865] transition-colors cursor-pointer"
                  >
                    Choose a photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setStepIdx((i) => Math.min(steps.length - 1, i + 1))}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Skip for now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Role Confirmation OR Part 4 No-Role Flows */}
          {currentStep === 'role' && (
            <div className="p-6 sm:p-8 space-y-6">
              {roleType === 'ADMIN' && (
                <>
                  <div className="space-y-1.5">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                      You&apos;re Student Life staff
                    </h1>
                  </div>

                  <div className="bg-[#0B0B0F] text-white rounded-xl p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <HubLogoMark size="sm" surface="bare-light" />
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate">CUNY SPS · Student Life</div>
                        <div className="text-xs text-slate-300 truncate">{session?.user.email}</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-[11px] font-bold bg-[#C4F500] text-[#0B0B0F] rounded-md shrink-0">
                      Admin
                    </span>
                  </div>

                  <ul className="space-y-3 text-sm text-slate-700">
                    {[
                      'Approve club accounts and officer handovers',
                      'Manage clubs, leaders, and campus resources',
                      'View audit logs and engagement reports',
                    ].map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#004B87] shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
                    Your access comes from your CUNY staff account.
                  </p>

                  <button
                    type="button"
                    onClick={() => setStepIdx((i) => Math.min(steps.length - 1, i + 1))}
                    className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#004B87] hover:bg-[#003865] transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </>
              )}

              {(roleType === 'CLUB_LEAD' || roleType === 'CONTRIBUTOR') && (
                <>
                  <div className="space-y-1.5">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                      You&apos;re in {primaryClub ? `the ${primaryClub.name}` : 'your club'}
                    </h1>
                  </div>

                  <div className="space-y-2.5">
                    {(summary?.clubs ?? []).map((club) => (
                      <div
                        key={club.clubId}
                        className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <ClubLogoMark
                            clubId={club.clubId}
                            clubShortCode={club.shortCode}
                            clubName={club.name}
                            logoUrl={club.logoUrl}
                            accentColor={club.accentColor}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {club.name}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500">
                              {club.shortCode}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-md shrink-0 ${
                            club.role === 'CLUB_LEAD'
                              ? 'bg-[#004B87] text-white'
                              : 'bg-sky-100 text-[#004B87]'
                          }`}
                        >
                          {club.roleBadge}
                        </span>
                      </div>
                    ))}
                  </div>

                  <ul className="space-y-3 text-sm text-slate-700">
                    {(roleType === 'CLUB_LEAD'
                      ? [
                          'Create, schedule, and publish social posts and blog stories',
                          'Post events, announcements, and WhatsApp alerts',
                          'Manage club members, links, and budget requests',
                        ]
                      : [
                          'Draft social posts and blog stories for Club Lead review',
                          'RSVP to events and join club discussions',
                          'Message your club and check resources',
                        ]
                    ).map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-[#004B87] shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
                    Your role comes from Student Life. Club Leads can change it.
                  </p>

                  <button
                    type="button"
                    onClick={() => setStepIdx((i) => Math.min(steps.length - 1, i + 1))}
                    className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#004B87] hover:bg-[#003865] transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </>
              )}

              {roleType === 'PENDING_STAFF' && (
                <>
                  <div className="space-y-2 text-center">
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                      <Clock className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Your Student Life access is pending
                    </h1>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      We verified your <span className="font-mono">@sps.cuny.edu</span> staff email
                      and notified Student Life administrators to activate your staff permissions.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1.5">
                    <p className="font-semibold text-slate-800">What happens next?</p>
                    <p>
                      A Student Life Super Admin will review your account and assign your
                      administrative role. In the meantime, you can explore the Campus Directory.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStepIdx((i) => Math.min(steps.length - 1, i + 1))}
                    className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#004B87] hover:bg-[#003865] transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </>
              )}

              {roleType === 'NO_CLUB_STUDENT' && (
                <>
                  <div className="space-y-1.5">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Find your club
                    </h1>
                    <p className="text-sm text-slate-600">
                      Request to join a CUNY SPS club. Once approved by a Club Lead, you&apos;ll join
                      as a Contributor.
                    </p>
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      value={clubSearch}
                      onChange={(e) => setClubSearch(e.target.value)}
                      placeholder="Search clubs by name or topic..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#004B87]"
                    />
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
                    {filteredPublicClubs.map((club) => {
                      const alreadySent = requestedClubIds.includes(club.clubId);
                      return (
                        <div
                          key={club.clubId}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <ClubLogoMark
                              clubId={club.clubId}
                              clubShortCode={club.shortCode}
                              clubName={club.name}
                              logoUrl={club.logoUrl}
                              accentColor={club.accentColor}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-900 truncate">
                                {club.name}
                              </div>
                              <div className="text-xs text-slate-500 truncate">{club.category}</div>
                            </div>
                          </div>

                          {alreadySent ? (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-right shrink-0">
                              Request sent. A Club Lead will approve you
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={requestingClubId === club.clubId}
                              onClick={() => void handleRequestJoinClub(club)}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#004B87] hover:bg-[#003865] disabled:opacity-50 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              {requestingClubId === club.clubId ? 'Sending...' : 'Request to join'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Want to lead a club? */}
                  <div className="pt-2 border-t border-slate-200">
                    {leadClubSubmitted ? (
                      <div className="p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
                        Leadership request sent to Student Life&apos;s Account Requests queue.
                      </div>
                    ) : !showLeadClubForm ? (
                      <button
                        type="button"
                        onClick={() => setShowLeadClubForm(true)}
                        className="text-xs font-semibold text-[#004B87] hover:underline cursor-pointer"
                      >
                        Want to lead a club?
                      </button>
                    ) : (
                      <form onSubmit={handleLeadClubSubmit} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="text-xs font-semibold text-slate-900">
                          Request to lead or start a club
                        </div>
                        <input
                          type="text"
                          required
                          value={leadClubName}
                          onChange={(e) => setLeadClubName(e.target.value)}
                          placeholder="Club name"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md"
                        />
                        <textarea
                          required
                          rows={2}
                          value={leadClubReason}
                          onChange={(e) => setLeadClubReason(e.target.value)}
                          placeholder="Why do you want to lead this club?"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md"
                        />
                        <input
                          type="text"
                          required
                          value={leadFacultyAdvisor}
                          onChange={(e) => setLeadFacultyAdvisor(e.target.value)}
                          placeholder="Faculty advisor name"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowLeadClubForm(false)}
                            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={saving}
                            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#004B87] hover:bg-[#003865] rounded-md cursor-pointer"
                          >
                            {saving ? 'Submitting...' : 'Submit request'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setStepIdx((i) => Math.min(steps.length - 1, i + 1))}
                    className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#004B87] hover:bg-[#003865] transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </>
              )}
            </div>
          )}

          {/* STEP 5: What are you into? (Skipped for Admin) */}
          {currentStep === 'interests' && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  What are you into?
                </h1>
                <p className="text-sm text-slate-600">
                  Pick a few. We&apos;ll show you clubs and events that fit.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((chip) => {
                  const active = selectedInterests.includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => toggleInterest(chip)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#004B87] text-white border-[#004B87]'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-[#004B87]'
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5" />}
                      <span>{chip}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSaveInterestsAndNext()}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#004B87] hover:bg-[#003865] disabled:opacity-60 transition-colors cursor-pointer"
              >
                {saving ? 'Saving...' : 'Next'}
              </button>
            </div>
          )}

          {/* STEP 6 (Step 5 for Admin): Never miss a thing */}
          {currentStep === 'notifications' && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Never miss a thing
                </h1>
                <p className="text-sm text-slate-600">
                  {roleType === 'ADMIN'
                    ? 'Get alerts for new account requests, officer handovers, and policy flags.'
                    : roleType === 'CLUB_LEAD'
                      ? 'Get alerts for new member requests, posts to review, and upcoming events.'
                      : 'Get alerts for new club announcements, replies, and event reminders.'}
                </p>
              </div>

              {/* 3 slightly tilted preview cards from real data */}
              <div className="space-y-3 py-1">
                {(summary?.notificationCards ?? []).slice(0, 3).map((card, idx) => {
                  const tiltClass =
                    idx === 0 ? '-rotate-1' : idx === 1 ? 'rotate-1' : '-rotate-0.5';
                  return (
                    <div
                      key={card.id}
                      className={`p-3.5 rounded-xl border border-slate-200 bg-slate-50 shadow-xs transform ${tiltClass}`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] text-[#004B87] font-semibold">
                        <span className="inline-flex items-center gap-1.5">
                          <Bell className="w-3.5 h-3.5" />
                          <span>{card.category}</span>
                        </span>
                        <span className="text-slate-400 font-normal">{card.timeLabel}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-900 mt-1">{card.title}</div>
                      <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{card.body}</p>
                    </div>
                  );
                })}
              </div>

              {isIOS && !isInstalled && (
                <div className="p-3 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg">
                  On iPhone, add the Hub to your Home Screen first to get notifications.
                </div>
              )}

              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleNotificationsChoice(true)}
                  className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#004B87] hover:bg-[#003865] disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Turn on notifications'}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleNotificationsChoice(false)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Not now
                </button>
              </div>
            </div>
          )}

          {/* FINAL SCREEN: You're in, [Name]! */}
          {currentStep === 'done' && (
            <div>
              <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                <img
                  src={campusHeroImg}
                  alt="CUNY SPS Midtown Manhattan campus"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F]/80 via-[#0B0B0F]/25 to-transparent" />
                <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-[#C4F500] text-[#0B0B0F]">
                    {roleType === 'ADMIN' ? (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    ) : roleType === 'CLUB_LEAD' ? (
                      <Sparkles className="w-3.5 h-3.5" />
                    ) : (
                      <Users className="w-3.5 h-3.5" />
                    )}
                    <span>{finalRoleTag}</span>
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    You&apos;re in, {friendlyFirstName}!
                  </h1>
                  <p className="text-sm text-slate-600 leading-relaxed">{finalSummaryLine}</p>
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void finishOnboarding()}
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-[#004B87] hover:bg-[#003865] disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {saving ? 'Opening Hub...' : "Let's go"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
