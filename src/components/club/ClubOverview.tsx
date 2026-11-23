import { notificationText } from '../../utils/workspacePresentation';
import { integrationStatus } from '../../utils/integrationStatus';
import { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  ExternalLink,
  FileEdit,
  FileText,
  HelpCircle,
  Pencil,
  PenSquare,
  Plus,
  Send,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { formatRoleLabel, useAuth } from '../../context/AuthContext';
import { useSiteContent } from '../../context/SiteContentContext';
import type {
  BudgetIncreaseRequest,
  Club,
  ClubCharterRenewalSummary,
  ClubEvent,
  ClubJoinRequest,
  NotificationItem,
  OfficerTransitionChecklist,
  PlatformMetric,
  Post,
  ResourceSubmission,
  RoleName,
  SocialAccount,
  WhatsAppAlertMessage,
  WhatsAppGroupLink,
} from '../../types';
import { exportCharterRenewalPdf } from '../../utils/resourcePdfExport';
import { ClubLogoMark } from '../BrandMarks';
import { StatusText } from '../StatusText';
import {
  EditableImage,
  EditableRepeatingItemBar,
  EditableText,
} from '../cms/EditablePrimitives';
import { CustomSectionsList, EditableSectionShell } from '../cms/SectionBuilder';
import { ClubLinkPlatformIcon, ClubLinksSection } from './ClubLinksSection';
import { ClubMessagingCenter } from './ClubMessagingCenter';
import { ClubProfileEditor } from './ClubProfileEditor';
import { ClubWhatsAppPanel } from './ClubWhatsAppPanel';

interface ClubOverviewProps {
  club: Club;
  effectiveRole: RoleName | null;
  isMember?: boolean;
  pendingJoinRequest?: ClubJoinRequest | null;
  socialAccounts: SocialAccount[];
  posts: Post[];
  events?: ClubEvent[];
  analytics: PlatformMetric[];
  notifications: NotificationItem[];
  whatsappGroups?: WhatsAppGroupLink[];
  whatsappMessages?: WhatsAppAlertMessage[];
  budgetIncreaseRequests?: BudgetIncreaseRequest[];
  onNavigate: (tab: string) => void;
  onEditPost: (post: Post) => void;
  onRefresh?: () => Promise<void>;
}

export function ClubOverview({
  club,
  effectiveRole,
  isMember = true,
  pendingJoinRequest = null,
  socialAccounts,
  posts,
  events = [],
  analytics,
  notifications,
  whatsappGroups = [],
  whatsappMessages = [],
  budgetIncreaseRequests = [],
  onNavigate,
  onEditPost,
  onRefresh,
}: ClubOverviewProps) {
  const { apiFetch, session } = useAuth();
  const { content, isEditActive, updateContent, mutateEntity } = useSiteContent();
  const co = content.pages.clubOverview;
  const [draggingShortcutId, setDraggingShortcutId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<ResourceSubmission[]>([]);
  const [transition, setTransition] = useState<OfficerTransitionChecklist | null>(null);
  const [extrasLoading, setExtrasLoading] = useState(true);
  const [extrasError, setExtrasError] = useState('');
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [actionError, setActionError] = useState('');

  // Join club request state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinInterest, setJoinInterest] = useState('General Member / Contributor');
  const [joinReason, setJoinReason] = useState('');
  const [submittingJoin, setSubmittingJoin] = useState(false);
  const [localPendingJoinRequest, setLocalPendingJoinRequest] = useState<ClubJoinRequest | null>(
    pendingJoinRequest ?? null
  );

  useEffect(() => {
    setLocalPendingJoinRequest(pendingJoinRequest ?? null);
  }, [pendingJoinRequest]);

  const handleSubmitJoinRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinReason.trim()) {
      setActionError('Please provide a brief reason or note for club leadership.');
      return;
    }
    setSubmittingJoin(true);
    setActionError('');
    try {
      const res = await apiFetch<{ joinRequest: ClubJoinRequest }>(
        `/api/clubs/${club.clubId}/join-requests`,
        {
          method: 'POST',
          body: JSON.stringify({
            preferredInterest: joinInterest,
            reason: joinReason.trim(),
          }),
        }
      );
      setLocalPendingJoinRequest(res.joinRequest);
      setShowJoinModal(false);
      setStatusMessage(
        `Your request to join ${club.name} as a Contributor has been submitted! Club leads have been notified.`
      );
      if (onRefresh) await onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to submit join request.');
    } finally {
      setSubmittingJoin(false);
    }
  };

  // Increased funding request form state
  const [showFundingForm, setShowFundingForm] = useState(false);
  const [fundingAmount, setFundingAmount] = useState('2000');
  const [fundingTitle, setFundingTitle] = useState('');
  const [fundingBreakdown, setFundingBreakdown] = useState('');
  const [fundingReason, setFundingReason] = useState('');
  const [fundingAttendance, setFundingAttendance] = useState('');
  const [fundingEventDate, setFundingEventDate] = useState('');
  const [submittingFunding, setSubmittingFunding] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  const scheduledPosts = posts.filter((p) => p.status === 'Scheduled');
  const draftPosts = posts.filter((p) => p.status === 'Draft' || p.status === 'In Review');
  const recentPublished = posts.filter((p) => p.status === 'Published' || p.status === 'Failed');

  const canCreate = effectiveRole !== 'VIEWER' && effectiveRole !== 'CONTRIBUTOR';
  const canEditLinks =
    Boolean(session?.effectiveAdminRole) ||
    effectiveRole === 'CLUB_LEAD' ||
    effectiveRole === 'EDITOR';
  const canEditProfile =
    effectiveRole === 'CLUB_LEAD' ||
    effectiveRole === 'SL_ADMIN' ||
    effectiveRole === 'SL_SUPER_ADMIN' ||
    Boolean(session?.effectiveAdminRole);
  const canRequestFunding =
    effectiveRole === 'CLUB_LEAD' || Boolean(session?.effectiveAdminRole);

  const loadGovernanceExtras = useCallback(async () => {
    setExtrasLoading(true);
    setExtrasError('');
    try {
      const [subsRes, transRes] = await Promise.all([
        apiFetch<{ submissions: ResourceSubmission[] }>('/api/resource-submissions'),
        apiFetch<{ transition: OfficerTransitionChecklist }>(`/api/clubs/${club.clubId}/transition`),
      ]);
      setSubmissions(subsRes.submissions.filter((s) => s.clubId === club.clubId));
      setTransition(transRes.transition);
    } catch {
      setExtrasError('Advisor items could not be loaded.');
    } finally {
      setExtrasLoading(false);
    }
  }, [apiFetch, club.clubId]);

  useEffect(() => {
    void loadGovernanceExtras();
  }, [loadGovernanceExtras]);

  const handleMarkRead = async (id: string) => {
    await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' });
    if (onRefresh) await onRefresh();
    else onNavigate('overview');
  };

  const isAdvisorOrAdmin =
    Boolean(session?.effectiveAdminRole) ||
    effectiveRole === 'VIEWER' ||
    club.facultyAdvisor.toLowerCase().includes((session?.user.name ?? '').toLowerCase());

  const pendingAdvisorProposals = submissions.filter(
    (s) => s.requiresAdvisorSignOff && !s.advisorSignOff
  );
  const pendingTransitionSignOff = Boolean(
    transition && transition.requiresAdvisorSignOff && !transition.advisorSignOff
  );

  const handleAdvisorCoSignProposal = async (submissionId: string) => {
    setActionBusyId(submissionId);
    setActionError('');
    setStatusMessage('');
    try {
      await apiFetch(`/api/clubs/${club.clubId}/resource-submissions/${submissionId}/advisor-signoff`, {
        method: 'POST',
        body: JSON.stringify({ note: `Co-signed by ${session?.user.name ?? 'Faculty Advisor'}` }),
      });
      setStatusMessage(`Co-signed proposal ${submissionId} as Faculty Advisor.`);
      await loadGovernanceExtras();
      if (onRefresh) await onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to co-sign proposal.');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleAdvisorCoSignTransition = async () => {
    setActionBusyId('transition');
    setActionError('');
    setStatusMessage('');
    try {
      await apiFetch(`/api/clubs/${club.clubId}/transition/advisor-signoff`, {
        method: 'POST',
        body: JSON.stringify({ note: `Transition verified by ${session?.user.name ?? 'Faculty Advisor'}` }),
      });
      setStatusMessage(`Co-signed semester officer transition checklist for ${club.shortCode}.`);
      await loadGovernanceExtras();
      if (onRefresh) await onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to co-sign officer transition.');
    } finally {
      setActionBusyId(null);
    }
  };

  const handleExportCharterRenewal = async (format: 'pdf' | 'csv') => {
    setActionBusyId(`charter-${format}`);
    setActionError('');
    setStatusMessage('');
    try {
      const dossier = await apiFetch<ClubCharterRenewalSummary>(
        `/api/clubs/${club.clubId}/charter-renewal`
      );
      if (format === 'pdf') {
        const filename = exportCharterRenewalPdf(dossier);
        setStatusMessage(`Downloaded Annual Charter Renewal PDF (${filename}).`);
      } else {
        const csvLines = [
          'Section,Metric,Value',
          `Identity,Organization,"${dossier.clubName} (${dossier.clubShortCode})"`,
          `Identity,Faculty Advisor,"${dossier.facultyAdvisor}"`,
          `Membership,Active Members,${dossier.activeMembersCount}`,
          `Membership,Alumni Members,${dossier.alumniMembersCount}`,
          ...dossier.officers.map(
            (o) => `Officer,"${o.officerTitle}","${o.name} (${o.email})"`
          ),
          `Events,Hosted Events,${dossier.eventsHostedCount}`,
          `Events,Total Attendance,${dossier.totalSemesterAttendance}`,
          `Events,RSVP Conversion Rate,${dossier.avgAttendanceRatePct}%`,
          `Events,Avg Satisfaction,${dossier.avgEventSatisfaction ?? 'N/A'}`,
          `Budget,Allocated Cap ($),${dossier.budgetSummary.allocatedUsd.toFixed(2)}`,
          `Budget,Encumbered ($),${dossier.budgetSummary.encumberedUsd.toFixed(2)}`,
          `Budget,Reimbursed ($),${dossier.budgetSummary.reimbursedUsd.toFixed(2)}`,
          `Budget,Remaining ($),${dossier.budgetSummary.remainingUsd.toFixed(2)}`,
          `Compliance,Audit Coverage Rate,${dossier.auditComplianceRatePct}%`,
        ].join('\n');
        const blob = new Blob([csvLines], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cuny-sps-${dossier.clubShortCode.toLowerCase()}-charter-renewal.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setStatusMessage(`Downloaded Annual Charter Renewal CSV summary.`);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to generate charter renewal dossier.');
    } finally {
      setActionBusyId(null);
    }
  };

  const budget = club.budgetSummary;
  const budgetUsedPct =
    budget && budget.allocatedUsd > 0
      ? Math.min(100, Math.round(((budget.encumberedUsd + budget.reimbursedUsd) / budget.allocatedUsd) * 100))
      : 0;

  const parsedRequestedAmount = Number(fundingAmount);
  const currentCapUsd = budget?.allocatedUsd ?? club.semesterBudgetAllocatedUsd ?? 500;
  const proposedNewCapUsd =
    Number.isFinite(parsedRequestedAmount) && parsedRequestedAmount > 0
      ? currentCapUsd + parsedRequestedAmount
      : currentCapUsd;

  const handleSubmitFundingRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setStatusMessage('');
    if (!Number.isFinite(parsedRequestedAmount) || parsedRequestedAmount <= 0) {
      setActionError('Enter a valid positive dollar amount for the funding increase.');
      return;
    }
    if (!fundingTitle.trim() || !fundingReason.trim()) {
      setActionError('Provide both the event/initiative title and reason for increased funding.');
      return;
    }
    setSubmittingFunding(true);
    try {
      const res = await apiFetch<{ request: BudgetIncreaseRequest }>(
        `/api/clubs/${club.clubId}/budget-increase-requests`,
        {
          method: 'POST',
          body: JSON.stringify({
            requestedAdditionalUsd: parsedRequestedAmount,
            eventOrInitiativeTitle: fundingTitle.trim(),
            fundingBreakdown: fundingBreakdown.trim(),
            reason: fundingReason.trim(),
            expectedAttendance: fundingAttendance ? Number(fundingAttendance) : undefined,
            eventDate: fundingEventDate || undefined,
          }),
        }
      );
      setShowFundingForm(false);
      setFundingTitle('');
      setFundingBreakdown('');
      setFundingReason('');
      setFundingAttendance('');
      setFundingEventDate('');
      setStatusMessage(
        `Submitted funding increase request ${res.request.requestId} (+$${res.request.requestedAdditionalUsd.toFixed(2)}) to Student Life Admin for review.`
      );
      if (onRefresh) await onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to submit funding increase request.');
    } finally {
      setSubmittingFunding(false);
    }
  };

  const handleInlineClubUpdate = async (patch: Record<string, unknown>) => {
    setActionError('');
    try {
      await mutateEntity('clubs', { action: 'update', id: club.clubId, ...patch });
      if (onRefresh) await onRefresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to update club.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4 min-w-0">
          {isEditActive ? (
            <EditableImage
              src={club.logoUrl ?? ''}
              alt={`${club.name} profile picture`}
              onChange={(nextImg) => void handleInlineClubUpdate({ logoUrl: nextImg.src })}
              className="w-14 h-14 rounded-full object-cover border border-slate-200 bg-white shrink-0"
              fallback={
                <ClubLogoMark
                  clubId={club.clubId}
                  clubShortCode={club.shortCode}
                  clubName={club.name}
                  logoUrl={club.logoUrl}
                  accentColor={club.accentColor}
                  size="lg"
                />
              }
            />
          ) : (
            <ClubLogoMark
              clubId={club.clubId}
              clubShortCode={club.shortCode}
              clubName={club.name}
              logoUrl={club.logoUrl}
              accentColor={club.accentColor}
              size="lg"
            />
          )}
          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-500">
              {club.shortCode} · {club.category} · {isMember ? `Your Role: ${formatRoleLabel(effectiveRole)}` : 'Non-Member (Viewing as Contributor)'}
            </div>
            <EditableText
              as="h1"
              value={club.name}
              onChange={(next) => void handleInlineClubUpdate({ name: next })}
              className="text-2xl font-bold tracking-tight text-slate-900"
            />
            {(club.tagline || isEditActive) && (
              <EditableText
                as="p"
                value={club.tagline ?? ''}
                placeholder="Optional club tagline"
                onChange={(next) => void handleInlineClubUpdate({ tagline: next })}
                className="text-xs font-medium text-[#004B87]"
              />
            )}
            <EditableText
              as="p"
              multiline
              value={club.description}
              onChange={(next) => void handleInlineClubUpdate({ description: next })}
              className="text-sm text-slate-600 max-w-2xl"
            />
            {(club.meetingSchedule || club.contactEmail || club.websiteUrl) && (
              <div className="flex flex-wrap items-center gap-2.5 pt-0.5 text-xs text-slate-500">
                {club.meetingSchedule && <span>Meetings: {club.meetingSchedule}</span>}
                {club.meetingSchedule && (club.contactEmail || club.websiteUrl) && (
                  <span aria-hidden="true">·</span>
                )}
                {club.contactEmail && (
                  <a
                    href={`mailto:${club.contactEmail}`}
                    className="text-[#004B87] hover:underline font-mono text-[11px]"
                  >
                    {club.contactEmail}
                  </a>
                )}
                {club.contactEmail && club.websiteUrl && <span aria-hidden="true">·</span>}
                {club.websiteUrl && (
                  <a
                    href={club.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#004B87] hover:underline truncate max-w-xs"
                  >
                    {club.websiteUrl}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isMember && (
            localPendingJoinRequest ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-300 rounded-md">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Join Request Pending</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowJoinModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-sm transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Request to Join</span>
              </button>
            )
          )}
          <button
            type="button"
            onClick={() => onNavigate(effectiveRole === 'CONTRIBUTOR' ? 'ask-club' : 'member-questions')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#004B87] bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded-md whitespace-nowrap cursor-pointer shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#004B87]" />
            <span>{effectiveRole === 'CONTRIBUTOR' ? 'Ask a Question' : 'Member Questions'}</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('club-blog')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md whitespace-nowrap cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#004B87]" />
            <EditableText
              as="span"
              value={co.clubBlogBtnLabel}
              onChange={(next) =>
                updateContent((d) => {
                  d.pages.clubOverview.clubBlogBtnLabel = next;
                })
              }
            />
          </button>
          {canEditProfile && (
            <button
              type="button"
              onClick={() => setShowProfileEditor((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#004B87] bg-white border border-[#004B87] hover:bg-sky-50 rounded-md whitespace-nowrap cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <EditableText
                as="span"
                value={showProfileEditor ? 'Close Profile Editor' : co.editProfileBtnLabel}
                onChange={(next) =>
                  updateContent((d) => {
                    d.pages.clubOverview.editProfileBtnLabel = next;
                  })
                }
              />
            </button>
          )}
          <button
            type="button"
            disabled={actionBusyId === 'charter-pdf'}
            onClick={() => void handleExportCharterRenewal('pdf')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md whitespace-nowrap cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#004B87]" />
            <EditableText
              as="span"
              value={co.charterPdfBtnLabel}
              onChange={(next) =>
                updateContent((d) => {
                  d.pages.clubOverview.charterPdfBtnLabel = next;
                })
              }
            />
          </button>
          <button
            type="button"
            disabled={actionBusyId === 'charter-csv'}
            onClick={() => void handleExportCharterRenewal('csv')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <EditableText
              as="span"
              value={co.charterCsvBtnLabel}
              onChange={(next) =>
                updateContent((d) => {
                  d.pages.clubOverview.charterCsvBtnLabel = next;
                })
              }
            />
          </button>
          {canCreate && (
            <button
              type="button"
              onClick={() => onNavigate('create-post')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#004B87] hover:bg-[#003865] rounded-md whitespace-nowrap cursor-pointer"
            >
              <PenSquare className="w-4 h-4" />
              <EditableText
                as="span"
                value={co.createPostBtnLabel}
                onChange={(next) =>
                  updateContent((d) => {
                    d.pages.clubOverview.createPostBtnLabel = next;
                  })
                }
              />
            </button>
          )}
        </div>
      </div>

      {showProfileEditor && canEditProfile && (
        <ClubProfileEditor
          club={club}
          mode="club"
          canEdit
          onSaved={async (updatedClub) => {
            setShowProfileEditor(false);
            setStatusMessage(
              `Saved profile picture and details for ${updatedClub.name} (${updatedClub.shortCode}).`
            );
            if (onRefresh) await onRefresh();
          }}
          onCancel={() => setShowProfileEditor(false)}
        />
      )}

      {actionError && (
        <div role="alert" className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md">
          {actionError}
        </div>
      )}
      {statusMessage && (
        <div className="p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md">
          {statusMessage}
        </div>
      )}

      {/* Join Request Banner for Non-Members */}
      {!isMember && !localPendingJoinRequest && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <UserPlus className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-slate-900">Interested in {club.name}?</div>
              <div className="text-xs text-slate-600 mt-0.5">
                Submit a request to become a Contributor. You will be able to collaborate with club leaders, attend special events, and appear in the member directory upon approval.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowJoinModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Request to Join as Contributor</span>
          </button>
        </div>
      )}

      {!isMember && localPendingJoinRequest && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <div className="text-sm font-semibold text-amber-900">Request to Join Submitted</div>
              <div className="text-xs text-amber-700 mt-0.5">
                Your request to become a Contributor in {club.name} was submitted on{' '}
                {new Date(localPendingJoinRequest.createdAt).toLocaleDateString()} and is currently pending review by club leaders.
              </div>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
            Pending Approval
          </span>
        </div>
      )}

      {/* Official WhatsApp Groups Card */}
      {whatsappGroups && whatsappGroups.length > 0 && (
        <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <ClubLinkPlatformIcon kind="whatsapp" className="w-4 h-4" />
              <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                Official Club WhatsApp Community &amp; Event Alerts
              </h3>
            </div>
            <span className="text-[11px] text-emerald-700 font-medium">
              Open to all CUNY SPS students &amp; members
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {whatsappGroups.map((grp) => (
              <div
                key={grp.groupId}
                className="bg-white border border-emerald-200 rounded-md p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 truncate">{grp.groupName}</div>
                  <div className="text-[11px] text-slate-500 truncate">{grp.description || grp.groupCategory}</div>
                </div>
                {grp.inviteLink ? (
                  <a
                    href={grp.inviteLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] rounded-md shrink-0 shadow-sm transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Join WhatsApp</span>
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {showJoinModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-lg shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-slate-900">Request to Join {club.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowJoinModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmitJoinRequest} className="p-5 space-y-4">
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-md text-xs text-sky-800">
                Club leadership will review your request. Once approved, you will join as a{' '}
                <strong>Contributor</strong> to {club.name}.
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Student Name</span>
                  <span className="font-semibold text-slate-900">{session?.user.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Email</span>
                  <span className="font-semibold text-slate-900 truncate block">{session?.user.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  How would you like to contribute?
                </label>
                <select
                  value={joinInterest}
                  onChange={(e) => setJoinInterest(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
                >
                  <option value="General Member / Contributor">General Member / Contributor</option>
                  <option value="Event Operations & Logistics">Event Operations & Logistics</option>
                  <option value="Communications, Design & Social Media">Communications, Design & Social Media</option>
                  <option value="Technical Projects & Workshops">Technical Projects & Workshops</option>
                  <option value="Peer Mentoring & Study Groups">Peer Mentoring & Study Groups</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Why would you like to join? <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={joinReason}
                  onChange={(e) => setJoinReason(e.target.value)}
                  placeholder="Share your interests or what you hope to work on with the club..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingJoin}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-md shadow-sm transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{submittingJoin ? 'Submitting...' : 'Submit Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <EditableSectionShell
        title="Club Links"
        visible={co.sectionVisibility.clubLinks}
        onToggleVisible={() =>
          updateContent((d) => {
            d.pages.clubOverview.sectionVisibility.clubLinks =
              !d.pages.clubOverview.sectionVisibility.clubLinks;
          })
        }
      >
        <ClubLinksSection
          clubId={club.clubId}
          links={club.links}
          canEdit={canEditLinks}
          onSaved={async () => {
            if (onRefresh) await onRefresh();
          }}
        />
      </EditableSectionShell>

      <EditableSectionShell
        title="Publishing & Activity Grid"
        visible={co.sectionVisibility.publishingGrid}
        onToggleVisible={() =>
          updateContent((d) => {
            d.pages.clubOverview.sectionVisibility.publishingGrid =
              !d.pages.clubOverview.sectionVisibility.publishingGrid;
          })
        }
      >
      {/* Upcoming Scheduled, Drafts, Publishing Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="bg-white border border-slate-200 rounded-lg flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-slate-400" />
              <EditableText
                as="span"
                value={co.scheduledPostsHeading}
                onChange={(next) =>
                  updateContent((d) => {
                    d.pages.clubOverview.scheduledPostsHeading = next;
                  })
                }
              />
            </h2>
            <span className="text-xs font-mono-tabular text-slate-500">{scheduledPosts.length}</span>
          </div>
          <div className="divide-y divide-slate-200 flex-1">
            {scheduledPosts.length === 0 ? (
              <div className="p-5 text-xs text-slate-500">No upcoming scheduled posts.</div>
            ) : (
              scheduledPosts.slice(0, 3).map((post) => (
                <button
                  key={post.postId}
                  type="button"
                  onClick={() => onEditPost(post)}
                  className="w-full text-left px-5 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="text-sm font-medium text-slate-900 truncate">{post.title}</div>
                  <div className="text-xs font-mono-tabular text-slate-500 mt-1">
                    {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString('en-US', { timeZone: 'America/New_York', timeZoneName: 'short' }) : ''}
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-lg flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <FileEdit className="w-4 h-4 text-slate-400" />
              <EditableText
                as="span"
                value={co.draftsHeading}
                onChange={(next) =>
                  updateContent((d) => {
                    d.pages.clubOverview.draftsHeading = next;
                  })
                }
              />
            </h2>
            <span className="text-xs font-mono-tabular text-slate-500">{draftPosts.length}</span>
          </div>
          <div className="divide-y divide-slate-200 flex-1">
            {draftPosts.length === 0 ? (
              <div className="p-5 text-xs text-slate-500">No pending drafts.</div>
            ) : (
              draftPosts.slice(0, 3).map((post) => (
                <button
                  key={post.postId}
                  type="button"
                  onClick={() => onEditPost(post)}
                  className="w-full text-left px-5 py-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{post.title}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Author: {post.authorName} · {post.aiAssisted ? 'AI-assisted draft' : 'Manual draft'}
                    </div>
                  </div>
                  <StatusText status={post.status} />
                </button>
              ))
            )}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-lg flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-slate-400" />
              <EditableText
                as="span"
                value={co.activityHeading}
                onChange={(next) =>
                  updateContent((d) => {
                    d.pages.clubOverview.activityHeading = next;
                  })
                }
              />
            </h2>
            <span className="text-xs font-mono-tabular text-slate-500">{recentPublished.length}</span>
          </div>
          <div className="divide-y divide-slate-200 flex-1">
            {recentPublished.length === 0 ? (
              <div className="p-5 text-xs text-slate-500">No publishing history recorded yet.</div>
            ) : (
              recentPublished.slice(0, 3).map((post) => (
                <button
                  key={post.postId}
                  type="button"
                  onClick={() => onEditPost(post)}
                  className="w-full text-left px-5 py-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{post.title}</div>
                    <div className="text-xs font-mono-tabular text-slate-500 mt-0.5">
                      {new Date(post.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <StatusText status={post.status} />
                </button>
              ))
            )}
          </div>
        </section>
      </div>
      <p className="text-xs text-slate-500 mt-3">Showing up to 3 items per list. <button type="button" onClick={() => onNavigate('calendar')} className="text-[#004B87] underline">View all in Content Calendar</button>. Recorded statuses may include simulation.</p>
      </EditableSectionShell>

      <EditableSectionShell
        title="Workspace Shortcuts"
        visible={co.sectionVisibility.shortcuts}
        onToggleVisible={() =>
          updateContent((d) => {
            d.pages.clubOverview.sectionVisibility.shortcuts =
              !d.pages.clubOverview.sectionVisibility.shortcuts;
          })
        }
      >
        <div className="space-y-2">
          {isEditActive && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() =>
                  updateContent((d) => {
                    d.pages.clubOverview.shortcuts.push({
                      id: `sc-${Date.now().toString(36)}`,
                      tab: 'upcoming-events',
                      label: 'New Shortcut',
                      detail: 'Click to edit description',
                    });
                  })
                }
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-[#004B87] hover:bg-[#003865] rounded cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add shortcut</span>
              </button>
            </div>
          )}
          <section aria-label="Workspace shortcuts" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {co.shortcuts.map((sc, scIdx) => {
              const liveDetail =
                !isEditActive && sc.tab === 'upcoming-events' && sc.detail === 'View event schedule and RSVPs'
                  ? `${events.length} event records`
                  : !isEditActive && sc.tab === 'whatsapp' && sc.detail === 'Linked groups & share links'
                  ? `${whatsappGroups.length} linked groups · share links`
                  : sc.detail;

              return (
                <div
                  key={sc.id}
                  draggable={isEditActive}
                  onDragStart={() => setDraggingShortcutId(sc.id)}
                  onDragOver={(e) => {
                    if (isEditActive) e.preventDefault();
                  }}
                  onDrop={() => {
                    if (!draggingShortcutId || draggingShortcutId === sc.id) return;
                    updateContent((d) => {
                      const list = d.pages.clubOverview.shortcuts;
                      const from = list.findIndex((i) => i.id === draggingShortcutId);
                      const to = list.findIndex((i) => i.id === sc.id);
                      if (from >= 0 && to >= 0) {
                        const [m] = list.splice(from, 1);
                        list.splice(to, 0, m);
                      }
                    });
                    setDraggingShortcutId(null);
                  }}
                  className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 text-left hover:border-sky-400"
                >
                  <EditableRepeatingItemBar
                    itemLabel={`Card #${scIdx + 1}`}
                    canMoveUp={scIdx > 0}
                    canMoveDown={scIdx < co.shortcuts.length - 1}
                    onMoveUp={() =>
                      updateContent((d) => {
                        const [m] = d.pages.clubOverview.shortcuts.splice(scIdx, 1);
                        d.pages.clubOverview.shortcuts.splice(scIdx - 1, 0, m);
                      })
                    }
                    onMoveDown={() =>
                      updateContent((d) => {
                        const [m] = d.pages.clubOverview.shortcuts.splice(scIdx, 1);
                        d.pages.clubOverview.shortcuts.splice(scIdx + 1, 0, m);
                      })
                    }
                    onDuplicate={() =>
                      updateContent((d) => {
                        d.pages.clubOverview.shortcuts.splice(scIdx + 1, 0, {
                          ...sc,
                          id: `sc-copy-${Date.now().toString(36)}`,
                          label: `${sc.label} (Copy)`,
                        });
                      })
                    }
                    onDelete={() =>
                      updateContent((d) => {
                        d.pages.clubOverview.shortcuts = d.pages.clubOverview.shortcuts.filter(
                          (item) => item.id !== sc.id
                        );
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!isEditActive) onNavigate(sc.tab);
                    }}
                    className="w-full text-left focus-visible:outline-2 focus-visible:outline-sky-700 cursor-pointer"
                  >
                    <span className="block text-sm font-semibold text-[#004B87]">
                      <EditableText
                        as="span"
                        value={sc.label}
                        onChange={(next) =>
                          updateContent((d) => {
                            const t = d.pages.clubOverview.shortcuts.find((i) => i.id === sc.id);
                            if (t) t.label = next;
                          })
                        }
                      />{' '}
                      →
                    </span>
                    <EditableText
                      as="span"
                      value={liveDetail}
                      onChange={(next) =>
                        updateContent((d) => {
                          const t = d.pages.clubOverview.shortcuts.find((i) => i.id === sc.id);
                          if (t) t.detail = next;
                        })
                      }
                      className="mt-1 block text-xs text-slate-500"
                    />
                  </button>
                </div>
              );
            })}
          </section>
        </div>
      </EditableSectionShell>

      <EditableSectionShell
        title="Budget & Advisor Items"
        visible={co.sectionVisibility.budgetAndAdvisor}
        onToggleVisible={() =>
          updateContent((d) => {
            d.pages.clubOverview.sectionVisibility.budgetAndAdvisor =
              !d.pages.clubOverview.sectionVisibility.budgetAndAdvisor;
          })
        }
      >
      <details className="rounded-lg border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800">Budget & advisor items · expand details</summary>
        <div className="mt-4">
      {/* Semester Budget Ledger & Faculty Advisor Co-Sign Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {budget && (
          <section className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#004B87]" />
                  <span>Semester Budget Ledger (Student Activity Fee)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Standard $500.00 starting cap vs. encumbered proposals &amp; reimbursements
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {canRequestFunding && (
                  <button
                    type="button"
                    onClick={() => setShowFundingForm((prev) => !prev)}
                    className="px-2.5 py-1.5 text-xs font-medium text-white bg-[#004B87] hover:bg-[#003865] rounded whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {showFundingForm ? 'Close Request Form' : 'Request Increased Funding'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onNavigate('club-resources')}
                  className="text-xs font-medium text-[#004B87] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Submit Proposal / Voucher
                </button>
              </div>
            </div>

            {showFundingForm && (
              <form
                onSubmit={handleSubmitFundingRequest}
                className="p-4 bg-slate-50/80 border border-slate-200 rounded-md space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-900">
                    Request Supplemental Student Life Funding
                  </div>
                  <div className="text-[11px] font-mono-tabular text-[#004B87] font-semibold">
                    ${currentCapUsd.toFixed(2)} current → ${proposedNewCapUsd.toFixed(2)} proposed
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Event or Initiative Title
                    </label>
                    <input
                      type="text"
                      required
                      value={fundingTitle}
                      onChange={(e) => setFundingTitle(e.target.value)}
                      placeholder="e.g., Spring AI Gala & Keynote"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-[#004B87]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Additional Funding Needed ($)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      step="10"
                      value={fundingAmount}
                      onChange={(e) => setFundingAmount(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono-tabular bg-white border border-slate-300 rounded focus:outline-none focus:border-[#004B87]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Itemized Expense Breakdown
                    </label>
                    <input
                      type="text"
                      value={fundingBreakdown}
                      onChange={(e) => setFundingBreakdown(e.target.value)}
                      placeholder="e.g., Catering ($1,150) · Speaker Fees & Honoraria ($850)"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-[#004B87]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Target Event Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={fundingEventDate}
                      onChange={(e) => setFundingEventDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono-tabular bg-white border border-slate-300 rounded focus:outline-none focus:border-[#004B87]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Expected Attendance (Optional)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={fundingAttendance}
                      onChange={(e) => setFundingAttendance(e.target.value)}
                      placeholder="e.g., 120"
                      className="w-full px-2.5 py-1.5 text-xs font-mono-tabular bg-white border border-slate-300 rounded focus:outline-none focus:border-[#004B87]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Reason &amp; Student Impact Justification
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={fundingReason}
                    onChange={(e) => setFundingReason(e.target.value)}
                    placeholder="Explain why additional funding beyond the $500 baseline is required and how it benefits CUNY SPS students..."
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-[#004B87]"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFundingForm(false)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 whitespace-nowrap cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingFunding}
                    className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#004B87] hover:bg-[#003865] disabled:opacity-50 rounded whitespace-nowrap cursor-pointer"
                  >
                    {submittingFunding ? 'Submitting...' : 'Submit to Student Life'}
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono-tabular">
              <div>
                <div className="text-[11px] text-slate-500">Allocated Cap</div>
                <div className="text-base font-bold text-slate-900">${budget.allocatedUsd.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500">Encumbered</div>
                <div className="text-base font-bold text-amber-700">${budget.encumberedUsd.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500">Reimbursed</div>
                <div className="text-base font-bold text-slate-800">${budget.reimbursedUsd.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500">Remaining</div>
                <div
                  className={`text-base font-bold ${
                    budget.remainingUsd < 100 ? 'text-red-700' : 'text-emerald-700'
                  }`}
                >
                  ${budget.remainingUsd.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Budget Commitment Utilization</span>
                <span className="font-mono-tabular font-semibold text-slate-700">{budgetUsedPct}%</span>
              </div>
              <div className="h-2 bg-slate-100 border border-slate-200 rounded overflow-hidden">
                <div
                  className={`h-full ${budgetUsedPct >= 85 ? 'bg-amber-600' : 'bg-[#004B87]'}`}
                  style={{ width: `${budgetUsedPct}%` }}
                />
              </div>
            </div>

            {budgetIncreaseRequests.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-xs font-semibold text-slate-700">
                  Increased Funding Requests ({budgetIncreaseRequests.length})
                </div>
                <div className="space-y-2">
                  {budgetIncreaseRequests.map((req) => (
                    <div
                      key={req.requestId}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-1"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">
                            {req.eventOrInitiativeTitle}
                          </div>
                          <div className="text-[11px] font-mono-tabular text-slate-500">
                            {req.requestId} · +${req.requestedAdditionalUsd.toFixed(2)} requested (
                            ${req.currentAllocatedUsd.toFixed(0)} → ${req.proposedTotalUsd.toFixed(0)})
                          </div>
                        </div>
                        <StatusText status={req.status} />
                      </div>
                      <div className="text-[11px] text-slate-700">
                        <span className="font-medium text-slate-800">Breakdown:</span>{' '}
                        {req.fundingBreakdown}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{req.reason}</p>
                      {req.decisionNotes && (
                        <div className="pt-1 text-[11px] text-slate-700 border-t border-slate-200/80">
                          <span className="font-semibold">{req.reviewedByName ?? 'Student Life'}:</span>{' '}
                          {req.decisionNotes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <section
          className={`${
            budget ? 'lg:col-span-6' : 'lg:col-span-12'
          } bg-white border border-slate-200 rounded-lg p-5 space-y-3`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#004B87]" />
                <span>Faculty Advisor Portal & Co-Sign Queue</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Advisor: <span className="font-medium text-slate-800">{club.facultyAdvisor}</span> · High-budget ($250+) or off-campus packets & transitions
              </p>
            </div>
          </div>
          {extrasLoading ? (
            <p role="status" className="text-xs text-slate-500">Loading advisor items…</p>
          ) : extrasError ? (
            <div role="alert" className="text-xs text-red-700">{extrasError} <button type="button" onClick={() => void loadGovernanceExtras()} className="underline">Retry advisor items</button></div>
          ) : pendingAdvisorProposals.length === 0 && !pendingTransitionSignOff ? (
            <div className="py-3 flex items-center gap-2 text-xs text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>All advisor co-sign items for {club.shortCode} are currently complete.</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingAdvisorProposals.map((sub) => (
                <div
                  key={sub.submissionId}
                  className="p-3 bg-amber-50/70 border border-amber-200 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900">
                      {sub.submissionId}: {sub.title}
                    </div>
                    <div className="text-slate-600 mt-0.5 font-mono-tabular">
                      ${(sub.amountUsd ?? 0).toFixed(2)}
                      {sub.offCampusVenue ? ' · Off-Campus Venue' : ''} · Submitted by {sub.submittedByName}
                    </div>
                  </div>
                  {isAdvisorOrAdmin ? (
                    <button
                      type="button"
                      disabled={actionBusyId === sub.submissionId}
                      onClick={() => void handleAdvisorCoSignProposal(sub.submissionId)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-[#004B87] hover:bg-[#003865] rounded whitespace-nowrap cursor-pointer"
                    >
                      {actionBusyId === sub.submissionId ? 'Co-Signing...' : 'Co-Sign Proposal'}
                    </button>
                  ) : (
                    <span className="text-[11px] font-medium text-amber-800 whitespace-nowrap">
                      Awaiting Faculty Advisor
                    </span>
                  )}
                </div>
              ))}

              {pendingTransitionSignOff && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-slate-900">
                      Officer Handover Co-Sign ({transition?.fromSemester} → {transition?.toSemester})
                    </div>
                    <div className="text-slate-600 mt-0.5">
                      Semester leadership transition readiness endorsement required.
                    </div>
                  </div>
                  {isAdvisorOrAdmin ? (
                    <button
                      type="button"
                      disabled={actionBusyId === 'transition'}
                      onClick={() => void handleAdvisorCoSignTransition()}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-[#004B87] hover:bg-[#003865] rounded whitespace-nowrap cursor-pointer"
                    >
                      {actionBusyId === 'transition' ? 'Co-Signing...' : 'Co-Sign Transition'}
                    </button>
                  ) : (
                    <span className="text-[11px] font-medium text-amber-800 whitespace-nowrap">
                      Awaiting Faculty Advisor
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

        </div>
      </details>
      </EditableSectionShell>

      <EditableSectionShell
        title="Social Accounts & Engagement"
        visible={co.sectionVisibility.accountsAndEngagement}
        onToggleVisible={() =>
          updateContent((d) => {
            d.pages.clubOverview.sectionVisibility.accountsAndEngagement =
              !d.pages.clubOverview.sectionVisibility.accountsAndEngagement;
          })
        }
      >
      {/* Connected Accounts & Engagement Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 bg-white border border-slate-200 rounded-lg">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Social Account Status</h2>
            <button
              type="button"
              onClick={() => onNavigate('social-accounts')}
              className="text-xs font-medium text-[#004B87] hover:underline cursor-pointer"
            >
              Manage accounts
            </button>
          </div>
          {socialAccounts.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              No social media accounts connected yet. Club Leads can submit an account request.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {socialAccounts.map((acc) => (
                <div key={acc.accountId} className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{acc.handle}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {acc.platform} · Custodian: {acc.custodian.staffName}
                    </div>
                  </div>
                  <StatusText status={integrationStatus(acc).label} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-6 bg-white border border-slate-200 rounded-lg">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Recorded Engagement Summaries
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="text-xs font-medium text-[#004B87] hover:underline cursor-pointer"
            >
              Full analytics
            </button>
          </div>
          <p className="px-5 pt-3 text-xs text-amber-800">Demo records · provider data and freshness are unverified.</p>
          {analytics.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              Analytics appear here once an official platform integration is active.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {analytics.map((m) => (
                <div key={m.metricId} className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {m.platform} ({m.handle})
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{m.reportingPeriod}</div>
                  </div>
                  <div className="flex items-center gap-3 text-right font-mono-tabular">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{m.reach.toLocaleString()}</div>
                      <div className="text-[11px] text-slate-500">Reach</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{m.engagementCount}</div>
                      <div className="text-[11px] text-slate-500">Engagements</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      </EditableSectionShell>

      <EditableSectionShell
        title="Workspace Notifications"
        visible={co.sectionVisibility.notifications}
        onToggleVisible={() =>
          updateContent((d) => {
            d.pages.clubOverview.sectionVisibility.notifications =
              !d.pages.clubOverview.sectionVisibility.notifications;
          })
        }
      >
      {/* Relevant Notifications */}
      <section className="bg-white border border-slate-200 rounded-lg">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-400" />
            <span>Relevant Workspace Notifications</span>
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('calendar')}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#004B87] hover:underline cursor-pointer"
          >
            <span>Open Content Calendar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {notifications.length === 0 ? (
          <div className="p-5 text-xs text-slate-500">No workspace notifications.</div>
        ) : (
          <div className="divide-y divide-slate-200">
            {notifications.slice(0, 4).map((n) => (
              <div key={n.notificationId} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="text-xs">
                  <span className="font-semibold text-slate-900">{n.title}</span>
                  <span className="text-slate-400 mx-1.5">·</span>
                  <span className="text-slate-600">{notificationText(n.message)}</span>
                </div>
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => void handleMarkRead(n.notificationId)}
                    className="text-xs text-[#004B87] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
      </EditableSectionShell>

      <CustomSectionsList
        sections={co.customSections}
        onChange={(nextSections) =>
          updateContent((d) => {
            d.pages.clubOverview.customSections = nextSections;
          })
        }
      />
    </div>
  );
}

