import { notificationText, searchWorkspacePages } from '../utils/workspacePresentation';
import { requestDraftDiscard } from '../utils/draftProtection';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  FileText,
  FolderDown,
  Globe,
  HelpCircle,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Link2,
  ListChecks,
  LogOut,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  MessageCircle,
  MessageSquare,
  PenSquare,
  Plus,
  QrCode,
  Repeat,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { formatRoleLabel, useAuth } from '../context/AuthContext';
import { useSiteContent } from '../context/SiteContentContext';
import { sanitizeHref } from '../data/siteContent';
import type {
  AccountRequest,
  AuditLog,
  BudgetIncreaseRequest,
  Club,
  ClubAnnouncement,
  ClubBroadcastMessage,
  ClubEvent,
  ClubEventType,
  ClubJoinRequest,
  ClubMembership,
  EventRecurrence,
  InboxMessage,
  Invitation,
  NotificationItem,
  PlatformMetric,
  Post,
  QuestionTopic,
  RoleName,
  SocialAccount,
  WhatsAppAlertMessage,
  WhatsAppGroupLink,
} from '../types';
import {
  buildGoogleCalendarUrl,
  downloadCalendarIcs,
  downloadEventIcs,
} from '../utils/calendarExport';
import {
  ClubLogoMark,
  HubLogoLockup,
  HubLogoMark,
  StudentLifeLogo,
} from './BrandMarks';
import { StatusText } from './StatusText';
import { ClubAnnouncements } from './ClubAnnouncements';
export { ClubAnnouncements };
import { ClubMemberDirectory } from './ClubMemberDirectory';
export { ClubMemberDirectory };
import { ClubResourcesView } from './ClubResourcesView';
export { ClubResourcesView };
import { EventRemindersView } from './EventRemindersView';
export { EventRemindersView };
import { ClubForums } from './ClubForums';
export { ClubForums };
import { EventAnalyticsView } from './EventAnalyticsView';
export { EventAnalyticsView };
import { ClubProjectTasks } from './ClubProjectTasks';
export { ClubProjectTasks };
import { ClubEventCalendar } from './ClubEventCalendar';
export { ClubEventCalendar };
import { EventCheckInDrawer } from './EventCheckInDrawer';
import { PublicCampusDirectory } from './PublicCampusDirectory';
import { AdminAccountsView } from './admin/AdminAccountsView';
import { AdminAiAssistantView } from './admin/AdminAiAssistantView';
import { AdminAuditLogsView } from './admin/AdminAuditLogsView';
import { AdminClubsView } from './admin/AdminClubsView';
import { AdminDashboard, type AdminOverviewData } from './admin/AdminDashboard';
export { AdminDashboard, type AdminOverviewData };
import { AdminLeadersView } from './admin/AdminLeadersView';
import { AdminReportsView } from './admin/AdminReportsView';
import { AdminRequestsView } from './admin/AdminRequestsView';
import { AdminSettingsView } from './admin/AdminSettingsView';
import { AdminUsersView } from './admin/AdminUsersView';
import { AiAssistantView } from './club/AiAssistantView';
import { AskTheClubView } from './club/AskTheClubView';
import { ClubAnalyticsView } from './club/ClubAnalyticsView';
import { ClubBlogView } from './club/ClubBlogView';
import { ClubInboxView } from './club/ClubInboxView';
import { ClubMessagingCenter } from './club/ClubMessagingCenter';
import { ClubOverview } from './club/ClubOverview';
import { ClubRequestsView } from './club/ClubRequestsView';
import { ClubSettingsView } from './club/ClubSettingsView';
import { ClubSocialAccounts } from './club/ClubSocialAccounts';
import { ClubTeamView } from './club/ClubTeamView';
import { ClubWhatsAppPanel } from './club/ClubWhatsAppPanel';
import { ContentCalendar } from './club/ContentCalendar';
import { ContentStudio } from './club/ContentStudio';
import { CustomPageView } from './cms/CustomPageView';
import { EditableText } from './cms/EditablePrimitives';
import { MemberQuestionsInbox } from './club/MemberQuestionsInbox';
import { CustomSectionsList } from './cms/SectionBuilder';
import { SiteFooter } from './cms/SiteFooter';
import { PWAInstallButton } from './pwa/PWAInstallButton';

interface ClubWorkspacePayload {
  club: Club;
  effectiveRole: RoleName | null;
  isMember?: boolean;
  pendingJoinRequest?: ClubJoinRequest | null;
  socialAccounts: SocialAccount[];
  posts: Post[];
  events: ClubEvent[];
  accountRequests: AccountRequest[];
  analytics: PlatformMetric[];
  invitations: Invitation[];
  members: (ClubMembership & {
    name: string;
    email: string;
    departmentOrMajor: string;
    userStatus: string;
  })[];
  inboxMessages: InboxMessage[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  whatsappGroups?: WhatsAppGroupLink[];
  whatsappMessages?: WhatsAppAlertMessage[];
  budgetIncreaseRequests?: BudgetIncreaseRequest[];
  clubBroadcasts?: ClubBroadcastMessage[];
}

const ADMIN_NAV = [
  { id: 'dashboard', label: 'Student Life Console', icon: LayoutDashboard, section: 'Student Life Governance (L1)' },
  { id: 'clubs', label: 'Clubs & Membership', icon: Building2, section: 'Student Life Governance (L1)' },
  { id: 'account-requests', label: 'Account Requests', icon: ClipboardCheck, section: 'Student Life Governance (L1)' },
  { id: 'club-leaders', label: 'Club Leaders', icon: UserCheck, section: 'Student Life Governance (L1)' },
  { id: 'social-accounts', label: 'Social Accounts', icon: Share2, section: 'Student Life Governance (L1)' },
  { id: 'users-permissions', label: 'Users & Access Control', icon: ShieldCheck, section: 'Student Life Governance (L1)' },
  { id: 'activity-logs', label: 'Audit Logs', icon: Activity, section: 'Student Life Governance (L1)' },
  { id: 'reports', label: 'Governance Reports', icon: FileText, section: 'Student Life Governance (L1)' },
  { id: 'settings', label: 'Platform Settings', icon: Settings, section: 'Student Life Governance (L1)' },
  { id: 'club-dashboard', label: 'Club Overview Table', icon: Building2, section: 'Campus & Club Oversight (L2)' },
  { id: 'club-announcements', label: 'Club Announcements', icon: Megaphone, section: 'Campus & Club Oversight (L2)' },
  { id: 'upcoming-events', label: 'Upcoming Events', icon: CalendarPlus, section: 'Campus & Club Oversight (L2)' },
  { id: 'event-calendar', label: 'Club Event Calendar', icon: CalendarDays, section: 'Campus & Club Oversight (L2)' },
  { id: 'event-analytics', label: 'Event Analytics', icon: TrendingUp, section: 'Campus & Club Oversight (L2)' },
  { id: 'event-reminders', label: 'Email Reminders', icon: Mail, section: 'Campus & Club Oversight (L2)' },
  { id: 'club-forums', label: 'Club Forums', icon: MessageSquare, section: 'Campus & Club Oversight (L2)' },
  { id: 'project-tasks', label: 'Project Tasks', icon: ListChecks, section: 'Campus & Club Oversight (L2)' },
  { id: 'member-directory', label: 'Member Directory', icon: Users, section: 'Campus & Club Oversight (L2)' },
  { id: 'messaging-center', label: 'Club Messaging Center', icon: Megaphone, section: 'Campus & Club Oversight (L2)' },
  { id: 'club-blog', label: 'Club Blog', icon: BookOpen, section: 'Campus & Club Oversight (L2)' },
  { id: 'campus-directory', label: 'Campus Directory', icon: Globe, section: 'Campus & Club Oversight (L2)' },
  { id: 'club-resources', label: 'Club Resources', icon: FolderDown, section: 'Campus & Club Oversight (L2)' },
  { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles, section: 'Campus & Club Oversight (L2)' },
];

const CLUB_NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, section: 'Workspace' },
  { id: 'club-announcements', label: 'Club Announcements', icon: Megaphone, section: 'Workspace' },
  { id: 'create-post', label: 'Create Post', icon: PenSquare, section: 'Social Publishing' },
  { id: 'calendar', label: 'Content Calendar', icon: CalendarDays, section: 'Social Publishing' },
  { id: 'social-accounts', label: 'My Social Accounts', icon: Share2, section: 'Social Publishing' },
  { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles, section: 'Social Publishing' },
  { id: 'inbox', label: 'Inbox', icon: Inbox, section: 'Social Publishing' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, section: 'Social Publishing' },
  { id: 'upcoming-events', label: 'Upcoming Events', icon: CalendarPlus, section: 'Club Community' },
  { id: 'event-calendar', label: 'Club Event Calendar', icon: CalendarDays, section: 'Club Community' },
  { id: 'event-analytics', label: 'Event Analytics', icon: TrendingUp, section: 'Club Community' },
  { id: 'event-reminders', label: 'Email Reminders', icon: Mail, section: 'Club Community' },
  { id: 'club-forums', label: 'Club Forums', icon: MessageSquare, section: 'Club Community' },
  { id: 'ask-club', label: 'Ask the Club', icon: HelpCircle, section: 'Club Community' },
  { id: 'member-questions', label: 'Member Questions', icon: HelpCircle, section: 'Club Community' },
  { id: 'messaging-center', label: 'Messaging Center', icon: Megaphone, section: 'Club Community' },
  { id: 'whatsapp', label: 'WhatsApp Group', icon: MessageCircle, section: 'Club Community' },
  { id: 'club-blog', label: 'Club Blog', icon: BookOpen, section: 'Club Community' },
  { id: 'project-tasks', label: 'Project Tasks', icon: ListChecks, section: 'Club Community' },
  { id: 'club-dashboard', label: 'Club Dashboard', icon: Building2, section: 'Administration' },
  { id: 'member-directory', label: 'Member Directory', icon: Users, section: 'Administration' },
  { id: 'team', label: 'Team Management', icon: UserCheck, section: 'Administration' },
  { id: 'account-requests', label: 'Account Requests', icon: ClipboardCheck, section: 'Administration' },
  { id: 'club-resources', label: 'Club Resources', icon: FolderDown, section: 'Administration' },
  { id: 'campus-directory', label: 'Campus Directory', icon: Globe, section: 'Administration' },
  { id: 'settings', label: 'Settings', icon: Settings, section: 'Administration' },
];

interface ClubDashboardProps {
  clubs: Club[];
  activeClubId: string | null;
  portalMode: 'ADMIN' | 'CLUB';
  onOpenClubWorkspace: (clubId: string) => void;
}

export function ClubDashboard({
  clubs,
  activeClubId,
  portalMode,
  onOpenClubWorkspace,
}: ClubDashboardProps) {
  const { content, updateContent } = useSiteContent();
  const [statusFilter, setStatusFilter] = useState<'active' | 'all'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  const visibleClubs = clubs.filter((club) => {
    if (statusFilter === 'active' && club.status !== 'Active') return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      club.name.toLowerCase().includes(q) ||
      club.shortCode.toLowerCase().includes(q) ||
      club.facultyAdvisor.toLowerCase().includes(q) ||
      club.category.toLowerCase().includes(q)
    );
  });

  const activeCount = clubs.filter((c) => c.status === 'Active').length;
  const compliantCount = clubs.filter(
    (c) => c.status === 'Active' && c.governanceSummary?.governanceStatus === 'Compliant'
  ).length;
  const attentionCount = clubs.filter(
    (c) => c.governanceSummary?.governanceStatus === 'Attention Required'
  ).length;

  return (
    <section
      aria-label="Club Dashboard"
      className="bg-white border border-slate-200 rounded-lg overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <EditableText
              as="h2"
              value={content.pages.portal.clubDashboardHeading}
              onChange={(next) =>
                updateContent((d) => {
                  d.pages.portal.clubDashboardHeading = next;
                })
              }
              className="text-base font-bold text-slate-900"
            />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeCount} active clubs · {compliantCount} fully compliant · {attentionCount}{' '}
            requiring custodian or token attention
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clubs or advisors..."
              aria-label="Search student clubs"
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active Clubs ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({clubs.length})
            </button>
          </div>
        </div>
      </div>

      {visibleClubs.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500">
          No student clubs match the current filter.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Student Organization</th>
                <th className="py-3 px-4">Workspace Status</th>
                <th className="py-3 px-4">Governance Status</th>
                <th className="py-3 px-4 text-right">Authorized Leads</th>
                <th className="py-3 px-4 text-right">Connected Accounts</th>
                <th className="py-3 px-4 text-right">Pending Requests</th>
                <th className="py-3 px-4">Faculty Advisor</th>
                <th className="py-3 px-4 text-right">Workspace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {visibleClubs.map((club) => {
                const gov = club.governanceSummary;
                const govStatus = gov?.governanceStatus ?? (club.status === 'Active' ? 'Compliant' : club.status);
                const isCurrent = portalMode === 'CLUB' && activeClubId === club.clubId;
                return (
                  <tr key={club.clubId} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <ClubLogoMark
                          clubId={club.clubId}
                          clubShortCode={club.shortCode}
                          clubName={club.name}
                          logoUrl={club.logoUrl}
                          accentColor={club.accentColor}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900">{club.name}</div>
                          <div className="text-slate-500 mt-0.5">
                            <span className="font-mono">{club.shortCode}</span>
                            <span className="mx-1.5" aria-hidden="true">·</span>
                            <span>{club.category}</span>
                          </div>
                          {club.upcomingLeadershipChange && (
                            <div className="text-amber-700 mt-1">{club.upcomingLeadershipChange}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusText status={club.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusText status={govStatus} />
                      {gov && gov.issueAccountsCount > 0 && (
                        <div className="text-[11px] text-red-700 mt-0.5 font-mono-tabular">
                          {gov.issueAccountsCount} token/integration alert
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-slate-800">
                      {gov?.authorizedLeadersCount ?? 0}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-slate-800">
                      {gov?.connectedAccountsCount ?? 0}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-slate-800">
                      {gov?.pendingRequestsCount ?? 0}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{club.facultyAdvisor}</td>
                    <td className="py-3.5 px-4 text-right">
                      {club.status === 'Active' ? (
                        isCurrent ? (
                          <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                            Active View
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenClubWorkspace(club.clubId)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#004B87] hover:underline whitespace-nowrap cursor-pointer"
                          >
                            <span>Open Workspace</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          Awaiting Activation
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

interface UpcomingClubEventsProps {
  events: ClubEvent[];
  clubs: Club[];
  activeClubId: string | null;
  portalMode: 'ADMIN' | 'CLUB';
  onRefresh: () => Promise<void>;
  onDraftPostForEvent?: (event: ClubEvent) => void;
  onAskQuestion?: (event: ClubEvent) => void;
}

export function UpcomingClubEvents({
  events,
  clubs,
  activeClubId,
  portalMode,
  onRefresh,
  onDraftPostForEvent,
  onAskQuestion,
}: UpcomingClubEventsProps) {
  const { apiFetch, session } = useAuth();
  const { content, updateContent } = useSiteContent();
  const [typeFilter, setTypeFilter] = useState<'All' | ClubEventType>('All');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'active'>(
    portalMode === 'CLUB' ? 'active' : 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const postableClubs = clubs.filter((c) => {
    if (session?.effectiveAdminRole) return true;
    return session?.memberships.some(
      (m) =>
        m.clubId === c.clubId &&
        m.status === 'Active' &&
        m.role !== 'VIEWER' &&
        m.role !== 'CONTRIBUTOR'
    );
  });

  const deletableClubIds = new Set(
    clubs
      .filter((c) => {
        if (session?.effectiveAdminRole) return true;
        return session?.memberships.some(
          (m) =>
            m.clubId === c.clubId &&
            m.status === 'Active' &&
            (m.role === 'CLUB_LEAD' || m.role === 'EDITOR')
        );
      })
      .map((c) => c.clubId)
  );

  const defaultClubId =
    (activeClubId && postableClubs.some((c) => c.clubId === activeClubId)
      ? activeClubId
      : postableClubs[0]?.clubId) ?? '';

  const [targetClubId, setTargetClubId] = useState(defaultClubId);
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<ClubEventType>('Club Meeting');
  const [date, setDate] = useState('2026-11-28');
  const [time, setTime] = useState('18:30');
  const [location, setLocation] = useState('Zoom / CUNY SPS Virtual Commons');
  const [description, setDescription] = useState('');
  const [recurrence, setRecurrence] = useState<EventRecurrence>('None');
  const [recurrenceCount, setRecurrenceCount] = useState(4);
  const [inPersonCapacityInput, setInPersonCapacityInput] = useState('');
  const [coSponsorIds, setCoSponsorIds] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rsvpingId, setRsvpingId] = useState<string | null>(null);
  const [selectedRsvpModes, setSelectedRsvpModes] = useState<Record<string, 'In-Person' | 'Virtual'>>({});
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    inPersonCapacity: '',
    coSponsorClubIds: [] as string[],
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [checkInEventId, setCheckInEventId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    setScopeFilter(portalMode === 'CLUB' ? 'active' : 'all');
  }, [portalMode]);

  useEffect(() => {
    if (defaultClubId && !postableClubs.some((c) => c.clubId === targetClubId)) {
      setTargetClubId(defaultClubId);
    }
  }, [defaultClubId, postableClubs, targetClubId]);

  const filteredEvents = events.filter((ev) => {
    if (scopeFilter === 'active' && activeClubId && ev.clubId !== activeClubId && !ev.coSponsorClubIds?.includes(activeClubId)) {
      return false;
    }
    const resolvedType = ev.eventType ?? 'Campus Event';
    if (typeFilter !== 'All' && resolvedType !== typeFilter) {
      return false;
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      ev.title.toLowerCase().includes(q) ||
      ev.location.toLowerCase().includes(q) ||
      ev.description.toLowerCase().includes(q) ||
      (ev.clubName ?? '').toLowerCase().includes(q) ||
      (ev.clubShortCode ?? '').toLowerCase().includes(q)
    );
  });

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const clubToUse = targetClubId || defaultClubId;
    if (!clubToUse) {
      setFormError('Select an authorized student club to post this event.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    setFeedback('');
    const parsedCap = Number(inPersonCapacityInput);
    try {
      const res = await apiFetch<{ event: ClubEvent; createdCount?: number }>(
        `/api/clubs/${clubToUse}/events`,
        {
          method: 'POST',
          body: JSON.stringify({
            title,
            eventType,
            date,
            time,
            location,
            description,
            recurrence,
            recurrenceCount: recurrence === 'None' ? 1 : recurrenceCount,
            inPersonCapacity: Number.isFinite(parsedCap) && parsedCap > 0 ? parsedCap : undefined,
            coSponsorClubIds: coSponsorIds.filter((id) => id !== clubToUse),
            isPublic,
          }),
        }
      );
      setTitle('');
      setDescription('');
      setRecurrence('None');
      setInPersonCapacityInput('');
      setCoSponsorIds([]);
      setShowCreateForm(false);
      setFeedback(
        res.createdCount && res.createdCount > 1
          ? `Recurring series scheduled (${res.createdCount} ${recurrence.toLowerCase()} meetings).`
          : 'Upcoming meeting or campus event posted to club schedule.'
      );
      await onRefresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to post event.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (ev: ClubEvent) => {
    if (editingEventId === ev.eventId) {
      setEditingEventId(null);
      return;
    }
    setEditingEventId(ev.eventId);
    setEditDraft({
      title: ev.title,
      date: ev.date,
      time: ev.time,
      location: ev.location,
      description: ev.description,
      inPersonCapacity: ev.inPersonCapacity ? String(ev.inPersonCapacity) : '',
      coSponsorClubIds: ev.coSponsorClubIds ?? [],
    });
  };

  const handleSaveEdit = async (ev: ClubEvent) => {
    setSubmitting(true);
    setFormError('');
    setFeedback('');
    const parsedCap = editDraft.inPersonCapacity.trim() ? Number(editDraft.inPersonCapacity) : null;
    try {
      const res = await apiFetch<{ event: ClubEvent; noticesSent: number; changeSummary: string }>(
        `/api/clubs/${ev.clubId}/events/${ev.eventId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            title: editDraft.title,
            date: editDraft.date,
            time: editDraft.time,
            location: editDraft.location,
            description: editDraft.description,
            inPersonCapacity:
              parsedCap !== null && Number.isFinite(parsedCap) && parsedCap > 0 ? parsedCap : null,
            coSponsorClubIds: editDraft.coSponsorClubIds,
          }),
        }
      );
      setEditingEventId(null);
      setFeedback(
        res.noticesSent > 0
          ? `Event updated (${res.changeSummary}). Recorded ${res.noticesSent} schedule-change email notice(s); check delivery status in Email Reminders.`
          : `Event details saved for "${ev.title}".`
      );
      await onRefresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to update event details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleRsvp = async (ev: ClubEvent) => {
    setRsvpingId(ev.eventId);
    setFormError('');
    setFeedback('');
    const currentGoing = Boolean(ev.userHasRsvped || ev.userOnWaitlist);
    const chosenMode =
      selectedRsvpModes[ev.eventId] ?? (ev.inPersonCapacity ? 'In-Person' : 'Virtual');
    try {
      const res = await apiFetch<{ waitlisted?: boolean; promotedUserName?: string }>(
        `/api/clubs/${ev.clubId}/events/${ev.eventId}/rsvp`,
        {
          method: 'POST',
          body: JSON.stringify({
            attending: !currentGoing,
            mode: chosenMode,
          }),
        }
      );
      if (!currentGoing) {
        setFeedback(
          res.waitlisted
            ? `In-person room cap reached. Added you to the waitlist for "${ev.title}".`
            : `${chosenMode} RSVP confirmed for "${ev.title}".`
        );
      } else {
        setFeedback(
          res.promotedUserName
            ? `Cancelled RSVP for "${ev.title}". Auto-promoted ${res.promotedUserName} from waitlist.`
            : `Cancelled RSVP / waitlist spot for "${ev.title}".`
        );
      }
      await onRefresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to update RSVP status.');
    } finally {
      setRsvpingId(null);
    }
  };

  const handleDeleteEvent = async (ev: ClubEvent) => {
    setDeletingId(ev.eventId);
    setFormError('');
    setFeedback('');
    try {
      await apiFetch(`/api/clubs/${ev.clubId}/events/${ev.eventId}`, {
        method: 'DELETE',
      });
      setFeedback(`Removed "${ev.title}" from upcoming events.`);
      await onRefresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to remove event.');
    } finally {
      setDeletingId(null);
    }
  };

  const totalExpectedAttendance = filteredEvents.reduce(
    (sum, ev) => sum + (ev.rsvpCount ?? ev.rsvpUserIds?.length ?? 0),
    0
  );

  return (
    <section
      aria-label="Upcoming Club Events"
      className="bg-white border border-slate-200 rounded-lg overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <EditableText
            as="h2"
            value={content.pages.portal.upcomingEventsHeading}
            onChange={(next) =>
              updateContent((d) => {
                d.pages.portal.upcomingEventsHeading = next;
              })
            }
            className="text-base font-bold text-slate-900"
          />
          <p className="text-xs text-slate-500 mt-0.5 font-mono-tabular">
            {filteredEvents.length} scheduled meeting{filteredEvents.length === 1 ? '' : 's'} &amp;
            campus event{filteredEvents.length === 1 ? '' : 's'} · {totalExpectedAttendance}{' '}
            expected attending
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events or locations..."
              aria-label="Search upcoming club events"
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'All' | ClubEventType)}
            aria-label="Filter by event category"
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-700"
          >
            <option value="All">All Categories</option>
            <option value="Club Meeting">Club Meeting</option>
            <option value="Campus Event">Campus Event</option>
            <option value="Workshop">Workshop</option>
            <option value="Networking">Networking</option>
          </select>

          {clubs.length > 1 && activeClubId && (
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
              <button
                type="button"
                onClick={() => setScopeFilter('active')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  scopeFilter === 'active'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active Club
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  scopeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Authorized Clubs
              </button>
            </div>
          )}

          {filteredEvents.length > 0 && (
            <button
              type="button"
              onClick={() => {
                downloadCalendarIcs(filteredEvents);
                setFeedback(
                  `Downloaded .ics calendar file for ${filteredEvents.length} upcoming event(s).`
                );
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#004B87]" />
              <span>Export .ics</span>
            </button>
          )}

          {postableClubs.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setFormError('');
                setShowCreateForm((prev) => !prev);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#004B87] hover:bg-[#003865] rounded-md whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showCreateForm ? 'Close Form' : 'Post Event / Meeting'}</span>
            </button>
          )}
        </div>
      </div>

      {formError && (
        <div role="alert" className="mx-5 mt-4 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md">
          {formError}
        </div>
      )}
      {feedback && (
        <div className="mx-5 mt-4 p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md">
          {feedback}
        </div>
      )}

      {showCreateForm && postableClubs.length > 0 && (
        <form
          onSubmit={handleCreateEvent}
          className="p-5 bg-slate-50/70 border-b border-slate-200 space-y-4"
        >
          <div className="text-xs font-semibold text-slate-900">
            Post Upcoming Meeting or Campus Event
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Student Organization
              </label>
              <select
                value={targetClubId || defaultClubId}
                onChange={(e) => setTargetClubId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md"
              >
                {postableClubs.map((c) => (
                  <option key={c.clubId} value={c.clubId}>
                    {c.name} ({c.shortCode})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as ClubEventType)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md"
              >
                <option value="Club Meeting">Club Meeting</option>
                <option value="Campus Event">Campus Event</option>
                <option value="Workshop">Workshop</option>
                <option value="Networking">Networking</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Event / Meeting Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Spring Kickoff General Body Meeting"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono-tabular bg-white border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">Time</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono-tabular bg-white border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Location / Virtual Room
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Zoom or 119 W 31st St, Room 402"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Recurrence
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as EventRecurrence)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md"
              >
                <option value="None">Single Event</option>
                <option value="Weekly">Weekly Series</option>
                <option value="Biweekly">Biweekly Series</option>
              </select>
            </div>
            {recurrence !== 'None' && (
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                  Occurrences (2–8)
                </label>
                <input
                  type="number"
                  min={2}
                  max={8}
                  value={recurrenceCount}
                  onChange={(e) =>
                    setRecurrenceCount(Math.min(8, Math.max(2, Number(e.target.value) || 2)))
                  }
                  className="w-full px-3 py-2 text-xs font-mono-tabular bg-white border border-slate-300 rounded-md"
                />
              </div>
            )}
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                In-Person Seat Cap (Optional)
              </label>
              <input
                type="number"
                min={1}
                value={inPersonCapacityInput}
                onChange={(e) => setInPersonCapacityInput(e.target.value)}
                placeholder="e.g. 35 (blank = unlimited)"
                className="w-full px-3 py-2 text-xs font-mono-tabular bg-white border border-slate-300 rounded-md"
              />
            </div>
            <div className="flex items-end pb-1.5">
              <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="accent-[#004B87]"
                />
                <span>Public on Campus Directory</span>
              </label>
            </div>
            {clubs.filter((c) => c.status === 'Active' && c.clubId !== (targetClubId || defaultClubId)).length > 0 && (
              <div className="md:col-span-3">
                <span className="block text-[11px] font-medium text-slate-700 mb-1">
                  Co-Sponsoring Partner Clubs (Optional)
                </span>
                <div className="flex flex-wrap gap-3">
                  {clubs
                    .filter((c) => c.status === 'Active' && c.clubId !== (targetClubId || defaultClubId))
                    .map((c) => {
                      const checked = coSponsorIds.includes(c.clubId);
                      return (
                        <label key={c.clubId} className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setCoSponsorIds((prev) =>
                                checked ? prev.filter((id) => id !== c.clubId) : [...prev, c.clubId]
                              )
                            }
                            className="accent-[#004B87]"
                          />
                          <span>{c.name} ({c.shortCode})</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            )}
            <div className="md:col-span-3">
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Event Details & Agenda
              </label>
              <textarea
                rows={2}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share agenda, guest speakers, or RSVP notes for CUNY SPS students..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-md cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 text-xs font-medium text-white bg-[#004B87] hover:bg-[#003865] disabled:opacity-50 rounded-md cursor-pointer"
            >
              {submitting ? 'Posting Event...' : 'Publish Event to Schedule'}
            </button>
          </div>
        </form>
      )}

      {filteredEvents.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500">
          No upcoming club meetings or campus events match the current filter.
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {filteredEvents.map((ev) => {
            const clubMeta = clubs.find((c) => c.clubId === ev.clubId);
            const clubLabel = ev.clubName || clubMeta?.name || ev.clubId;
            const clubCode = ev.clubShortCode || clubMeta?.shortCode || '';
            const category = ev.eventType ?? 'Campus Event';
            const canDelete = deletableClubIds.has(ev.clubId);
            const rsvpCount = ev.rsvpCount ?? ev.rsvpUserIds?.length ?? 0;
            const isGoing = Boolean(ev.userHasRsvped);
            const isWaitlisted = Boolean(ev.userOnWaitlist);
            const isEditingThis = editingEventId === ev.eventId;
            const currentModeChoice =
              selectedRsvpModes[ev.eventId] ?? (ev.inPersonCapacity ? 'In-Person' : 'Virtual');
            return (
              <div key={ev.eventId}>
                <div className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-24 shrink-0 border border-slate-200 rounded-md bg-slate-50 px-2.5 py-2 text-center">
                      <div className="text-xs font-mono-tabular font-bold text-slate-900">
                        {ev.date}
                      </div>
                      <div className="text-[11px] font-mono-tabular text-slate-500 mt-0.5 flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{ev.time}</span>
                      </div>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-semibold text-[#004B87]">
                          {clubCode ? `${clubCode} · ${clubLabel}` : clubLabel}
                        </span>
                        {ev.coSponsorClubCodes && ev.coSponsorClubCodes.length > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-slate-700">
                              Co-Sponsored w/ {ev.coSponsorClubCodes.join(', ')}
                            </span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-slate-700">{category}</span>
                        {ev.recurrence && ev.recurrence !== 'None' && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 text-[#004B87] font-medium">
                              <Repeat className="w-3 h-3" />
                              <span>{ev.recurrence}</span>
                            </span>
                          </>
                        )}
                        {ev.postedByName && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Posted by {ev.postedByName}</span>
                          </>
                        )}
                        {isWaitlisted && <StatusText status="Waitlisted" />}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">{ev.title}</h3>
                      <p className="text-xs text-slate-600">{ev.description}</p>
                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3 pt-0.5">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{ev.location}</span>
                        </span>
                        <span aria-hidden="true" className="text-slate-300">
                          ·
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-slate-700">
                          <Users className="w-3.5 h-3.5 text-[#004B87] shrink-0" />
                          <span className="font-mono-tabular font-semibold text-slate-900">
                            {rsvpCount}
                          </span>
                          <span>expected attending</span>
                          {typeof ev.inPersonCapacity === 'number' && (
                            <span className="font-mono-tabular text-slate-600">
                              · In-Person {ev.inPersonConfirmedCount ?? 0}/{ev.inPersonCapacity} · Virtual{' '}
                              {ev.virtualConfirmedCount ?? 0}
                              {(ev.waitlistCount ?? 0) > 0 ? ` · Waitlist ${ev.waitlistCount}` : ''}
                            </span>
                          )}
                          {(ev.checkedInCount ?? 0) > 0 && (
                            <span className="font-mono-tabular font-semibold text-emerald-700">
                              · {ev.checkedInCount} checked in
                            </span>
                          )}
                        </span>
                        {typeof ev.avgFeedbackRating === 'number' && (ev.feedbackCount ?? 0) > 0 && (
                          <>
                            <span aria-hidden="true" className="text-slate-300">
                              ·
                            </span>
                            <span className="inline-flex items-center gap-1 text-amber-700 font-mono-tabular font-medium">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span>
                                {ev.avgFeedbackRating.toFixed(1)}/5 ({ev.feedbackCount})
                              </span>
                            </span>
                          </>
                        )}
                        <span aria-hidden="true" className="text-slate-300">
                          ·
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {(ev.reminderSentCount ?? 0) > 0
                              ? `24h reminder records (${ev.reminderSentCount})`
                              : '24h email reminder scheduled'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center">
                    {!isGoing && !isWaitlisted && typeof ev.inPersonCapacity === 'number' && (
                      <select
                        value={currentModeChoice}
                        onChange={(e) =>
                          setSelectedRsvpModes((prev) => ({
                            ...prev,
                            [ev.eventId]: e.target.value as 'In-Person' | 'Virtual',
                          }))
                        }
                        aria-label={`RSVP attendance mode for ${ev.title}`}
                        className="px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-700"
                      >
                        <option value="In-Person">
                          In-Person ({ev.inPersonConfirmedCount ?? 0}/{ev.inPersonCapacity})
                        </option>
                        <option value="Virtual">Virtual (Unlimited)</option>
                      </select>
                    )}

                    <button
                      type="button"
                      disabled={rsvpingId === ev.eventId}
                      onClick={() => void handleToggleRsvp(ev)}
                      aria-pressed={isGoing || isWaitlisted}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 ${
                        isGoing
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100/70'
                          : isWaitlisted
                            ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100/70'
                            : 'bg-white border-[#004B87] text-[#004B87] hover:bg-sky-50'
                      }`}
                    >
                      {isGoing ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>
                            {rsvpingId === ev.eventId
                              ? 'Updating...'
                              : `Attending${ev.userRsvpMode ? ` (${ev.userRsvpMode})` : ''} · Cancel`}
                          </span>
                        </>
                      ) : isWaitlisted ? (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>{rsvpingId === ev.eventId ? 'Updating...' : 'Waitlisted · Leave'}</span>
                        </>
                      ) : (
                        <>
                          <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
                          <span>{rsvpingId === ev.eventId ? 'Saving...' : 'RSVP'}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setCheckInEventId((prev) =>
                          prev === ev.eventId ? null : ev.eventId
                        )
                      }
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border whitespace-nowrap shrink-0 cursor-pointer ${
                        checkInEventId === ev.eventId
                          ? 'bg-[#004B87] text-white border-[#004B87]'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>
                        Check-In{(ev.checkedInCount ?? 0) > 0 ? ` (${ev.checkedInCount})` : ''}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadEventIcs(ev)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 text-[#004B87]" />
                      <span>.ics</span>
                    </button>

                    <a
                      href={buildGoogleCalendarUrl(ev)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md whitespace-nowrap shrink-0"
                    >
                      <span>Google Cal</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>

                    {onAskQuestion && (
                      <button
                        type="button"
                        onClick={() => onAskQuestion(ev)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#004B87] bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-[#004B87]" />
                        <span>Ask a question</span>
                      </button>
                    )}

                    {onDraftPostForEvent && (
                      <button
                        type="button"
                        onClick={() => onDraftPostForEvent(ev)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#004B87] hover:underline whitespace-nowrap cursor-pointer"
                      >
                        <span>Draft Social Post</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {canDelete && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(ev)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-[#004B87] whitespace-nowrap cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{isEditingThis ? 'Close Edit' : 'Edit'}</span>
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === ev.eventId}
                          onClick={() => void handleDeleteEvent(ev)}
                          aria-label={`Remove ${ev.title}`}
                          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-700 disabled:opacity-50 whitespace-nowrap cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{deletingId === ev.eventId ? 'Removing...' : 'Remove'}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isEditingThis && (
                  <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900">
                        Edit Event Logistics (Auto-emails RSVP attendees if date, time, or room changes)
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input
                        type="text"
                        value={editDraft.title}
                        onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                        placeholder="Event title"
                        className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                      />
                      <input
                        type="date"
                        value={editDraft.date}
                        onChange={(e) => setEditDraft({ ...editDraft, date: e.target.value })}
                        className="px-3 py-1.5 text-xs font-mono-tabular bg-white border border-slate-300 rounded-md"
                      />
                      <input
                        type="time"
                        value={editDraft.time}
                        onChange={(e) => setEditDraft({ ...editDraft, time: e.target.value })}
                        className="px-3 py-1.5 text-xs font-mono-tabular bg-white border border-slate-300 rounded-md"
                      />
                      <input
                        type="text"
                        value={editDraft.location}
                        onChange={(e) => setEditDraft({ ...editDraft, location: e.target.value })}
                        placeholder="Room or Zoom link"
                        className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                      />
                      <input
                        type="number"
                        min={1}
                        value={editDraft.inPersonCapacity}
                        onChange={(e) =>
                          setEditDraft({ ...editDraft, inPersonCapacity: e.target.value })
                        }
                        placeholder="In-person cap (blank = unlimited)"
                        className="px-3 py-1.5 text-xs font-mono-tabular bg-white border border-slate-300 rounded-md"
                      />
                      <div className="md:col-span-3">
                        <input
                          type="text"
                          value={editDraft.description}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, description: e.target.value })
                          }
                          placeholder="Event description"
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingEventId(null)}
                        className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-md cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => void handleSaveEdit(ev)}
                        className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#004B87] hover:bg-[#003865] rounded-md cursor-pointer"
                      >
                        {submitting ? 'Saving...' : 'Save & Notify Attendees'}
                      </button>
                    </div>
                  </div>
                )}

                {checkInEventId === ev.eventId && (
                  <EventCheckInDrawer
                    event={ev}
                    canManage={canDelete}
                    onClose={() => setCheckInEventId(null)}
                    onCheckedIn={onRefresh}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function AppShell() {
  const {
    session,
    portalMode,
    setPortalMode,
    activeClubId,
    setActiveClubId,
    setDraftHandoff,
    logout,
    apiFetch,
  } = useAuth();

  const [adminTab, setAdminTab] = useState('dashboard');
  const [clubTab, setClubTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pageSearch, setPageSearch] = useState('');

  const [adminData, setAdminData] = useState<AdminOverviewData | null>(null);
  const [authorizedClubs, setAuthorizedClubs] = useState<Club[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<ClubEvent[]>([]);
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>([]);
  const [clubData, setClubData] = useState<ClubWorkspacePayload | null>(null);
  const [globalNotifications, setGlobalNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const workspaceRequest = useRef(0);
  const refreshRequest = useRef(0);
  const [error, setError] = useState('');

  const loadAuthorizedClubs = useCallback(async () => {
    const res = await apiFetch<{ clubs: Club[] }>('/api/clubs');
    setAuthorizedClubs(res.clubs);
    return res.clubs;
  }, [apiFetch]);

  const loadUpcomingEvents = useCallback(async () => {
    const res = await apiFetch<{ events: ClubEvent[] }>('/api/events');
    setUpcomingEvents(res.events);
  }, [apiFetch]);

  const loadAnnouncements = useCallback(async () => {
    const res = await apiFetch<{ announcements: ClubAnnouncement[] }>('/api/announcements');
    setAnnouncements(res.announcements);
  }, [apiFetch]);

  const loadNotifications = useCallback(async () => {
    const res = await apiFetch<{ notifications: NotificationItem[]; unreadCount: number }>(
      '/api/notifications'
    );
    setGlobalNotifications(res.notifications);
    setUnreadNotificationsCount(res.unreadCount);
  }, [apiFetch]);

  const loadAdminOverview = useCallback(async () => {
    if (!session?.effectiveAdminRole) return;
    const res = await apiFetch<AdminOverviewData>('/api/admin/overview');
    setAdminData(res);
  }, [apiFetch, session?.effectiveAdminRole]);

  const loadClubWorkspace = useCallback(
    async (clubId: string) => {
      const request = ++workspaceRequest.current;
      const res = await apiFetch<ClubWorkspacePayload>(`/api/clubs/${clubId}`);
      if (request === workspaceRequest.current) setClubData(res);
    },
    [apiFetch]
  );

  const refreshAll = useCallback(async () => {
    const request = ++refreshRequest.current;
    setError('');
    try {
      const [clubs] = await Promise.all([
        loadAuthorizedClubs(),
        loadUpcomingEvents(),
        loadAnnouncements(),
        loadNotifications(),
      ]);
      if (session?.effectiveAdminRole) {
        await loadAdminOverview();
      }
      if (request !== refreshRequest.current) return;
      const targetClubId =
        activeClubId && clubs.some((c) => c.clubId === activeClubId)
          ? activeClubId
          : clubs[0]?.clubId ?? null;
      if (targetClubId) {
        if (targetClubId !== activeClubId) setActiveClubId(targetClubId);
        await loadClubWorkspace(targetClubId);
      } else {
        setClubData(null);
      }
    } catch (err) {
      if (request === refreshRequest.current) setError(err instanceof Error ? err.message : 'Unable to load workspace data.');
    } finally {
      if (request === refreshRequest.current) setLoading(false);
    }
  }, [
    activeClubId,
    loadAdminOverview,
    loadAnnouncements,
    loadAuthorizedClubs,
    loadClubWorkspace,
    loadNotifications,
    loadUpcomingEvents,
    session?.effectiveAdminRole,
    setActiveClubId,
  ]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const handleMarkNotificationRead = async (id: string) => {
    await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' });
    await loadNotifications();
  };

  const handleMarkAllNotificationsRead = async () => {
    await apiFetch('/api/notifications/read-all', { method: 'POST' });
    await loadNotifications();
  };

  const handleNotificationSelect = async (n: NotificationItem) => {
    if (!(await requestDraftDiscard())) return;
    if (!n.read) {
      await handleMarkNotificationRead(n.notificationId);
    }
    setNotificationsOpen(false);
    if (n.clubId && authorizedClubs.some((c) => c.clubId === n.clubId)) {
      setActiveClubId(n.clubId);
      setPortalMode('CLUB');
      if (
        n.title.includes('Broadcast:') ||
        n.message.includes('Messaging Center')
      ) {
        setClubTab('messaging-center');
      } else if (n.type === 'Forum Mention' || n.type === 'Forum Reply') setClubTab('club-forums');
      else if (n.type === 'Peer Review' || n.type === 'Reshare Request' || n.type === 'Publishing')
        setClubTab('create-post');
      else if (n.type === 'Resource Submission' || n.type === 'Advisor Sign-Off')
        setClubTab('club-resources');
      else if (n.type === 'Join Request' || n.type === 'Membership')
        setClubTab('member-directory');
      else if (n.type === 'Event Reminder') setClubTab('upcoming-events');
      else if (n.type === 'Security') setClubTab('social-accounts');
      else if (n.type === 'Approval') setClubTab('account-requests');
      else setClubTab('overview');
    } else if (session?.effectiveAdminRole) {
      setPortalMode('ADMIN');
      if (n.type === 'Approval') setAdminTab('account-requests');
      else if (n.type === 'Resource Submission' || n.type === 'Advisor Sign-Off')
        setAdminTab('club-resources');
      else if (n.type === 'Security') setAdminTab('social-accounts');
      else setAdminTab('dashboard');
    }
  };

  const handleDraftPostFromEvent = async (ev: ClubEvent) => {
    if (!(await requestDraftDiscard())) return;
    setActiveClubId(ev.clubId);
    setPortalMode('CLUB');
    setEditingPost(null);
    setDraftHandoff({
      title: ev.title,
      caption: `${ev.title}\n\n${ev.description}\n\nDate: ${ev.date} at ${ev.time}\nLocation: ${ev.location}`,
      hashtags: [
        '#CUNYSPS',
        ev.clubShortCode ? `#${ev.clubShortCode.replace(/[^A-Z0-9]/gi, '')}` : '#StudentLife',
      ],
      callToAction: 'RSVP via Student Life Portal',
      relatedEvent: ev.title,
      eventDate: ev.date,
      aiAssisted: false,
    });
    setClubTab('create-post');
  };

  const handleOpenClubWorkspace = async (clubId: string) => {
    if (!(await requestDraftDiscard())) return;
    setActiveClubId(clubId);
    setPortalMode('CLUB');
    setClubTab('overview');
  };

  const {
    content,
    isEditActive,
    activeCustomPageId,
    setActiveCustomPageId,
    updateContent,
  } = useSiteContent();
  const [draggingPortalNavId, setDraggingPortalNavId] = useState<string | null>(null);

  const [askPrefill, setAskPrefill] = useState<{
    eventId?: string;
    eventTitle?: string;
    topic?: QuestionTopic;
  } | null>(null);

  const handleAskQuestionFromEvent = (event: ClubEvent) => {
    setAskPrefill({
      eventId: event.eventId,
      eventTitle: event.title,
      topic: 'Events',
    });
    setClubTab('ask-club');
  };

  const effectiveRole = portalMode === 'CLUB' ? clubData?.effectiveRole : null;

  useEffect(() => {
    if (portalMode === 'CLUB' && effectiveRole === 'CONTRIBUTOR') {
      const allowed = new Set([
        'overview',
        'club-announcements',
        'ask-club',
        'upcoming-events',
        'event-calendar',
        'club-blog',
        'club-forums',
      ]);
      if (!allowed.has(clubTab)) {
        setClubTab('overview');
      }
    }
  }, [portalMode, effectiveRole, clubTab]);

  const iconById = new Map<string, React.ComponentType<{ className?: string }>>([
    ...ADMIN_NAV.map((n) => [n.id, n.icon] as const),
    ...CLUB_NAV.map((n) => [n.id, n.icon] as const),
  ]);

  const navConfigKey = portalMode === 'ADMIN' ? 'adminNav' : 'clubNav';
  const configuredNav = content.navigation[navConfigKey];
  const visibleConfiguredNav = isEditActive
    ? configuredNav
    : configuredNav.filter((item) => item.visible);

  const roleFilteredNav = visibleConfiguredNav.filter((item) => {
    if (portalMode === 'ADMIN') return true;

    if (effectiveRole === 'CONTRIBUTOR') {
      const allowedContributorTabs = new Set([
        'overview',
        'club-announcements',
        'ask-club',
        'upcoming-events',
        'event-calendar',
        'club-blog',
        'club-forums',
      ]);
      return allowedContributorTabs.has(item.id);
    }

    if (effectiveRole === 'VIEWER') {
      const allowedViewerTabs = new Set([
        'overview',
        'club-announcements',
        'upcoming-events',
        'event-calendar',
        'club-blog',
        'club-forums',
      ]);
      return allowedViewerTabs.has(item.id);
    }

    if (item.id === 'ask-club') {
      return false;
    }

    return true;
  });

  const navItems = roleFilteredNav.map((item) => ({
    ...item,
    icon: iconById.get(item.id) ?? (item.customUrl ? ExternalLink : Link2),
  }));

  const currentTabId = portalMode === 'ADMIN' ? adminTab : clubTab;
  const activeCustomPage = activeCustomPageId
    ? content.customPages.find((p) => p.id === activeCustomPageId) ?? null
    : null;
  const currentTabLabel = activeCustomPage
    ? activeCustomPage.title
    : navItems.find((item) => item.id === currentTabId)?.label ?? 'Overview';

  const handleSelectNav = async (id: string) => {
    const matched = navItems.find((n) => n.id === id);
    if (matched?.customUrl) {
      return;
    }
    if (!(await requestDraftDiscard())) return;
    if (matched?.customPageId) {
      setActiveCustomPageId(matched.customPageId);
      setMobileMenuOpen(false);
      return;
    }
    setActiveCustomPageId(null);
    if (portalMode === 'ADMIN') setAdminTab(id);
    else setClubTab(id);
    setMobileMenuOpen(false);
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[264px] bg-white border-r border-slate-200 flex flex-col transition-transform lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between gap-2 bg-[#0B0B0F]">
          <HubLogoLockup
            theme="dark"
            size="sm"
            showSubtitle
            subtitleField="sidebarSubtitle"
            subtitle={content.settings.sidebarSubtitle}
          />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-slate-300 hover:text-white cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Portal Switcher & Workspace Selector */}
        <div className="p-4 border-b border-slate-200 space-y-3">
          {session.effectiveAdminRole && (
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-md">
              <button
                type="button"
                onClick={async () => { if (await requestDraftDiscard()) setPortalMode('ADMIN'); }}
                className={`py-1.5 px-2 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                  portalMode === 'ADMIN'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Student Life
              </button>
              <button
                type="button"
                onClick={async () => { if (await requestDraftDiscard()) setPortalMode('CLUB'); }}
                className={`py-1.5 px-2 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                  portalMode === 'CLUB'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Club Portal
              </button>
            </div>
          )}

          {portalMode === 'CLUB' && authorizedClubs.length > 0 && (() => {
            const currentClubObj =
              authorizedClubs.find((c) => c.clubId === activeClubId) ?? authorizedClubs[0];
            return (
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <ClubLogoMark
                    clubId={currentClubObj?.clubId}
                    clubShortCode={currentClubObj?.shortCode}
                    clubName={currentClubObj?.name}
                    logoUrl={currentClubObj?.logoUrl}
                    accentColor={currentClubObj?.accentColor}
                    size="xs"
                  />
                  <label
                    htmlFor="workspace-select"
                    className="block text-[11px] font-semibold text-slate-500"
                  >
                    Active Club Workspace
                  </label>
                </div>
                <select
                  id="workspace-select"
                  value={activeClubId ?? ''}
                  onChange={async (e) => {
                    const nextClub = e.target.value;
                    if (!(await requestDraftDiscard())) return;
                    setActiveClubId(nextClub);
                    setEditingPost(null);
                    void loadClubWorkspace(nextClub);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
                >
                  {authorizedClubs.map((c) => (
                    <option key={c.clubId} value={c.clubId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          })()}

          {portalMode === 'ADMIN' && (
            <div className="flex items-center gap-2.5">
              <StudentLifeLogo className="h-8 w-auto" />
              <div className="text-xs text-slate-600 min-w-0">
                <div className="font-semibold text-slate-900 truncate">University Admin</div>
                <div className="text-[11px] text-slate-500 truncate">
                  {formatRoleLabel(session.effectiveAdminRole)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Links & Signed-in Identity */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-3 space-y-0.5" aria-label="Portal Navigation">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const active = !activeCustomPageId && currentTabId === item.id;
              const section = item.section;
              const prevSection = idx > 0 ? navItems[idx - 1].section : undefined;
              const showSectionHeader = Boolean(section && section !== prevSection);

              const moveSidebarNav = (delta: -1 | 1) => {
                updateContent((d) => {
                  const list = d.navigation[navConfigKey];
                  const from = list.findIndex((n) => n.id === item.id);
                  const to = from + delta;
                  if (from >= 0 && to >= 0 && to < list.length) {
                    const [m] = list.splice(from, 1);
                    list.splice(to, 0, m);
                  }
                });
              };

              return (
                <React.Fragment key={item.id}>
                  {showSectionHeader && (
                    <div
                      className={`px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 ${
                        idx === 0 ? 'pt-1 pb-1' : 'pt-4 pb-1 border-t border-slate-100 mt-2'
                      }`}
                    >
                      {section}
                    </div>
                  )}
                  <div
                    draggable={isEditActive}
                    onDragStart={() => setDraggingPortalNavId(item.id)}
                    onDragOver={(e) => {
                      if (isEditActive) e.preventDefault();
                    }}
                    onDrop={() => {
                      if (!draggingPortalNavId || draggingPortalNavId === item.id) return;
                      updateContent((d) => {
                        const list = d.navigation[navConfigKey];
                        const from = list.findIndex((n) => n.id === draggingPortalNavId);
                        const to = list.findIndex((n) => n.id === item.id);
                        if (from >= 0 && to >= 0) {
                          const [m] = list.splice(from, 1);
                          list.splice(to, 0, m);
                        }
                      });
                      setDraggingPortalNavId(null);
                    }}
                    className={`flex items-center gap-1 ${!item.visible && isEditActive ? 'opacity-45' : ''}`}
                  >
                    {item.customUrl ? (
                      <a
                        href={sanitizeHref(item.customUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-0 flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap"
                      >
                        <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                        <EditableText
                          as="span"
                          value={item.label}
                          onChange={(next) =>
                            updateContent((d) => {
                              const t = d.navigation[navConfigKey].find((n) => n.id === item.id);
                              if (t) t.label = next;
                            })
                          }
                          className="truncate"
                        />
                      </a>
                    ) : (
                      <button
                        type="button"
                        aria-current={active ? 'page' : undefined}
                        onClick={() => handleSelectNav(item.id)}
                        className={`flex-1 min-w-0 flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                          active
                            ? 'bg-sky-50 text-[#004B87] font-semibold'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#004B87]' : 'text-slate-400'}`} />
                        <EditableText
                          as="span"
                          value={item.label}
                          onChange={(next) =>
                            updateContent((d) => {
                              const t = d.navigation[navConfigKey].find((n) => n.id === item.id);
                              if (t) t.label = next;
                            })
                          }
                          className="truncate"
                        />
                      </button>
                    )}

                    {isEditActive && (
                      <span className="inline-flex items-center gap-0.5 shrink-0 pr-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveSidebarNav(-1)}
                          aria-label={`Move ${item.label} up`}
                          className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === navItems.length - 1}
                          onClick={() => moveSidebarNav(1)}
                          aria-label={`Move ${item.label} down`}
                          className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateContent((d) => {
                              const list = d.navigation[navConfigKey];
                              const pos = list.findIndex((n) => n.id === item.id);
                              if (pos >= 0) {
                                list.splice(pos + 1, 0, {
                                  ...list[pos],
                                  id: `nav-copy-${Date.now().toString(36)}`,
                                  label: `${item.label} (Copy)`,
                                  customUrl: item.customUrl || 'https://sps.cuny.edu',
                                });
                              }
                            })
                          }
                          aria-label={`Duplicate ${item.label}`}
                          className="p-0.5 text-slate-400 hover:text-slate-800 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {item.customUrl !== undefined && (
                          <button
                            type="button"
                            onClick={() =>
                              updateContent((d) => {
                                d.navigation[navConfigKey] = d.navigation[navConfigKey].filter(
                                  (n) => n.id !== item.id
                                );
                              })
                            }
                            aria-label={`Delete ${item.label}`}
                            className="p-0.5 text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    )}
                  </div>
                </React.Fragment>
              );
            })}

            {isEditActive && (
              <div className="pt-2 px-2">
                <button
                  type="button"
                  onClick={() =>
                    updateContent((d) => {
                      d.navigation[navConfigKey].push({
                        id: `custom-nav-${Date.now().toString(36)}`,
                        label: 'New Custom Link',
                        section: 'Custom Links',
                        visible: true,
                        customUrl: 'https://sps.cuny.edu',
                      });
                    })
                  }
                  className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-[#004B87] bg-sky-50 border border-dashed border-sky-300 hover:bg-sky-100 rounded-md cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add nav item</span>
                </button>
              </div>
            )}
          </nav>

          {/* Signed-in Identity & Switch Action */}
          <div className="p-4 border-t border-slate-200 space-y-3">
            <PWAInstallButton variant="sidebar" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-slate-900 truncate">{session.user.name}</span>
                {portalMode === 'CLUB' && clubData?.effectiveRole === 'CONTRIBUTOR' && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Contributor
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono text-slate-500 truncate">
                {session.user.email}
              </div>
            </div>
            <button
              type="button"
              onClick={async () => { if (await requestDraftDiscard()) logout(); }}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-md transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <EditableText
                as="span"
                value={content.pages.portal.switchIdentityLabel}
                onChange={(next) =>
                  updateContent((d) => {
                    d.pages.portal.switchIdentityLabel = next;
                  })
                }
              />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-8 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-slate-600 hover:text-slate-900 cursor-pointer"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <nav className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0" aria-label="Breadcrumb">
              <EditableText
                as="span"
                value={
                  portalMode === 'ADMIN'
                    ? content.pages.portal.adminPortalBreadcrumb
                    : content.pages.portal.clubPortalBreadcrumb
                }
                onChange={(next) =>
                  updateContent((d) => {
                    if (portalMode === 'ADMIN') d.pages.portal.adminPortalBreadcrumb = next;
                    else d.pages.portal.clubPortalBreadcrumb = next;
                  })
                }
                className="whitespace-nowrap"
              />
              <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              {portalMode === 'CLUB' && clubData && (
                <>
                  <span className="inline-flex items-center gap-1.5 truncate max-w-[200px] text-slate-700 font-medium">
                    <ClubLogoMark
                      clubId={clubData.club.clubId}
                      clubShortCode={clubData.club.shortCode}
                      clubName={clubData.club.name}
                      logoUrl={clubData.club.logoUrl}
                      accentColor={clubData.club.accentColor}
                      size="xs"
                    />
                    <span className="truncate">{clubData.club.shortCode}</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                </>
              )}
              <span className="text-slate-900 font-semibold whitespace-nowrap truncate">
                {currentTabLabel}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-4 shrink-0 relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen((prev) => !prev)}
              aria-label="Open notifications drawer"
              className="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-slate-600" />
              <EditableText
                as="span"
                value={content.pages.portal.notificationsLabel}
                onChange={(next) =>
                  updateContent((d) => {
                    d.pages.portal.notificationsLabel = next;
                  })
                }
                className="hidden sm:inline"
              />
              {unreadNotificationsCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono-tabular font-bold bg-[#004B87] text-white rounded">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div
                role="dialog"
                aria-label="Cross-club notification center"
                className="absolute right-0 top-11 z-50 w-80 sm:w-96 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Notification Center</div>
                    <div className="text-[11px] text-slate-500 font-mono-tabular">
                      {unreadNotificationsCount} unread across clubs
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadNotificationsCount > 0 && (
                      <button
                        type="button"
                        onClick={() => void handleMarkAllNotificationsRead()}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#004B87] hover:underline cursor-pointer"
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span>Mark all read</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      aria-label="Close notifications drawer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-200">
                  {globalNotifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      You have no unread or recent notifications.
                    </div>
                  ) : (
                    globalNotifications.slice(0, 20).map((n) => (
                      <div
                        key={n.notificationId}
                        className={`px-4 py-3 text-xs space-y-1 transition-colors ${
                          n.read ? 'bg-white' : 'bg-sky-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {n.clubShortCode && (
                              <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700">
                                {n.clubShortCode}
                              </span>
                            )}
                            <span className="text-[11px] font-medium text-[#004B87] truncate">
                              {n.type}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono-tabular text-slate-400 whitespace-nowrap">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleNotificationSelect(n)}
                          className="block w-full text-left font-semibold text-slate-900 hover:text-[#004B87] hover:underline cursor-pointer"
                        >
                          {n.title}
                        </button>
                        <p className="text-[11px] text-slate-600">{notificationText(n.message)}</p>
                        {!n.read && (
                          <button
                            type="button"
                            onClick={() => void handleMarkNotificationRead(n.notificationId)}
                            className="text-[11px] text-[#004B87] hover:underline cursor-pointer"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-600 whitespace-nowrap">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Your Role:{' '}
                <span className="font-semibold text-[#004B87]">
                  {portalMode === 'ADMIN'
                    ? formatRoleLabel(session.effectiveAdminRole)
                    : clubData?.isMember === false
                      ? 'Guest Contributor'
                      : formatRoleLabel(clubData?.effectiveRole)}
                </span>
              </span>
              {portalMode === 'CLUB' && clubData?.effectiveRole === 'CONTRIBUTOR' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {clubData?.isMember === false ? 'Guest' : 'Contributor'}
                </span>
              )}
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 max-w-[1280px] w-full mx-auto">
          <div role="note" className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <strong className="mr-1">
              <EditableText
                as="span"
                value={content.pages.portal.demoBannerTitle}
                onChange={(next) =>
                  updateContent((d) => {
                    d.pages.portal.demoBannerTitle = next;
                  })
                }
              />
            </strong>
            <EditableText
              as="span"
              multiline
              value={content.pages.portal.demoBannerText}
              onChange={(next) =>
                updateContent((d) => {
                  d.pages.portal.demoBannerText = next;
                })
              }
            />
          </div>
          <section role="search" aria-label="Workspace page search" className="mb-6 rounded-lg border border-slate-200 bg-white p-3">
            <label htmlFor="workspace-page-search" className="mb-1 block text-xs font-semibold text-slate-700">
              <EditableText
                as="span"
                value={content.pages.portal.searchLabel}
                onChange={(next) =>
                  updateContent((d) => {
                    d.pages.portal.searchLabel = next;
                  })
                }
              />
            </label>
            <div className="flex gap-2">
              <input id="workspace-page-search" type="search" maxLength={100} value={pageSearch} onChange={e => setPageSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setPageSearch(''); }} placeholder={content.pages.portal.searchPlaceholder} aria-controls="workspace-search-results" className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
              {pageSearch && <button type="button" onClick={() => setPageSearch('')} className="px-2 text-xs text-[#004B87] underline">Clear search</button>}
            </div>
            {pageSearch.trim() && <div id="workspace-search-results" className="mt-3">
              <p role="status" className="mb-2 text-xs text-slate-500">{searchWorkspacePages(navItems, pageSearch).length} matching pages in this portal. Tab to a result and press Enter.</p>
              <ul className="grid gap-1 sm:grid-cols-2">
                {searchWorkspacePages(navItems, pageSearch).map(item => <li key={item.id}><button type="button" onClick={async () => { await handleSelectNav(item.id); setPageSearch(''); }} className="w-full rounded-md p-2 text-left text-sm text-[#004B87] hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-sky-700">{item.label} <span className="text-xs text-slate-500">· {item.section}</span></button></li>)}
              </ul>
              {searchWorkspacePages(navItems, pageSearch).length === 0 && <p className="text-sm text-slate-600">Try a shorter page name or a term such as posts, roster, or email. Search covers pages and tools in your current portal.</p>}
            </div>}
          </section>
          {error && (
            <div role="alert" className="mb-6 p-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <p>{error}</p>
              <button type="button" onClick={() => { setLoading(true); void refreshAll(); }} className="mt-2 font-semibold underline">Retry loading workspace</button>
            </div>
          )}

          {activeCustomPageId ? (
            <CustomPageView
              pageId={activeCustomPageId}
              onBack={() => setActiveCustomPageId(null)}
            />
          ) : loading || (!error && portalMode === 'CLUB' && activeClubId && clubData?.club.clubId !== activeClubId) ? (
            <div className="space-y-4" role="status" aria-live="polite" aria-busy="true">
              <p className="text-sm text-slate-600">Loading workspace data…</p>
              <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-28 bg-slate-200 rounded animate-pulse" />
                <div className="h-28 bg-slate-200 rounded animate-pulse" />
                <div className="h-28 bg-slate-200 rounded animate-pulse" />
              </div>
            </div>
          ) : portalMode === 'ADMIN' && adminData ? (
            <>
              {adminTab === 'dashboard' && (
                <div className="space-y-8">
                  <ClubAnnouncements
                    announcements={announcements}
                    variant="banner"
                    onRefresh={refreshAll}
                    onOpenFullView={() => setAdminTab('club-announcements')}
                  />
                  <AdminDashboard
                    data={adminData}
                    onNavigate={setAdminTab}
                    onOpenClubWorkspace={handleOpenClubWorkspace}
                    onRefresh={refreshAll}
                  />
                  <ClubDashboard
                    clubs={authorizedClubs}
                    activeClubId={activeClubId}
                    portalMode={portalMode}
                    onOpenClubWorkspace={handleOpenClubWorkspace}
                  />
                  <UpcomingClubEvents
                    events={upcomingEvents}
                    clubs={authorizedClubs}
                    activeClubId={activeClubId}
                    portalMode={portalMode}
                    onRefresh={refreshAll}
                    onDraftPostForEvent={handleDraftPostFromEvent}
                  />
                </div>
              )}
              {adminTab === 'club-announcements' && (
                <ClubAnnouncements
                  announcements={announcements}
                  variant="full"
                  onRefresh={refreshAll}
                />
              )}
              {adminTab === 'club-dashboard' && (
                <div className="space-y-6">
                  <ClubAnnouncements
                    announcements={announcements}
                    variant="banner"
                    onRefresh={refreshAll}
                    onOpenFullView={() => setAdminTab('club-announcements')}
                  />
                  <ClubDashboard
                    clubs={authorizedClubs}
                    activeClubId={activeClubId}
                    portalMode={portalMode}
                    onOpenClubWorkspace={handleOpenClubWorkspace}
                  />
                </div>
              )}
              {adminTab === 'upcoming-events' && (
                <UpcomingClubEvents
                  events={upcomingEvents}
                  clubs={authorizedClubs}
                  activeClubId={activeClubId}
                  portalMode={portalMode}
                  onRefresh={refreshAll}
                  onDraftPostForEvent={handleDraftPostFromEvent}
                />
              )}
              {adminTab === 'event-calendar' && (
                <ClubEventCalendar
                  events={upcomingEvents}
                  clubs={authorizedClubs}
                  activeClubId={activeClubId}
                  onRefresh={refreshAll}
                  onDraftPostForEvent={handleDraftPostFromEvent}
                />
              )}
              {adminTab === 'event-analytics' && (
                <EventAnalyticsView
                  clubs={authorizedClubs}
                  activeClubId={activeClubId}
                  onRefreshParent={refreshAll}
                />
              )}
              {adminTab === 'event-reminders' && (
                <EventRemindersView onRefreshParent={refreshAll} />
              )}
              {adminTab === 'club-forums' && (
                <ClubForums
                  clubs={authorizedClubs}
                  activeClubId={activeClubId}
                  onRefreshParent={refreshAll}
                />
              )}
              {adminTab === 'project-tasks' && (
                <ClubProjectTasks
                  clubs={authorizedClubs}
                  activeClubId={activeClubId}
                  onRefreshParent={refreshAll}
                />
              )}
              {adminTab === 'member-directory' && (
                <ClubMemberDirectory
                  activeClubId={activeClubId}
                  onRefreshParent={refreshAll}
                />
              )}
              {adminTab === 'messaging-center' && (activeClubId || authorizedClubs[0]?.clubId) && (
                <ClubMessagingCenter
                  clubId={activeClubId ?? authorizedClubs[0].clubId}
                  variant="full"
                  defaultOpenComposer
                  clubOptions={authorizedClubs.map((c) => ({
                    clubId: c.clubId,
                    name: c.name,
                    shortCode: c.shortCode,
                  }))}
                  onSelectClub={setActiveClubId}
                  onRefreshParent={refreshAll}
                />
              )}
              {adminTab === 'club-blog' && (() => {
                const targetClub =
                  authorizedClubs.find((c) => c.clubId === activeClubId) ??
                  adminData.clubs.find((c) => c.clubId === activeClubId) ??
                  authorizedClubs[0] ??
                  adminData.clubs[0];
                if (!targetClub) return null;
                return (
                  <ClubBlogView
                    club={targetClub}
                    effectiveRole={session.effectiveAdminRole}
                    events={upcomingEvents.filter((ev) => ev.clubId === targetClub.clubId)}
                    clubOptions={(authorizedClubs.length > 0 ? authorizedClubs : adminData.clubs).map(
                      (c) => ({
                        clubId: c.clubId,
                        name: c.name,
                        shortCode: c.shortCode,
                      })
                    )}
                    onSelectClub={setActiveClubId}
                    onShareToSocialStudio={(blogPost) => {
                      setActiveClubId(blogPost.clubId);
                      setPortalMode('CLUB');
                      setEditingPost(null);
                      setDraftHandoff({
                        title: blogPost.title,
                        caption: `${blogPost.title}\n\n${blogPost.excerpt}\n\nRead the full story on the ${blogPost.clubName} blog inside CUNY SPS Club Social Hub.`,
                        hashtags: [
                          '#CUNYSPS',
                          `#${blogPost.clubShortCode.replace(/[^A-Z0-9]/gi, '')}`,
                          ...blogPost.tags
                            .slice(0, 2)
                            .map((t) => `#${t.replace(/[^A-Z0-9]/gi, '')}`)
                            .filter((t) => t.length > 1),
                        ],
                        callToAction: 'Read Full Blog Post in Club Hub',
                        relatedEvent: blogPost.linkedEventTitle ?? '',
                        aiAssisted: false,
                      });
                      setClubTab('create-post');
                    }}
                    onRefreshParent={refreshAll}
                  />
                );
              })()}
              {adminTab === 'campus-directory' && (
                <PublicCampusDirectory mode="portal" onRefreshParent={refreshAll} />
              )}
              {adminTab === 'clubs' && (
                <AdminClubsView
                  clubs={adminData.clubs}
                  onRefresh={refreshAll}
                  onOpenClubWorkspace={handleOpenClubWorkspace}
                />
              )}
              {adminTab === 'club-leaders' && (
                <AdminLeadersView data={adminData} onRefresh={refreshAll} />
              )}
              {adminTab === 'social-accounts' && (
                <AdminAccountsView data={adminData} onRefresh={refreshAll} />
              )}
              {adminTab === 'account-requests' && (
                <AdminRequestsView requests={adminData.accountRequests} onRefresh={refreshAll} />
              )}
              {adminTab === 'users-permissions' && <AdminUsersView clubs={adminData.clubs} />}
              {adminTab === 'activity-logs' && <AdminAuditLogsView logs={adminData.auditLogs} />}
              {adminTab === 'reports' && <AdminReportsView data={adminData} />}
              {adminTab === 'club-resources' && (
                <ClubResourcesView clubs={authorizedClubs} activeClubId={activeClubId} />
              )}
              {adminTab === 'ai-assistant' && <AdminAiAssistantView />}
              {adminTab === 'settings' && <AdminSettingsView onRefresh={refreshAll} />}
            </>
          ) : portalMode === 'CLUB' && clubData && clubData.club.clubId === activeClubId ? (
            <>
              {clubTab === 'overview' && (
                <div className="space-y-8">
                  <button type="button" onClick={() => setClubTab('club-announcements')} className="w-full text-left rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-[#004B87] hover:bg-sky-100">
                    <EditableText
                      as="span"
                      value={content.pages.portal.announcementsBannerPrefix}
                      onChange={(next) =>
                        updateContent((d) => {
                          d.pages.portal.announcementsBannerPrefix = next;
                        })
                      }
                    />{' '}
                    ({announcements.length}) ·{' '}
                    <EditableText
                      as="span"
                      value={content.pages.portal.announcementsBannerSuffix}
                      onChange={(next) =>
                        updateContent((d) => {
                          d.pages.portal.announcementsBannerSuffix = next;
                        })
                      }
                    />
                  </button>
                  <ClubOverview
                    key={clubData.club.clubId}
                    club={clubData.club}
                    effectiveRole={clubData.effectiveRole}
                    isMember={clubData.isMember}
                    pendingJoinRequest={clubData.pendingJoinRequest}
                    socialAccounts={clubData.socialAccounts}
                    posts={clubData.posts}
                    events={clubData.events}
                    analytics={clubData.analytics}
                    notifications={clubData.notifications}
                    whatsappGroups={clubData.whatsappGroups ?? []}
                    whatsappMessages={clubData.whatsappMessages ?? []}
                    budgetIncreaseRequests={clubData.budgetIncreaseRequests ?? []}
                    onNavigate={setClubTab}
                    onEditPost={(post) => {
                      setEditingPost(post);
                      setClubTab('create-post');
                    }}
                    onRefresh={refreshAll}
                  />
                </div>
              )}
              {clubTab === 'club-announcements' && (
                <ClubAnnouncements
                  announcements={announcements}
                  variant="full"
                  onRefresh={refreshAll}
                />
              )}
              {clubTab === 'club-dashboard' && (
                <div className="space-y-6">
                  <ClubAnnouncements
                    announcements={announcements}
                    variant="banner"
                    onRefresh={refreshAll}
                    onOpenFullView={() => setClubTab('club-announcements')}
                  />
                  <ClubDashboard
                    clubs={authorizedClubs}
                    activeClubId={activeClubId}
                    portalMode={portalMode}
                    onOpenClubWorkspace={handleOpenClubWorkspace}
                  />
                </div>
              )}
              {clubTab === 'upcoming-events' && (
                <UpcomingClubEvents
                  events={upcomingEvents}
                  clubs={authorizedClubs}
                  activeClubId={activeClubId}
                  portalMode={portalMode}
                  onRefresh={refreshAll}
                  onDraftPostForEvent={
                    clubData.effectiveRole !== 'VIEWER' && clubData.effectiveRole !== 'CONTRIBUTOR'
                      ? handleDraftPostFromEvent
                      : undefined
                  }
                  onAskQuestion={handleAskQuestionFromEvent}
                />
              )}
              {clubTab === 'event-calendar' && (
                <ClubEventCalendar
                  events={upcomingEvents}
                  clubs={authorizedClubs}
                  activeClubId={activeClubId}
                  onRefresh={refreshAll}
                  onDraftPostForEvent={
                    clubData.effectiveRole !== 'VIEWER' && clubData.effectiveRole !== 'CONTRIBUTOR'
                      ? handleDraftPostFromEvent
                      : undefined
                  }
                />
              )}
              {clubTab === 'event-analytics' && (
                <EventAnalyticsView
                  clubs={authorizedClubs}
                  activeClubId={activeClubId}
                  effectiveRole={clubData.effectiveRole}
                  onRefreshParent={refreshAll}
                />
              )}
              {clubTab === 'event-reminders' && (
                <EventRemindersView onRefreshParent={refreshAll} />
              )}
              {clubTab === 'club-forums' && (
                <ClubForums
                  clubs={authorizedClubs}
                  activeClubId={activeClubId}
                  effectiveRole={clubData.effectiveRole}
                  onRefreshParent={refreshAll}
                />
              )}
              {clubTab === 'ask-club' && (
                <AskTheClubView
                  clubId={clubData.club.clubId}
                  clubShortCode={clubData.club.shortCode}
                  initialEventId={askPrefill?.eventId}
                  initialEventTitle={askPrefill?.eventTitle}
                  initialTopic={askPrefill?.topic}
                />
              )}
              {clubTab === 'member-questions' && (
                <MemberQuestionsInbox
                  clubId={clubData.club.clubId}
                  clubShortCode={clubData.club.shortCode}
                  onRefreshParent={refreshAll}
                />
              )}
              {clubTab === 'project-tasks' && (
                <ClubProjectTasks
                  clubs={authorizedClubs}
                  activeClubId={activeClubId}
                  effectiveRole={clubData.effectiveRole}
                  onRefreshParent={refreshAll}
                />
              )}
              {clubTab === 'member-directory' && (
                <ClubMemberDirectory
                  activeClubId={activeClubId}
                  onRefreshParent={refreshAll}
                />
              )}
              {clubTab === 'campus-directory' && (
                <PublicCampusDirectory mode="portal" onRefreshParent={refreshAll} />
              )}
              {clubTab === 'club-resources' && (
                <ClubResourcesView clubs={authorizedClubs} activeClubId={activeClubId} />
              )}
              {clubTab === 'social-accounts' && (
                <ClubSocialAccounts
                  clubId={clubData.club.clubId}
                  effectiveRole={clubData.effectiveRole}
                  accounts={clubData.socialAccounts}
                  onRefresh={refreshAll}
                  onNavigateRequests={() => setClubTab('account-requests')}
                />
              )}
              {clubTab === 'whatsapp' && (
                <ClubWhatsAppPanel
                  club={clubData.club}
                  effectiveRole={clubData.effectiveRole}
                  groups={clubData.whatsappGroups ?? []}
                  messages={clubData.whatsappMessages ?? []}
                  events={clubData.events}
                  variant="full"
                  onNavigate={setClubTab}
                  onRefresh={refreshAll}
                />
              )}
              {clubTab === 'messaging-center' && (
                <ClubMessagingCenter
                  clubId={clubData.club.clubId}
                  clubName={clubData.club.name}
                  clubShortCode={clubData.club.shortCode}
                  variant="full"
                  defaultOpenComposer
                  onRefreshParent={refreshAll}
                />
              )}
              {clubTab === 'club-blog' && (
                <ClubBlogView
                  club={clubData.club}
                  effectiveRole={clubData.effectiveRole}
                  events={clubData.events}
                  onShareToSocialStudio={(blogPost) => {
                    setEditingPost(null);
                    setDraftHandoff({
                      title: blogPost.title,
                      caption: `${blogPost.title}\n\n${blogPost.excerpt}\n\nRead the full story on the ${blogPost.clubName} blog inside CUNY SPS Club Social Hub.`,
                      hashtags: [
                        '#CUNYSPS',
                        `#${blogPost.clubShortCode.replace(/[^A-Z0-9]/gi, '')}`,
                        ...blogPost.tags
                          .slice(0, 2)
                          .map((t) => `#${t.replace(/[^A-Z0-9]/gi, '')}`)
                          .filter((t) => t.length > 1),
                      ],
                      callToAction: 'Read Full Blog Post in Club Hub',
                      relatedEvent: blogPost.linkedEventTitle ?? '',
                      aiAssisted: false,
                    });
                    setClubTab('create-post');
                  }}
                  onRefreshParent={refreshAll}
                />
              )}
              {clubTab === 'create-post' && (
                <ContentStudio
                  club={clubData.club}
                  effectiveRole={clubData.effectiveRole}
                  accounts={clubData.socialAccounts}
                  posts={clubData.posts}
                  editingPost={editingPost}
                  onClearEditing={() => setEditingPost(null)}
                  onRefresh={refreshAll}
                />
              )}
              {clubTab === 'calendar' && (
                <ContentCalendar
                  posts={clubData.posts}
                  events={clubData.events}
                  accounts={clubData.socialAccounts}
                  onSelectPost={(post) => {
                    setEditingPost(post);
                    setClubTab('create-post');
                  }}
                />
              )}
              {clubTab === 'ai-assistant' && (
                <AiAssistantView
                  club={clubData.club}
                  effectiveRole={clubData.effectiveRole}
                  onSendDraftToStudio={() => setClubTab('create-post')}
                />
              )}
              {clubTab === 'inbox' && (
                <ClubInboxView
                  clubId={clubData.club.clubId}
                  effectiveRole={clubData.effectiveRole}
                  messages={clubData.inboxMessages}
                  members={clubData.members}
                  onRefresh={refreshAll}
                />
              )}
              {clubTab === 'analytics' && <ClubAnalyticsView metrics={clubData.analytics} />}
              {clubTab === 'team' && (
                <ClubTeamView
                  clubId={clubData.club.clubId}
                  effectiveRole={clubData.effectiveRole}
                  members={clubData.members}
                  invitations={clubData.invitations}
                  onRefresh={refreshAll}
                />
              )}
              {clubTab === 'account-requests' && (
                <ClubRequestsView
                  clubId={clubData.club.clubId}
                  effectiveRole={clubData.effectiveRole}
                  requests={clubData.accountRequests}
                  accounts={clubData.socialAccounts}
                  onRefresh={refreshAll}
                />
              )}
              {clubTab === 'settings' && (
                <ClubSettingsView
                  club={clubData.club}
                  effectiveRole={clubData.effectiveRole}
                  onRefresh={refreshAll}
                />
              )}
            </>
          ) : (
            <PublicCampusDirectory mode="portal" onRefreshParent={refreshAll} />
          )}

          <div className="mt-8">
            <CustomSectionsList
              sections={content.pages.portal.customSections}
              onChange={(nextSections) =>
                updateContent((d) => {
                  d.pages.portal.customSections = nextSections;
                })
              }
            />
          </div>
        </main>
        <SiteFooter compact />
      </div>
    </div>
  );
}
