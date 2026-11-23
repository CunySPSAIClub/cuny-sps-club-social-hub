import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  HelpCircle,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { MemberQuestion, QuestionTopic } from '../../types';

interface AskTheClubViewProps {
  clubId: string;
  clubShortCode?: string;
  initialEventId?: string;
  initialEventTitle?: string;
  initialTopic?: QuestionTopic;
}

const TOPICS: { value: QuestionTopic; label: string; desc: string }[] = [
  { value: 'General', label: 'General', desc: 'Questions about club mission, schedule, or general inquiries' },
  { value: 'Events', label: 'Events & Meetings', desc: 'RSVP help, meeting links, attendance, or logistics' },
  { value: 'Joining/Membership', label: 'Joining & Membership', desc: 'Roles, participation, or becoming more active' },
  { value: 'Other', label: 'Other', desc: 'Feedback, suggestions, or miscellaneous notes' },
];

export function AskTheClubView({
  clubId,
  clubShortCode,
  initialEventId,
  initialEventTitle,
  initialTopic,
}: AskTheClubViewProps) {
  const { apiFetch, session } = useAuth();
  const [questions, setQuestions] = useState<MemberQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Selected question for thread viewer
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  // New question form state
  const [showNewForm, setShowNewForm] = useState(Boolean(initialEventTitle || initialTopic));
  const [topic, setTopic] = useState<QuestionTopic>(initialTopic || (initialEventTitle ? 'Events' : 'General'));
  const [subject, setSubject] = useState(
    initialEventTitle ? `Question regarding: ${initialEventTitle}` : ''
  );
  const [linkedEventId] = useState<string | undefined>(initialEventId);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Follow-up message state
  const [followUpBody, setFollowUpBody] = useState('');
  const [sendingFollowUp, setSendingFollowUp] = useState(false);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch<{ questions: MemberQuestion[] }>(`/api/clubs/${clubId}/questions`);
      setQuestions(res.questions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your questions.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, clubId]);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await apiFetch<{ question: MemberQuestion }>(`/api/clubs/${clubId}/questions`, {
        method: 'POST',
        body: JSON.stringify({
          topic,
          subject: subject.trim(),
          message: message.trim(),
          linkedEventId,
        }),
      });

      setSuccessMessage('Your question has been sent privately to club leadership. You will be notified when they reply.');
      setMessage('');
      if (!initialEventTitle) {
        setSubject('');
      }
      setShowNewForm(false);
      await loadQuestions();
      if (res.question) {
        setSelectedQuestionId(res.question.questionId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit your question.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendFollowUp = async (e: React.FormEvent, questionId: string) => {
    e.preventDefault();
    if (!followUpBody.trim()) return;
    setSendingFollowUp(true);
    setError('');

    try {
      await apiFetch<{ question: MemberQuestion }>(
        `/api/clubs/${clubId}/questions/${questionId}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({
            body: followUpBody.trim(),
          }),
        }
      );

      setFollowUpBody('');
      await loadQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send follow-up message.');
    } finally {
      setSendingFollowUp(false);
    }
  };

  const selectedQuestion = questions.find((q) => q.questionId === selectedQuestionId);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-sky-50 text-[#004B87] rounded-md">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h1 className="text-lg font-bold text-slate-900">Ask the Club</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Private Q&amp;A
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl">
              Have a question about events, projects, or getting involved? Send a private message directly to {clubShortCode ?? 'club'} leaders. Your questions are private between you and the club officers.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowNewForm((prev) => !prev);
              setSelectedQuestionId(null);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#004B87] hover:bg-[#003865] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
          >
            {showNewForm ? (
              <>
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>View My Questions</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Ask a Question</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* New Question Form */}
      {showNewForm ? (
        <form onSubmit={handleCreateQuestion} className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-sm font-semibold text-slate-900">New Message to Club Leaders</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose a category and describe what you need assistance with.
            </p>
          </div>

          {initialEventTitle && (
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-md text-xs text-sky-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#004B87] shrink-0" />
              <span>
                Prefilled for event: <strong>{initialEventTitle}</strong>
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="question-topic" className="block text-xs font-medium text-slate-700 mb-1">
                Topic Category
              </label>
              <select
                id="question-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value as QuestionTopic)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
              >
                {TOPICS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label} — {t.desc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="question-subject" className="block text-xs font-medium text-slate-700 mb-1">
                Subject
              </label>
              <input
                id="question-subject"
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Workshop setup instructions or zoom link"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="question-message" className="block text-xs font-medium text-slate-700 mb-1">
              Your Message
            </label>
            <textarea
              id="question-message"
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your question or request for club leaders here..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Messages are sent directly to active Club Leads &amp; Social Media Editors.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#004B87] hover:bg-[#003865] disabled:opacity-60 rounded-md cursor-pointer shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Sending Question...' : 'Send Question'}</span>
              </button>
            </div>
          </div>
        </form>
      ) : null}

      {/* Main Content: Thread Viewer or List */}
      {!showNewForm && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Questions Sidebar / List */}
          <div className={selectedQuestion ? 'lg:col-span-5 space-y-3' : 'lg:col-span-12 space-y-3'}>
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Your Conversation History ({questions.length})
              </h2>
              <span className="text-[11px] text-slate-500 font-mono-tabular">
                {questions.filter((q) => q.status === 'Waiting for reply').length} waiting · {questions.filter((q) => q.status === 'Answered').length} answered
              </span>
            </div>

            {loading ? (
              <div className="p-8 bg-white border border-slate-200 rounded-lg text-center text-xs text-slate-500">
                Loading your club conversations...
              </div>
            ) : questions.length === 0 ? (
              <div className="p-8 bg-white border border-slate-200 rounded-lg text-center space-y-3">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No questions asked yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Have a question about club meetings, projects, or joining? Click &quot;Ask a Question&quot; above to message the leaders.
                </p>
                <button
                  type="button"
                  onClick={() => setShowNewForm(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#004B87] hover:bg-[#003865] rounded-md cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ask your first question</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {questions.map((q) => {
                  const isSelected = q.questionId === selectedQuestionId;
                  const isWaiting = q.status === 'Waiting for reply';
                  const isAnswered = q.status === 'Answered';
                  const isResolved = q.status === 'Resolved';

                  return (
                    <div
                      key={q.questionId}
                      onClick={() => setSelectedQuestionId(q.questionId)}
                      className={`p-4 rounded-lg border transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'bg-sky-50/70 border-[#004B87] ring-1 ring-[#004B87]/30'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          {q.topic}
                        </span>
                        {isWaiting && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Waiting for reply</span>
                          </span>
                        )}
                        {isAnswered && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Answered</span>
                          </span>
                        )}
                        {isResolved && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            <span>Resolved</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">{q.subject}</h3>

                      {q.linkedEventTitle && (
                        <div className="text-[11px] text-[#004B87] flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span className="truncate">{q.linkedEventTitle}</span>
                        </div>
                      )}

                      <p className="text-xs text-slate-600 line-clamp-2 mt-1.5">
                        {q.messages[q.messages.length - 1]?.body ?? 'No message body'}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                        <span>{q.messages.length} message{q.messages.length === 1 ? '' : 's'}</span>
                        <span className="font-mono-tabular">{new Date(q.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Conversation Detail View */}
          {selectedQuestion ? (
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg flex flex-col h-full min-h-[500px]">
              {/* Thread Header */}
              <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      {selectedQuestion.topic}
                    </span>
                    {selectedQuestion.status === 'Waiting for reply' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Waiting for reply</span>
                      </span>
                    ) : selectedQuestion.status === 'Answered' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Answered</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                        Resolved
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-slate-900">{selectedQuestion.subject}</h2>
                  {selectedQuestion.linkedEventTitle && (
                    <div className="text-xs text-[#004B87] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Linked Event: {selectedQuestion.linkedEventTitle}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedQuestionId(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
              </div>

              {/* Message List */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {selectedQuestion.messages.map((msg) => {
                  const isMine = msg.senderUserId === session?.user.userId;

                  return (
                    <div
                      key={msg.messageId}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                        <span className="font-semibold text-slate-800">{msg.senderName}</span>
                        <span>·</span>
                        <span className="text-[#004B87]">{msg.senderRoleLabel}</span>
                        <span>·</span>
                        <span className="font-mono-tabular">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div
                        className={`max-w-[85%] rounded-lg p-3.5 text-xs leading-relaxed whitespace-pre-wrap ${
                          isMine
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

              {/* Follow-up Composer */}
              <div className="p-4 border-t border-slate-200 bg-white rounded-b-lg">
                <form
                  onSubmit={(e) => void handleSendFollowUp(e, selectedQuestion.questionId)}
                  className="space-y-2"
                >
                  <label htmlFor="followup-input" className="block text-xs font-medium text-slate-700">
                    Send Follow-up Message
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="followup-input"
                      type="text"
                      required
                      value={followUpBody}
                      onChange={(e) => setFollowUpBody(e.target.value)}
                      placeholder="Type a follow-up response to club leaders..."
                      className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
                    />
                    <button
                      type="submit"
                      disabled={sendingFollowUp || !followUpBody.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#004B87] hover:bg-[#003865] disabled:opacity-50 rounded-md transition-colors cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{sendingFollowUp ? 'Sending...' : 'Reply'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
