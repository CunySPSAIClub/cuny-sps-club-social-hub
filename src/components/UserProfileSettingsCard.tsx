import React, { useRef, useState } from 'react';
import { Bell, Camera, Check, Lock, Save, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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

async function resizeProfilePhoto(file: File): Promise<string> {
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
          reject(new Error('Unable to process photo.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Please choose a PNG, JPEG, or WebP photo.'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Unable to read photo file.'));
    reader.readAsDataURL(file);
  });
}

export function UserProfileSettingsCard() {
  const { session, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const user = session?.user;
  const isAdmin = Boolean(session?.effectiveAdminRole);

  const [displayName, setDisplayName] = useState(
    user?.displayName || (user?.name ?? '').split(/\s+/)[0] || ''
  );
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [interests, setInterests] = useState<string[]>(user?.interests ?? []);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    user?.notificationsEnabled ?? user?.emailRemindersEnabled ?? true
  );
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  if (!user) return null;

  const lockedLastName =
    user.lastName ?? (user.name ?? '').split(/\s+/).slice(1).join(' ');

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const dataUrl = await resizeProfilePhoto(file);
      setAvatarUrl(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process profile photo.');
    }
  };

  const toggleInterest = (chip: string) => {
    setInterests((prev) =>
      prev.includes(chip) ? prev.filter((item) => item !== chip) : [...prev, chip]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await updateProfile({
        displayName: displayName.trim(),
        avatarUrl,
        interests: isAdmin ? undefined : interests,
        notificationsEnabled,
      });
      setNotice('Your profile preferences have been saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      className="bg-white border border-slate-200 rounded-lg p-6 space-y-5 max-w-4xl"
    >
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-[#004B87]" />
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              My Profile & Notification Preferences
            </h2>
            <p className="text-xs text-slate-500">
              Update your display name, profile photo, interests, and alert preferences anytime.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}
      {notice && (
        <div className="p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md">
          {notice}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-6 h-6 text-slate-400" />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 text-xs font-semibold text-[#004B87] bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded-md cursor-pointer"
          >
            {avatarUrl ? 'Change photo' : 'Upload photo'}
          </button>
          {avatarUrl && (
            <button
              type="button"
              onClick={() => setAvatarUrl('')}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 cursor-pointer"
            >
              Remove
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => void handlePhotoUpload(e)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Name people see
          </label>
          <input
            type="text"
            required
            maxLength={60}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-[#004B87]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Last name (locked)
          </label>
          <div className="flex items-center justify-between px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-md text-slate-600">
            <span className="truncate">{lockedLastName || '—'}</span>
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Program (locked)
          </label>
          <div className="flex items-center justify-between px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-md text-slate-600">
            <span className="truncate">
              {isAdmin ? 'CUNY SPS Student Life' : user.program || user.departmentOrMajor}
            </span>
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </div>
        </div>
      </div>

      {!isAdmin && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-700">Your campus interests</div>
          <div className="flex flex-wrap gap-1.5">
            {INTEREST_OPTIONS.map((chip) => {
              const active = interests.includes(chip);
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => toggleInterest(chip)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#004B87] text-white border-[#004B87]'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-[#004B87]'
                  }`}
                >
                  {active && <Check className="w-3 h-3" />}
                  <span>{chip}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <label className="flex items-center justify-between gap-4 p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 cursor-pointer">
        <div className="flex items-center gap-2.5">
          <Bell className="w-4 h-4 text-[#004B87] shrink-0" />
          <div>
            <div className="text-xs font-semibold text-slate-900">Hub & Event Notifications</div>
            <div className="text-[11px] text-slate-500">
              Receive reminders for upcoming club events, review requests, and announcements.
            </div>
          </div>
        </div>
        <input
          type="checkbox"
          checked={notificationsEnabled}
          onChange={(e) => setNotificationsEnabled(e.target.checked)}
          className="h-4 w-4 accent-[#004B87]"
        />
      </label>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#004B87] hover:bg-[#003865] disabled:opacity-50 rounded-md cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'Saving...' : 'Save Profile Preferences'}</span>
        </button>
      </div>
    </form>
  );
}
