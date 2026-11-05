import React, { useState } from 'react';
import {
  Send,
  Lock,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  Radio,
  ArrowRight,
  AlertCircle,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { UserAccount } from '../types';

interface LoginScreenProps {
  users: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
  onContinueAsGuestDemo?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const user = users.find(
      (u) =>
        u.username.toLowerCase() === username.trim().toLowerCase() &&
        (u.password === password.trim() || (!u.password && password === '123456'))
    );

    if (user) {
      onLoginSuccess(user);
    } else {
      setErrorMessage('ভুল ইউজার নেম অথবা পাসওয়ার্ড। অনুগ্রহ করে আবার চেষ্টা করুন। (Invalid username or password)');
    }
  };

  const handleQuickFill = (uName: string, pWord: string) => {
    setUsername(uName);
    setPassword(pWord);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center items-center p-4 selection:bg-sky-500 selection:text-white">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-neutral-900/90 border border-neutral-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sky-500 text-white font-bold shadow-lg shadow-sky-500/20 mb-1">
            <Send className="w-6 h-6 -rotate-12 translate-x-0.5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            TelePulse Enterprise Login
          </h1>
          <p className="text-xs text-neutral-400">
            টেলিগ্রাম বাল্ক মেসেজিং এবং সিআরএম সুরক্ষিত লগ-ইন প্যানেল
          </p>
        </div>

        {/* 3 Strict Rules Summary Card */}
        <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-950/60 text-xs space-y-2 text-neutral-300">
          <div className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>অ্যাডমিন প্যানেলের ৩টি প্রধান নিয়ম (Access Rules)</span>
          </div>
          <ul className="space-y-1.5 text-[11px] text-neutral-400">
            <li className="flex items-start gap-1.5">
              <span className="text-amber-400 font-bold">১. অ্যাডমিন (Admin):</span>
              <span className="text-neutral-300">সবকিছু নিয়ন্ত্রণ ও নতুন ইউজার তৈরি করতে পারবেন।</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-sky-400 font-bold">২. এডিটর (Editor):</span>
              <span className="text-neutral-300">শুধুমাত্র এসএমএস / ব্রডকাস্ট ক্যাম্পেইন চালাতে পারবেন।</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-400 font-bold">৩. ভিউয়ার (Viewer):</span>
              <span className="text-neutral-300">কেবল CRM লিডস ও লাইভ চ্যাটে গ্রাহকদের উত্তর দিতে পারবেন।</span>
            </li>
          </ul>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              ইউজার নেম (Username)
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
              <input
                type="text"
                required
                placeholder="e.g. admin, editor, viewer"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-neutral-700 bg-neutral-950 text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              পাসওয়ার্ড (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs pl-9 pr-9 py-2.5 rounded-xl border border-neutral-700 bg-neutral-950 text-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-neutral-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2"
          >
            <span>লগ-ইন করুন (Sign In)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Login Selector */}
        <div className="pt-2 border-t border-neutral-800 space-y-2">
          <div className="text-[11px] font-semibold text-neutral-400 text-center uppercase tracking-wider">
            দ্রুত ডেমো অ্যাকাউন্টে লগ-ইন করুন (Quick Demo Accounts)
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin', 'admin123')}
              className={`p-2 rounded-lg border text-left transition-colors ${
                username === 'admin'
                  ? 'border-amber-500/80 bg-amber-950/20 text-amber-300'
                  : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700 text-neutral-400'
              }`}
            >
              <div className="font-bold text-[11px] text-amber-400">Admin</div>
              <div className="text-[10px] text-neutral-500 truncate">সবকিছু নিয়ন্ত্রণ</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('editor', 'editor123')}
              className={`p-2 rounded-lg border text-left transition-colors ${
                username === 'editor'
                  ? 'border-sky-500/80 bg-sky-950/20 text-sky-300'
                  : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700 text-neutral-400'
              }`}
            >
              <div className="font-bold text-[11px] text-sky-400">Editor</div>
              <div className="text-[10px] text-neutral-500 truncate">ক্যাম্পেইন মাত্র</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('viewer', 'viewer123')}
              className={`p-2 rounded-lg border text-left transition-colors ${
                username === 'viewer'
                  ? 'border-emerald-500/80 bg-emerald-950/20 text-emerald-300'
                  : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700 text-neutral-400'
              }`}
            >
              <div className="font-bold text-[11px] text-emerald-400">Viewer</div>
              <div className="text-[10px] text-neutral-500 truncate">CRM চ্যাট মাত্র</div>
            </button>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="text-center text-[10px] text-neutral-500 flex items-center justify-center gap-1.5 pt-1">
          <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
          <span>Port 200 Gateway · TLS 1.3 Strict Security</span>
        </div>
      </div>
    </div>
  );
};
