import React, { useState } from 'react';
import {
  Send,
  Users,
  Search,
  CheckCircle2,
  Clock,
  PhoneCall,
  Globe2,
  Lock,
  Moon,
  Sun,
  Bell,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ShieldCheck,
  Zap,
  MessageSquare,
  User,
  LogOut,
} from 'lucide-react';
import { UserAccount, UserRole, GoogleContactsSync, TelegramBotConfig } from '../types';
import { translations, SupportedLanguage } from '../translations';

interface HeaderProps {
  currentUser: UserAccount;
  allUsers: UserAccount[];
  onSwitchUser: (userId: string) => void;
  onLogout: () => void;
  lang: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  botConfig: TelegramBotConfig;
  googleSync: GoogleContactsSync;
  onTriggerGoogleSync: () => void;
  viewMode: 'portal' | 'website';
  onToggleViewMode: () => void;
  onOpenQuickFilter: () => void;
  onOpenQuickCampaign: () => void;
  onNavigateToCrmInbox: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  onLogout,
  lang,
  onLanguageChange,
  theme,
  onToggleTheme,
  botConfig,
  googleSync,
  onTriggerGoogleSync,
  viewMode,
  onToggleViewMode,
  onOpenQuickFilter,
  onOpenQuickCampaign,
  onNavigateToCrmInbox,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const t = translations[lang] || translations.en;

  const handleSyncClick = () => {
    setSyncing(true);
    setTimeout(() => {
      onTriggerGoogleSync();
      setSyncing(false);
    }, 900);
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'text-amber-500 dark:text-amber-400 font-semibold';
      case 'editor':
        return 'text-cyan-500 dark:text-cyan-400 font-semibold';
      case 'viewer':
        return 'text-emerald-500 dark:text-emerald-400 font-semibold';
    }
  };

  const languages: { code: SupportedLanguage; label: string; flag: string }[] = [
    { code: 'bn', label: 'বাংলা', flag: '🇧🇩' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'ar', label: 'العربية', flag: '🇦🇪' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md px-4 lg:px-6 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Brand & Gateway Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sky-500 text-white font-bold shadow-sm shadow-sky-500/20">
              <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base tracking-tight text-neutral-900 dark:text-white">
                  TelePulse
                </span>
                <span className="text-xs uppercase tracking-wider text-sky-600 dark:text-sky-400 font-medium">
                  Enterprise
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Port {currentUser.assignedPort} Gateway</span>
                <span aria-hidden="true">·</span>
                <span>WP Bridge Active</span>
              </div>
            </div>
          </div>

          {/* Quick switcher: Website vs Admin Portal */}
          <button
            onClick={onToggleViewMode}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border transition-all ${
              viewMode === 'website'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/30'
                : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>{viewMode === 'website' ? t.adminPortal : t.websiteView}</span>
          </button>
        </div>

        {/* Center: Quick action buttons filtered by 3 strict rules */}
        <div className="hidden xl:flex items-center gap-2">
          {/* Rule 3: Viewer can only access CRM leads & Live chat reply */}
          {currentUser.role === 'viewer' && (
            <button
              onClick={onNavigateToCrmInbox}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t.crmLiveChat}</span>
            </button>
          )}

          {/* Rule 2: Editor manages SMS campaigns, filters numbers, and handles contact lists */}
          {currentUser.role === 'editor' && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenQuickCampaign}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-white bg-sky-600 hover:bg-sky-500 shadow-sm shadow-sky-600/20 transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{t.newCampaign}</span>
              </button>
              <button
                onClick={onOpenQuickFilter}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-sky-500" />
                <span>{t.filterPhones}</span>
              </button>
              <button
                onClick={onNavigateToCrmInbox}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t.contacts}</span>
              </button>
            </div>
          )}

          {/* Rule 1: Admin controls everything */}
          {currentUser.role === 'admin' && (
            <>
              <button
                onClick={onOpenQuickFilter}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-sky-500" />
                <span>{t.filterPhones}</span>
              </button>

              <button
                onClick={onOpenQuickCampaign}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-white bg-sky-600 hover:bg-sky-500 shadow-sm shadow-sky-600/20 transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{t.newCampaign}</span>
              </button>
            </>
          )}
        </div>

        {/* Right side: Sync, Language, Theme, Role Switcher, Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Google Contacts Sync Indicator (Admin & Viewer) */}
          {currentUser.role !== 'editor' && (
            <button
              onClick={handleSyncClick}
              disabled={syncing}
              title={`Google Contacts Sync: ${googleSync.accountEmail}`}
              className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-md border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-500 ${syncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Google Sync</span>
            </button>
          )}

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
            >
              <span>{languages.find((l) => l.code === lang)?.flag}</span>
              <span className="uppercase font-medium text-xs">{lang}</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-36 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg py-1 z-50">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      onLanguageChange(l.code);
                      setLangDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-1.5 text-xs text-left transition-colors ${
                      lang === l.code
                        ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-medium'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <span>
                      {l.flag} {l.label}
                    </span>
                    {lang === l.code && <CheckCircle2 className="w-3 h-3 text-sky-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle color theme"
            className="p-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-600" />}
          </button>

          {/* User & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-6 h-6 rounded-full object-cover ring-1 ring-neutral-300 dark:ring-neutral-700"
              />
              <div className="text-left hidden sm:block">
                <div className="text-xs font-medium text-neutral-800 dark:text-neutral-200 leading-tight">
                  {currentUser.name}
                </div>
                <div className={`text-[10px] uppercase tracking-wider ${getRoleBadgeStyle(currentUser.role)}`}>
                  {currentUser.role}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-72 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl py-2 z-50">
                <div className="px-3 py-1.5 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center justify-between">
                    <span>Active Session</span>
                    <span className="font-mono text-[10px] text-sky-500">@{currentUser.username}</span>
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400">{currentUser.email}</div>
                  <div className="mt-1 text-[10px] text-neutral-400 dark:text-neutral-500">
                    Port: {currentUser.assignedPort} · {currentUser.department}
                  </div>
                  <div className="mt-1.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded">
                    {currentUser.role === 'admin'
                      ? 'অ্যাডমিন: সম্পূর্ণ নিয়ন্ত্রণ ও ইউজার তৈরির ক্ষমতা'
                      : currentUser.role === 'editor'
                      ? 'এডিটর: শুধুমাত্র SMS ক্যাম্পেইন চালানো অনুমোদিত'
                      : 'ভিউয়ার: কেবল CRM লিডস ও লাইভ চ্যাটে গ্রাহকদের উত্তর'}
                  </div>
                </div>

                {currentUser.role === 'admin' && (
                  <>
                    <div className="px-3 pt-2 pb-1 text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                      সুইচ অ্যাকাউন্ট (Admin Switch)
                    </div>

                    {allUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSwitchUser(u.id);
                          setUserDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between w-full px-3 py-2 text-xs transition-colors ${
                          u.id === currentUser.id
                            ? 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300'
                            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <img src={u.avatar} alt={u.name} className="w-5 h-5 rounded-full object-cover" />
                          <div className="text-left">
                            <div className="font-medium">{u.name}</div>
                            <div className="text-[10px] text-neutral-400 capitalize">
                              @{u.username} · {u.role}
                            </div>
                          </div>
                        </div>
                        {u.id === currentUser.id && <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />}
                      </button>
                    ))}
                  </>
                )}

                {/* Logout Option */}
                <div className="mt-2 pt-2 px-2 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>লগ-আউট করুন (Logout)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Logout Button in Header Bar */}
          <button
            onClick={onLogout}
            title="লগ-আউট করুন (Log Out)"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">লগ-আউট</span>
          </button>
        </div>
      </div>
    </header>
  );
};
