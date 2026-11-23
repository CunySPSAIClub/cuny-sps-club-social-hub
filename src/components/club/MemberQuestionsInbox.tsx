import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  HelpCircle,
  Inbox,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { MemberQuestion, QuestionStatus, QuestionTopic } from '../../types';

interface MemberQuestionsInboxProps {
  clubId: string;
  clubShortCode?: string;
  onRefreshParent?: () => Promise<void>;
}

export function MemberQuestionsInbox({
  clubId,
  clubShortCode,
  onRefreshParent,
}: MemberQuestionsInboxProps) {
  const { apiFetch, session } = useAuth();
  const [questions, setQuestions] = useState<MemberQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Selected question in detail view
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'All' | QuestionStatus>('All');
  const [topicFilter, setTopicFilter] = useState<'All' | QuestionTopic>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Reply state
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch<{ questions: MemberQuestion[] }>(`/api/clubs/${clubId}/questions`);
      setQuestions(res.questions ?? []);
      // If we don't have a selection yet and there are questions, select the first waiting question or first question
      if (res.questions && res.questions.length > 0) {
        setSelectedQuestionId((curr) => {
          if (curr && res.questions.some((q) => q.questionId === curr)) return curr;
          const waiting = res.questions.find((q) => q.status === 'Waiting for reply');
          return waiting ? waiting.questionId : res.questions[0].questionId;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load member questions.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, clubId]);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  const handleSendReply = async (e: React.FormEvent, questionId: string) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setSendingReply(true);
    setError('');
    setNotice('');

    try {
      const res = await apiFetch<{ question: MemberQuestion }>(
        `/api/clubs/${clubId}/questions/${questionId}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({
            body: replyBody.trim(),
          }),
        }
      );

      setReplyBody('');
      setNotice(`Reply sent to ${res.question.authorName}. Member has been notified.`);
      await loadQuestions();
      if (onRefreshParent) await onRefreshParent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reply.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleStatusChange = async (questionId: string, nextStatus: QuestionStatus) => {
    setUpdatingStatus(true);
    setError('');
    setNotice('');

    try {
      await apiFetch<{ question: MemberQuestion }>(
        `/api/clubs/${clubId}/questions/${questionId}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      setNotice(`Question status updated to "${nextStatus}".`);
      await loadQuestions();
      if (onRefreshParent) await onRefreshParent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Filtered questions
  const filteredQuestions = questions.filter((q) => {
    if (statusFilter !== 'All' && q.status !== statusFilter) return false;
    if (topicFilter !== 'All' && q.topic !== topicFilter) return false;
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      const matchSubject = q.subject.toLowerCase().includes(term);
      const matchAuthor = q.authorName.toLowerCase().includes(term);
      const matchEmail = q.authorEmail.toLowerCase().includes(term);
      const matchEvent = (q.linkedEventTitle ?? '').toLowerCase().includes(term);
      const matchMessage = q.messages.some((m) => m.body.toLowerCase().includes(term));
      return matchSubject || matchAuthor || matchEmail || matchEvent || matchMessage;
    }
    return true;
  });

  const selectedQuestion = questions.find((q) => q.questionId === selectedQuestionId);
  const waitingCount = questions.filter((q) => q.status === 'Waiting for reply').length;
  const answeredCount = questions.filter((q) => q.status === 'Answered').length;
  const resolvedCount = questions.filter((q) => q.status === 'Resolved').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#004B87]/10 text-[#004B87] rounded-md">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h1 className="text-lg font-bold text-slate-900">Member Questions Inbox</h1>
              {waitingCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  {waitingCount} awaiting reply
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 max-w-2xl">
              Private inquiries submitted by club contributors and student members. All responses are sent privately to the inquiring member.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadQuestions()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md whitespace-nowrap cursor-pointer self-start sm:self-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Inbox</span>
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStatusFilter('All')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                statusFilter === 'All'
                  ? 'bg-[#004B87] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All ({questions.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Waiting for reply')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'Waiting for reply'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Waiting ({waitingCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Answered')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'Answered'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Answered ({answeredCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Resolved')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                statusFilter === 'Resolved'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Resolved ({resolvedCount})
            </button>
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member, subject, or message..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
              />
            </div>
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value as 'All' | QuestionTopic)}
              aria-label="Filter by topic"
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-700"
            >
              <option value="All">All Topics</option>
              <option value="General">General</option>
              <option value="Events">Events</option>
              <option value="Joining/Membership">Joining/Membership</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Two-Pane Inbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Question Threads List */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-700 flex items-center justify-between">
            <span>Conversations ({filteredQuestions.length})</span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[11px] text-[#004B87] hover:underline cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-200 max-h-[650px] overflow-y-auto">
            {filteredQuestions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">No member questions found</p>
                <p>No questions match your current status or search filter.</p>
              </div>
            ) : (
              filteredQuestions.map((q) => {
                const isSelected = q.questionId === selectedQuestionId;
                const isWaiting = q.status === 'Waiting for reply';
                const isAnswered = q.status === 'Answered';
                const isResolved = q.status === 'Resolved';
                const lastMsg = q.messages[q.messages.length - 1];

                return (
                  <div
                    key={q.questionId}
                    onClick={() => setSelectedQuestionId(q.questionId)}
                    className={`p-4 transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-sky-50/80 border-l-4 border-l-[#004B87]'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {q.authorName}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {q.authorRoleLabel}
                        </span>
                      </div>

                      {isWaiting && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <Clock className="w-2.5 h-2.5" />
                          <span>Waiting</span>
                        </span>
                      )}
                      {isAnswered && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Answered</span>
                        </span>
                      )}
                      {isResolved && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                          Resolved
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-semibold text-slate-800 line-clamp-1 mb-1">
                      {q.subject}
                    </div>

                    <div className="text-[11px] text-slate-600 line-clamp-2">
                      {lastMsg ? `${lastMsg.senderName}: ${lastMsg.body}` : 'No messages'}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-slate-100">
                      <span className="uppercase tracking-wider font-semibold text-slate-500">
                        {q.topic}
                      </span>
                      <span className="font-mono-tabular">
                        {new Date(q.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Conversation Details & Reply Composer */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg flex flex-col min-h-[600px]">
          {selectedQuestion ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      {selectedQuestion.topic}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs font-medium text-slate-700">
                      Asked by <strong className="text-slate-900">{selectedQuestion.authorName}</strong> ({selectedQuestion.authorEmail})
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900">{selectedQuestion.subject}</h2>
                  {selectedQuestion.linkedEventTitle && (
                    <div className="text-xs text-[#004B87] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Referenced Event: {selectedQuestion.linkedEventTitle}</span>
                    </div>
                  )}
                </div>

                {/* Status Toggle / Mark Resolved */}
                <div className="flex items-center gap-2 self-start sm:self-center">
                  {selectedQuestion.status !== 'Resolved' ? (
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => void handleStatusChange(selectedQuestion.questionId, 'Resolved')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Mark Resolved</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => void handleStatusChange(selectedQuestion.questionId, 'Answered')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                    >
                      <span>Reopen Question</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Message Thread */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[420px]">
                {selectedQuestion.messages.map((msg) => {
                  const isLeaderMsg = msg.senderUserId === session?.user.userId ||
                    msg.senderRoleLabel.includes('Lead') ||
                    msg.senderRoleLabel.includes('Editor') ||
                    msg.senderRoleLabel.includes('Admin');

                  return (
                    <div
                      key={msg.messageId}
                      className={`flex flex-col ${isLeaderMsg ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                        <span className="font-semibold text-slate-900">{msg.senderName}</span>
                        <span>·</span>
                        <span className="text-[#004B87] font-medium">{msg.senderRoleLabel}</span>
                        <span>·</span>
                        <span className="font-mono-tabular">
                          {new Date(msg.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div
                        className={`max-w-[85%] rounded-lg p-3.5 text-xs leading-relaxed whitespace-pre-wrap ${
                          isLeaderMsg
                            ? 'bg-[#004B87] text-white rounded-tr-none'
                            : 'bg-slate-100 text-slate-900 border border-slate-200 rounded-tl-none'
                        }`}
                      >
                        {msg.body}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Composer */}
              <div className="p-4 border-t border-slate-200 bg-white rounded-b-lg space-y-2">
                <form
                  onSubmit={(e) => void handleSendReply(e, selectedQuestion.questionId)}
                  className="space-y-3"
                >
                  <label htmlFor="leader-reply-input" className="block text-xs font-semibold text-slate-800">
                    Reply to {selectedQuestion.authorName} as Club Leadership
                  </label>
                  <textarea
                    id="leader-reply-input"
                    required
                    rows={3}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder={`Write your reply to ${selectedQuestion.authorName}...`}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500">
                      Submitting a reply marks the conversation as <strong>Answered</strong> and triggers a notification.
                    </span>
                    <button
                      type="submit"
                      disabled={sendingReply || !replyBody.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#004B87] hover:bg-[#003865] disabled:opacity-50 rounded-md transition-colors cursor-pointer shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{sendingReply ? 'Sending Reply...' : 'Send Reply to Member'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
              <HelpCircle className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No question selected</p>
              <p className="text-xs text-slate-500">Select a member conversation from the list to view the thread and reply.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
