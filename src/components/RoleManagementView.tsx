import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  XCircle,
  Key,
  Radio,
  Lock,
  UserPlus,
  Shuffle,
  ShieldAlert,
  Trash2,
  Eye,
  EyeOff,
  User,
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';

interface RoleManagementViewProps {
  allUsers: UserAccount[];
  currentUser: UserAccount;
  onSwitchUser: (userId: string) => void;
  onCreateUser: (newUser: Omit<UserAccount, 'id'>) => void;
  onDeleteUser: (userId: string) => void;
}

export const RoleManagementView: React.FC<RoleManagementViewProps> = ({
  allUsers,
  currentUser,
  onSwitchUser,
  onCreateUser,
  onDeleteUser,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [leadDistributionMode, setLeadDistributionMode] = useState<'round_robin' | 'territory' | 'manual'>('round_robin');

  // New user form state
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('editor');
  const [newEmail, setNewEmail] = useState('');
  const [newDepartment, setNewDepartment] = useState('Campaign Management');
  const [showPassword, setShowPassword] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  const toggleRevealPassword = (id: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newUsername.trim() || !newPassword.trim()) return;

    onCreateUser({
      name: newFullName.trim(),
      username: newUsername.trim().toLowerCase(),
      password: newPassword.trim(),
      email: newEmail.trim() || `${newUsername.trim().toLowerCase()}@telepulse.enterprise`,
      role: newRole,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      department: newDepartment,
      assignedPort: 200 + allUsers.length,
    });

    setIsCreateModalOpen(false);
    setNewFullName('');
    setNewUsername('');
    setNewPassword('');
    setNewEmail('');
  };

  const capabilities = [
    {
      name: 'অ্যাডমিন ফুল কন্ট্রোল (Full Admin Control & Settings)',
      admin: true,
      editor: false,
      viewer: false,
      ruleText: 'অ্যাডমিন সবকিছু নিয়ন্ত্রণ করতে পারবেন',
    },
    {
      name: 'এসএমএস ও ব্রডকাস্ট ক্যাম্পেইন (SMS Campaigns)',
      admin: true,
      editor: true,
      viewer: false,
      ruleText: 'এডিটর এসএমএস ক্যাম্পেইন পরিচালনা করতে পারবেন',
    },
    {
      name: 'ফোন নম্বর ফিল্টারিং ও চেকার (Phone Filter & Telegram Checker)',
      admin: true,
      editor: true,
      viewer: false,
      ruleText: 'এডিটর ফোন নম্বর যাচাই ও ফিল্টার করতে পারবেন',
    },
    {
      name: 'কন্টাক্ট তালিকা ও ডিরেক্টরি (Contact Lists & Management)',
      admin: true,
      editor: true,
      viewer: false,
      ruleText: 'এডিটর কন্টাক্ট তালিকা হ্যান্ডেল করতে পারবেন',
    },
    {
      name: 'সিআরএম লিডস ও সরাসরি লাইভ চ্যাটে উত্তর (CRM Leads & Customer Replies)',
      admin: true,
      editor: true,
      viewer: true,
      ruleText: 'ভিউয়ার CRM লিডস দেখতে ও চ্যাটে গ্রাহকদের উত্তর দিতে পারবেন',
    },
    {
      name: 'নতুন ইউজার তৈরি ও পাসওয়ার্ড সেট করা (Create Users & Set Passwords)',
      admin: true,
      editor: false,
      viewer: false,
      ruleText: 'শুধুমাত্র অ্যাডমিনই নতুন ইউজার তৈরি করতে পারবেন',
    },
    {
      name: 'ওয়ার্ডপ্রেস ও কাস্টম ওয়েবহুক ইন্টিগ্রেশন (WordPress & Custom Webhooks)',
      admin: true,
      editor: false,
      viewer: false,
      ruleText: 'অ্যাডমিন অনলি',
    },
    {
      name: 'ক্লাউড মিডিয়া স্টোরেজ ও নিরাপত্তা অডিট (Cloud Storage & Security Logs)',
      admin: true,
      editor: false,
      viewer: false,
      ruleText: 'অ্যাডমিন অনলি',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              টিম ও আরব্যাক ইউজার ম্যানেজমেন্ট (Team &amp; RBAC Control)
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              ৩টি নির্দিষ্ট নিয়ম সক্রিয়
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            অ্যাডমিন সবকিছু নিয়ন্ত্রণ ও নতুন ইউজার তৈরি করবেন; এডিটর শুধু এসএমএস ক্যাম্পেইন চালাবেন; এবং ভিউয়ার কেবল CRM লিডস ও লাইভ চ্যাটে গ্রাহকদের উত্তর দেবেন।
          </p>
        </div>

        {/* Admin only: Create User button */}
        {currentUser.role === 'admin' && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>নতুন ইউজার তৈরি করুন (Create User)</span>
          </button>
        )}
      </div>

      {/* 3 Strict Rules Banner */}
      <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-900/50 bg-sky-50/50 dark:bg-sky-950/20 space-y-2">
        <div className="text-xs font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-sky-500" />
          <span>অ্যাডমিন প্যানেলের ৩টি সুনির্দিষ্ট নিয়মাবলি (Enforced RBAC Rules)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs">
            <div className="font-bold text-amber-600 dark:text-amber-400 mb-1">১. অ্যাডমিন (Admin)</div>
            <div className="text-neutral-600 dark:text-neutral-300 text-[11px] leading-relaxed">
              সবকিছু নিয়ন্ত্রণ করতে পারবেন এবং ইউজার নেম ও পাসওয়ার্ড দিয়ে নতুন ইউজার তৈরি করতে পারবেন।
            </div>
          </div>
          <div className="p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs">
            <div className="font-bold text-sky-600 dark:text-sky-400 mb-1">২. এডিটর (Editor)</div>
            <div className="text-neutral-600 dark:text-neutral-300 text-[11px] leading-relaxed">
              শুধুমাত্র এসএমএস ও ব্রডকাস্ট ক্যাম্পেইন চালাতে পারবেন (SMS Campaign Module only)।
            </div>
          </div>
          <div className="p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs">
            <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">৩. ভিউয়ার (Viewer)</div>
            <div className="text-neutral-600 dark:text-neutral-300 text-[11px] leading-relaxed">
              কেবলমাত্র সিআরএম লিডস ও লাইভ চ্যাট অপশনের মাধ্যমে গ্রাহকদের উত্তর দিতে পারবেন।
            </div>
          </div>
        </div>
      </div>

      {/* Team Members List */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            নিবন্ধিত ইউজার তালিকা ({allUsers.length} Users)
          </h2>
          <span className="text-[11px] text-neutral-400 font-mono">ইউজার নেম ও পাসওয়ার্ড দ্বারা সুরক্ষিত</span>
        </div>

        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {allUsers.map((user) => (
            <div
              key={user.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover ring-1 ring-neutral-300 dark:ring-neutral-700"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">
                      {user.name}
                    </span>
                    <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-1.5 py-0.2 rounded font-semibold">
                      @{user.username}
                    </span>
                    {user.id === currentUser.id && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-semibold">
                        বর্তমান সেশন (Current)
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    {user.email} · {user.department}
                  </div>
                  {/* Admin view of credentials */}
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-neutral-500">
                    <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                      User: <strong className="text-neutral-700 dark:text-neutral-300">@{user.username}</strong>
                    </span>
                    <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                      Pass:{' '}
                      <strong className="text-neutral-700 dark:text-neutral-300">
                        {revealedPasswords[user.id] ? user.password || 'admin123' : '••••••••'}
                      </strong>
                      <button
                        type="button"
                        onClick={() => toggleRevealPassword(user.id)}
                        className="text-neutral-400 hover:text-neutral-200 ml-0.5"
                        title={revealedPasswords[user.id] ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                      >
                        {revealedPasswords[user.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right text-xs">
                  <span
                    className={`inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                      user.role === 'admin'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                        : user.role === 'editor'
                        ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-400'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {user.role === 'admin' ? 'অ্যাডমিন (Admin)' : user.role === 'editor' ? 'এডিটর (Editor)' : 'ভিউয়ার (Viewer)'}
                  </span>
                  <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                    Port {user.assignedPort} Gateway
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSwitchUser(user.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      user.id === currentUser.id
                        ? 'border-sky-500 text-sky-600 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/20'
                        : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {user.id === currentUser.id ? 'লগ-ইনকৃত' : 'সুইচ করুন'}
                  </button>

                  {currentUser.role === 'admin' && user.id !== currentUser.id && (
                    <button
                      onClick={() => onDeleteUser(user.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                      title="ইউজার মুছুন (Delete User)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strict Permission Rules Matrix */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            ভূমিকা অনুযায়ী অ্যাক্সেস ম্যাট্রিক্স (Role Capabilities Matrix)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 text-neutral-400">
              <tr>
                <th className="py-2.5 px-4">অনুমতি ও নিয়ম (Rule / Permission)</th>
                <th className="py-2.5 px-4 text-center font-bold text-amber-600 dark:text-amber-400">
                  অ্যাডমিন (Admin)
                </th>
                <th className="py-2.5 px-4 text-center font-bold text-sky-600 dark:text-sky-400">
                  এডিটর (Editor)
                </th>
                <th className="py-2.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                  ভিউয়ার (Viewer)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-normal">
              {capabilities.map((cap, i) => (
                <tr key={i} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                  <td className="py-3 px-4 text-neutral-800 dark:text-neutral-200">
                    <div className="font-semibold">{cap.name}</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">{cap.ruleText}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {cap.admin ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-neutral-300 dark:text-neutral-700 mx-auto" />
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {cap.editor ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-neutral-300 dark:text-neutral-700 mx-auto" />
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {cap.viewer ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-neutral-300 dark:text-neutral-700 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW USER MODAL (ADMIN ONLY) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-sky-500" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  নতুন ইউজার তৈরি করুন (Create New User)
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              অ্যাডমিন হিসেবে ইউজারের নাম, ইউজার নেম ও পাসওয়ার্ড সেট করে অ্যাকাউন্ট তৈরি করুন।
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  পুরো নাম (Full Name)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tanvir Ahmed"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    ইউজার নেম (Username)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. tanvir_editor"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    পাসওয়ার্ড (Password)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-2 text-neutral-400 hover:text-neutral-200"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  ইউজারের ভূমিকা (Role Assignment)
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-semibold"
                >
                  <option value="editor">এডিটর (Editor) — এসএমএস ক্যাম্পেইন, ফিল্টার নম্বর ও কন্টাক্ট তালিকা পরিচালনা</option>
                  <option value="viewer">ভিউয়ার (Viewer) — কেবল CRM লিডস ও লাইভ চ্যাটে উত্তর দিতে পারবেন</option>
                  <option value="admin">অ্যাডমিন (Admin) — সম্পূর্ণ নিয়ন্ত্রণ ও ইউজার তৈরির ক্ষমতা</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  ইমেইল ও বিভাগ (Email &amp; Department)
                </label>
                <input
                  type="email"
                  placeholder="e.g. tanvir@telepulse.enterprise"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                >
                  বাতিল (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg shadow-sm"
                >
                  ইউজার সংরক্ষণ করুন (Save User)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
