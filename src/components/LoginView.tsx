import React, { useState } from 'react';
import {
  Send,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Globe2,
  CheckCircle2,
  KeyRound,
  Radio,
} from 'lucide-react';
import { UserAccount } from '../types';
import { SupportedLanguage } from '../translations';

interface LoginViewProps {
  allUsers: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
  onViewWebsite: () => void;
  lang?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  allUsers,
  onLoginSuccess,
  onViewWebsite,
  lang = 'en',
  onLanguageChange,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);

  const languageOptions: { code: SupportedLanguage; label: string; flag: string }[] = [
    { code: 'bn', label: 'বাংলা (Bengali)', flag: '🇧🇩' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'zh', label: '中文 (Chinese)', flag: '🇨🇳' },
  ];

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    setTimeout(() => {
      const cleanUser = username.trim().toLowerCase();
      const cleanPass = password.trim();

      const matchedUser = allUsers.find(
        (u) =>
          u.username.toLowerCase() === cleanUser &&
          (u.password ? u.password === cleanPass : cleanPass === 'admin123' || cleanPass === 'editor123' || cleanPass === 'viewer123')
      );

      if (matchedUser) {
        setLoading(false);
        onLoginSuccess(matchedUser);
      } else {
        setLoading(false);
        setErrorMessage(
          lang === 'bn'
            ? 'ভুল ইউজারনেম অথবা পাসওয়ার্ড! অনুগ্রহ করে সঠিক তথ্য প্রদান করুন।'
            : lang === 'zh'
            ? '用户名或密码错误！请输入正确的账号密码。'
            : 'Invalid username or password! Please check your credentials.'
        );
      }
    }, 350);
  };

  const handleQuickDemoSelect = (demoUser: UserAccount) => {
    setUsername(demoUser.username);
    setPassword(demoUser.password || 'admin123');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between selection:bg-sky-500 selection:text-white">
      {/* Top Navbar */}
      <header className="px-6 py-4 border-b border-neutral-900 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500 text-white font-bold shadow-md shadow-sky-500/20">
            <Send className="w-4 h-4 -rotate-12 translate-x-0.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white">TelePulse</span>
              <span className="text-[10px] uppercase font-semibold text-sky-400 bg-sky-950/80 px-1.5 py-0.2 rounded border border-sky-800/60">
                Enterprise
              </span>
            </div>
            <div className="text-[10px] text-neutral-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Port 200 Secure Tunnel · TLS 1.3</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-neutral-300 hover:text-white border border-neutral-800 bg-neutral-900 rounded-lg transition-colors"
            >
              <Globe2 className="w-3.5 h-3.5 text-sky-400" />
              <span>{languageOptions.find((l) => l.code === lang)?.label.split(' ')[0] || 'English'}</span>
            </button>
            {isLangOpen && (
              <div className="absolute right-0 mt-1.5 w-44 rounded-xl border border-neutral-800 bg-neutral-900 shadow-xl py-1 z-50">
                {languageOptions.map((opt) => (
                  <button
                    key={opt.code}
                    onClick={() => {
                      if (onLanguageChange) onLanguageChange(opt.code);
                      setIsLangOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-neutral-800 ${
                      lang === opt.code ? 'text-sky-400 font-semibold' : 'text-neutral-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{opt.flag}</span>
                      <span>{opt.label}</span>
                    </span>
                    {lang === opt.code && <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onViewWebsite}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700 rounded-lg transition-colors"
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>
              {lang === 'bn' ? 'পাবলিক ওয়েবসাইট' : lang === 'zh' ? '官方展示网站' : 'Public Website'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl space-y-6">
          {/* Rules Banner (Updated for Editor: SMS, Filter numbers, Contact lists) */}
          <div className="rounded-xl p-4 border border-sky-900/60 bg-sky-950/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>
                {lang === 'bn'
                  ? 'অ্যাডমিন প্যানেলের সুনির্দিষ্ট ৩টি নিয়মাবলি (RBAC Rules)'
                  : lang === 'zh'
                  ? '管理后台严格执行的 3 项权限规则 (RBAC Rules)'
                  : 'Enforced 3 Access Rules for Platform (RBAC Rules)'}
              </span>
            </div>
            <ul className="text-xs text-neutral-300 space-y-1.5 pl-1 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0"></span>
                <span>
                  <strong className="text-amber-400">
                    {lang === 'bn' ? '১. অ্যাডমিন (Admin): ' : lang === 'zh' ? '1. 系统管理员 (Admin): ' : '1. Administrator (Admin): '}
                  </strong>
                  {lang === 'bn'
                    ? 'সবকিছু নিয়ন্ত্রণ করতে পারবেন এবং শুধুমাত্র অ্যাডমিনই নতুন ইউজার তৈরি করতে পারবেন।'
                    : lang === 'zh'
                    ? '掌控系统所有模块与设置，唯一有权创建新账号并设置密码。'
                    : 'Full access to all modules, settings, and exclusively authorized to create new accounts.'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 flex-shrink-0"></span>
                <span>
                  <strong className="text-sky-400">
                    {lang === 'bn' ? '২. এডিটর (Editor): ' : lang === 'zh' ? '2. 编辑运营员 (Editor): ' : '2. Editor (SMS & Contacts): '}
                  </strong>
                  {lang === 'bn'
                    ? 'এসএমএস ক্যাম্পেইন পরিচালনা, ফোন নম্বর ফিল্টারিং ও কন্টাক্ট তালিকা হ্যান্ডেল করতে পারবেন।'
                    : lang === 'zh'
                    ? '管理短信群发活动、过滤与筛查号码，以及管理联系人列表。'
                    : 'Can manage SMS campaigns, filter numbers, and handle contact lists.'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></span>
                <span>
                  <strong className="text-emerald-400">
                    {lang === 'bn' ? '৩. ভিউয়ার (Viewer): ' : lang === 'zh' ? '3. 观察员 (Viewer): ' : '3. Viewer (CRM & Chat): '}
                  </strong>
                  {lang === 'bn'
                    ? 'কেবলমাত্র সিআরএম (CRM) লিডস দেখতে এবং লাইভ চ্যাট অপশনের মাধ্যমে গ্রাহকদের উত্তর দিতে পারবেন।'
                    : lang === 'zh'
                    ? '仅可访问 CRM 销售线索并使用实时在线聊天与客服翻译回复客户。'
                    : 'Access CRM leads and directly reply to customer messages via Live Chat.'}
                </span>
              </li>
            </ul>
          </div>

          {/* Login Form Container */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-md">
            <div className="mb-6">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-sky-400" />
                <span>
                  {lang === 'bn'
                    ? 'অ্যাকাউন্টে লগ-ইন করুন'
                    : lang === 'zh'
                    ? '登录您的账号'
                    : 'Sign in to Account'}
                </span>
              </h1>
              <p className="mt-1 text-xs text-neutral-400">
                {lang === 'bn'
                  ? 'ইউজার নেম ও পাসওয়ার্ড দিয়ে সিস্টেমে প্রবেশ করুন।'
                  : lang === 'zh'
                  ? '请输入您的用户名与密码进入管理控制台。'
                  : 'Enter your assigned username and password to proceed.'}
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  {lang === 'bn' ? 'ইউজার নেম (Username)' : lang === 'zh' ? '用户名 (Username)' : 'Username'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. admin, editor, viewer"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full text-xs font-mono pl-9 pr-3 py-2.5 rounded-lg border border-neutral-800 bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  {lang === 'bn' ? 'পাসওয়ার্ড (Password)' : lang === 'zh' ? '密码 (Password)' : 'Password'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs font-mono pl-9 pr-10 py-2.5 rounded-lg border border-neutral-800 bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-lg shadow-sky-600/25 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span>
                    {lang === 'bn' ? 'যাচাই করা হচ্ছে...' : lang === 'zh' ? '正在验证身份...' : 'Authenticating...'}
                  </span>
                ) : (
                  <>
                    <span>
                      {lang === 'bn' ? 'লগ-ইন করুন' : lang === 'zh' ? '登录控制台' : 'Log In'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Box */}
            <div className="mt-6 pt-5 border-t border-neutral-800">
              <div className="text-[11px] font-semibold text-neutral-400 mb-2 flex items-center justify-between">
                <span>
                  {lang === 'bn' ? 'দ্রুত পরীক্ষামূলক লগ-ইন (1-Click Demo Accounts):' : lang === 'zh' ? '快速测试账号 (一键填入):' : 'Quick Demo Test Accounts (1-Click):'}
                </span>
                <span className="text-[10px] text-sky-400">Click to fill</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {allUsers.slice(0, 3).map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleQuickDemoSelect(user)}
                    className={`p-2 rounded-lg border text-left transition-all hover:scale-[1.02] ${
                      username.toLowerCase() === user.username.toLowerCase()
                        ? 'border-sky-500 bg-sky-950/40'
                        : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate">{user.name.split(' ')[0]}</span>
                      <span
                        className={`text-[9px] uppercase font-mono font-bold px-1 rounded ${
                          user.role === 'admin'
                            ? 'bg-amber-900/60 text-amber-300'
                            : user.role === 'editor'
                            ? 'bg-cyan-900/60 text-cyan-300'
                            : 'bg-emerald-900/60 text-emerald-300'
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-neutral-400 mt-1 truncate">
                      @{user.username}
                    </div>
                    <div className="text-[10px] font-mono text-sky-400/80">
                      PW: {user.password || 'admin123'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-neutral-900 text-center text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-emerald-500" />
          <span>Reverse Proxy Gateway Port 200 · Active</span>
        </div>
        <div>
          <span>TelePulse Enterprise Authentication System · RBAC v2.4</span>
        </div>
      </footer>
    </div>
  );
};
