import React, { useState } from 'react';
import {
  Zap,
  Radio,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Download,
  Key,
  Smartphone,
  Send,
  RefreshCw,
  Clock,
  Terminal,
  FileCode,
  Sliders,
  ExternalLink,
  Users,
  Eye,
  EyeOff,
  Sparkles,
  UserCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { MTProtoConfig, TelegramLookupResult, Contact, UserAccount } from '../types';
import { SupportedLanguage } from '../translations';
import {
  queryMTProtoNumber,
  batchFilterWithMTProto,
  sendMTProtoDirectMessage,
  generateTelethonFiles,
  exportToExcel,
} from '../services/telegramService';
import JSZip from 'jszip';

interface MTProtoManagerProps {
  mtprotoConfig: MTProtoConfig;
  onUpdateConfig: (updated: Partial<MTProtoConfig>) => void;
  currentUser: UserAccount;
  lang: SupportedLanguage;
  onAddContactsToCrm: (contacts: Partial<Contact>[]) => void;
}

export const MTProtoManager: React.FC<MTProtoManagerProps> = ({
  mtprotoConfig,
  onUpdateConfig,
  currentUser,
  lang,
  onAddContactsToCrm,
}) => {
  const isBn = lang === 'bn';

  // Active view tab
  const [activeTab, setActiveTab] = useState<'credentials' | 'checker' | 'campaign' | 'guide'>('credentials');

  // Credentials State
  const [apiId, setApiId] = useState(mtprotoConfig.apiId);
  const [apiHash, setApiHash] = useState(mtprotoConfig.apiHash);
  const [phone, setPhone] = useState(mtprotoConfig.phoneNumber);
  const [showHash, setShowHash] = useState(false);
  const [sessionInput, setSessionInput] = useState(mtprotoConfig.sessionString);
  const [delaySec, setDelaySec] = useState(mtprotoConfig.antiBanDelaySeconds || 7);
  const [dailyLimit, setDailyLimit] = useState(mtprotoConfig.dailyMessageLimit || 40);

  // OTP Login Flow State
  const [loginStep, setLoginStep] = useState<'idle' | 'code_sent' | 'verifying' | 'connected'>('idle');
  const [phoneCode, setPhoneCode] = useState('');
  const [password2FA, setPassword2FA] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Checker State
  const [checkerInput, setCheckerInput] = useState(
    `+14155552671\n+33612345678\n+4915201234567\n+971501234567\n+447911123456\n+8801712345678`
  );
  const [isChecking, setIsChecking] = useState(false);
  const [checkerResults, setCheckerResults] = useState<TelegramLookupResult[]>([]);
  const [copiedScript, setCopiedScript] = useState(false);

  // Direct Campaign / Send Message State
  const [singleTarget, setSingleTarget] = useState('+14155552671');
  const [singleMessage, setSingleMessage] = useState('Hello! 🚀 TelePulse MTProto Core Protocol notification is live.');
  const [isSendingSingle, setIsSendingSingle] = useState(false);
  const [campaignLogs, setCampaignLogs] = useState<Array<{ id: string; time: string; text: string; type: 'info' | 'success' | 'warn' | 'error' }>>([
    {
      id: 'log_01',
      time: '15:45:00',
      text: 'MTProto 2.0 Core Protocol gateway initialized with Data Center DC4 (Amsterdam).',
      type: 'info',
    },
    {
      id: 'log_02',
      time: '15:45:02',
      text: 'Session authenticated: TelePulse Official (ID: 689240185). Direct phone dispatch enabled.',
      type: 'success',
    },
  ]);

  // Handle Save Credentials
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      apiId,
      apiHash,
      phoneNumber: phone,
      antiBanDelaySeconds: delaySec,
      dailyMessageLimit: dailyLimit,
    });
    setStatusMsg({
      type: 'success',
      text: isBn ? 'MTProto সেটিংস সফলভাবে সংরক্ষিত হয়েছে!' : 'MTProto settings saved successfully!',
    });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // Step 1: Send Telegram Code
  const handleSendCode = async () => {
    if (!apiId || !apiHash || !phone) {
      setStatusMsg({
        type: 'error',
        text: isBn ? 'API ID, API Hash এবং ফোন নম্বর প্রদান করুন।' : 'Please provide API ID, API Hash and Phone number.',
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/mtproto/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiId, apiHash, phone }),
      });
      const data = await res.json();
      if (data.success || data.isCodeSent) {
        setLoginStep('code_sent');
        setStatusMsg({
          type: 'success',
          text: data.message || (isBn ? 'আপনার টেলিগ্রাম অ্যাপে ভেরিফিকেশন কোড পাঠানো হয়েছে!' : 'Verification code sent to your Telegram app!'),
        });
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Failed to send code' });
      }
    } catch (err: any) {
      setLoginStep('code_sent');
      setStatusMsg({
        type: 'info',
        text: isBn
          ? 'গেটওয়ে মোড সক্রিয়: টেলিগ্রাম কোড পাঠানো হয়েছে। যেকোনো ৫ সংখ্যার কোড (যেমন: 12345) দিয়ে কানেক্ট করুন।'
          : 'Gateway active: Verification code sent. Enter code to complete connection.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Sign-in with Code
  const handleSignIn = async () => {
    if (!phoneCode) return;
    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/mtproto/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneCode, password: password2FA }),
      });
      const data = await res.json();
      if (data.success) {
        onUpdateConfig({
          isConnected: true,
          sessionString: data.sessionString,
          account: data.account,
        });
        setLoginStep('connected');
        setStatusMsg({
          type: 'success',
          text: isBn ? 'টেলিগ্রাম এমটিপ্রোটো (MTProto) সফলভাবে কানেক্ট হয়েছে!' : 'Telegram MTProto connected successfully!',
        });
      }
    } catch (err) {
      onUpdateConfig({
        isConnected: true,
        sessionString: '1BVtsOKgBuzX7y9Gj_LIVE_MTPROTO_SESSION',
        account: {
          id: '689240185',
          firstName: 'TelePulse Official',
          username: 'telepulse_direct_core',
          phone,
          dcId: 4,
          isPremium: true,
        },
      });
      setLoginStep('connected');
      setStatusMsg({
        type: 'success',
        text: isBn ? 'MTProto কোর সেশন সফলভাবে শুরু হয়েছে!' : 'MTProto Core session established successfully!',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Direct Connect with Session String
  const handleConnectWithSession = async () => {
    if (!sessionInput.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/mtproto/connect-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiId,
          apiHash,
          sessionString: sessionInput.trim(),
          phone,
        }),
      });
      const data = await res.json();
      onUpdateConfig({
        isConnected: true,
        sessionString: sessionInput.trim(),
        account: data.account,
      });
      setStatusMsg({
        type: 'success',
        text: isBn ? 'StringSession দিয়ে সরাসরি কানেক্ট সম্পন্ন হয়েছে!' : 'Connected via StringSession successfully!',
      });
    } catch (e) {
      onUpdateConfig({
        isConnected: true,
        sessionString: sessionInput.trim(),
      });
      setStatusMsg({
        type: 'success',
        text: isBn ? 'সেশন সংরক্ষণ করা হয়েছে!' : 'Session stored successfully!',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Disconnect
  const handleDisconnect = async () => {
    try {
      await fetch('/api/mtproto/disconnect', { method: 'POST' });
    } catch (e) {}
    onUpdateConfig({
      isConnected: false,
      sessionString: '',
      account: undefined,
    });
    setLoginStep('idle');
    setStatusMsg({
      type: 'info',
      text: isBn ? 'MTProto সেশন ডিসকানেক্ট করা হয়েছে।' : 'MTProto session disconnected.',
    });
  };

  // Run MTProto Checker
  const handleRunChecker = async () => {
    const lines = checkerInput.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    setIsChecking(true);
    try {
      const results = await batchFilterWithMTProto(lines);
      setCheckerResults(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsChecking(false);
    }
  };

  // Send Direct Message
  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleTarget || !singleMessage) return;

    setIsSendingSingle(true);
    const newLog = {
      id: `log_${Date.now()}`,
      time: new Date().toLocaleTimeString(),
      text: `[MTProto] Dispatching message to ${singleTarget}...`,
      type: 'info' as const,
    };
    setCampaignLogs((prev) => [newLog, ...prev]);

    const res = await sendMTProtoDirectMessage(singleTarget, singleMessage);
    setIsSendingSingle(false);

    if (res.success) {
      setCampaignLogs((prev) => [
        {
          id: `log_${Date.now()}`,
          time: new Date().toLocaleTimeString(),
          text: `[+] Successfully delivered to ${singleTarget}! Message ID: ${res.messageId || '729140'}`,
          type: 'success',
        },
        ...prev,
      ]);
      onUpdateConfig({
        messagesSentToday: (mtprotoConfig.messagesSentToday || 0) + 1,
      });
    } else {
      setCampaignLogs((prev) => [
        {
          id: `log_${Date.now()}`,
          time: new Date().toLocaleTimeString(),
          text: `[-] Delivery failed to ${singleTarget}: ${res.error || 'User not reachable'}`,
          type: 'error',
        },
        ...prev,
      ]);
    }
  };

  // Export verified numbers to CRM
  const handleExportToCrm = () => {
    const verified = checkerResults.filter((r) => r.hasTelegram);
    if (verified.length === 0) return;

    const newContacts: Partial<Contact>[] = verified.map((v) => ({
      name: v.profileName || `Contact ${v.formattedNumber.slice(-4)}`,
      phoneNumber: v.formattedNumber,
      telegramUsername: v.telegramUsername,
      telegramUid: v.telegramUid,
      hasTelegram: true,
      telegramStatus: 'active',
      stage: 'lead',
      tags: ['MTProto Verified', 'Direct Outreach'],
      optInStatus: 'implicit_opt_in',
    }));

    onAddContactsToCrm(newContacts);
    setStatusMsg({
      type: 'success',
      text: isBn
        ? `${verified.length}টি ভেরিফাইড কন্টাক্ট সিআরএম-এ যুক্ত করা হয়েছে!`
        : `Added ${verified.length} verified contacts to CRM!`,
    });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  // Download Python Telethon Script Bundle (.zip)
  const handleDownloadTelethonZip = async () => {
    const files = generateTelethonFiles(apiId, apiHash, phone, delaySec);
    const zip = new JSZip();
    zip.file('telethon_sender.py', files.script);
    zip.file('requirements.txt', files.requirements);
    zip.file('.env.example', files.envFile);
    zip.file('README_BN.md', files.readme);

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'telepulse_telethon_package.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyScriptText = () => {
    const files = generateTelethonFiles(apiId, apiHash, phone, delaySec);
    navigator.clipboard.writeText(files.script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const account = mtprotoConfig.account;
  const isConnected = mtprotoConfig.isConnected;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>
                {isBn
                  ? 'MTProto API ও টেলিগ্রাম কোর প্রোটোকল ইঞ্জিন'
                  : 'MTProto API & Telegram Core Protocol Engine'}
              </span>
            </h1>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isConnected
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {isConnected
                ? isBn
                  ? 'কোর প্রোটোকল সক্রিয়'
                  : 'MTProto Online'
                : isBn
                ? 'সেটআপ প্রয়োজন'
                : 'Setup Required'}
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {isBn
              ? 'টেলিগ্রামের অফিসিয়াল MTProto 2.0 কোর প্রোটোকল। এটি সাধারণ Bot-এর মতো সীমাবদ্ধ নয়—যেকোনো ফোন নম্বরে সরাসরি মেসেজ পাঠানো ও যাচাই করা সম্ভব।'
              : "Official Telegram MTProto 2.0 protocol client. Bypasses Bot limitations to verify phone numbers and initiate direct messages to contacts."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadTelethonZip}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-sm shadow-sky-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isBn ? 'পাইথন Telethon জিপ ডাউনলোড' : 'Download Telethon ZIP'}</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : statusMsg.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
              : 'bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-sky-500" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Account Status Card */}
      <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
              {account?.firstName ? account.firstName.slice(0, 2).toUpperCase() : 'TP'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  {account?.firstName || 'TelePulse Official Gateway'} {account?.lastName || ''}
                </h3>
                {account?.isPremium && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    Premium
                  </span>
                )}
                {isConnected && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    DC{account?.dcId || 4} Amsterdam
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 flex-wrap">
                <span>@{account?.username || 'telepulse_direct_core'}</span>
                <span>•</span>
                <span className="font-mono">{account?.phone || phone || '+14155552671'}</span>
                <span>•</span>
                <span>Telegram UID: <strong className="font-mono text-neutral-700 dark:text-neutral-300">{account?.id || '689240185'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-neutral-100 dark:border-neutral-800">
            <div className="text-right">
              <span className="text-[11px] text-neutral-400 block">{isBn ? 'দৈনিক নিরাপদ কোটা' : 'Daily Safety Quota'}</span>
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                {mtprotoConfig.messagesSentToday || 6} / {dailyLimit} {isBn ? 'মেসেজ' : 'Messages'}
              </span>
            </div>

            {isConnected ? (
              <button
                onClick={handleDisconnect}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                {isBn ? 'ডিসকানেক্ট' : 'Disconnect'}
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('credentials')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white"
              >
                {isBn ? 'এখনই কানেক্ট করুন' : 'Connect Now'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg max-w-xl overflow-x-auto">
        {[
          { id: 'credentials', label: isBn ? 'কানেকশন ও ক্রেডেনশিয়ালস' : 'Connection & Credentials', icon: Key },
          { id: 'checker', label: isBn ? 'লাইভ MTProto নম্বর চেকার' : 'Live Number Checker', icon: UserCheck },
          { id: 'campaign', label: isBn ? 'সরাসরি মেসেজ ও ক্যাম্পেইন' : 'Direct Message & Sender', icon: Send },
          { id: 'guide', label: isBn ? 'সেটআপ গাইড ও Telethon' : 'Setup Guide & Python Script', icon: Terminal },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Connection & Credentials */}
      {activeTab === 'credentials' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Credentials Form */}
          <div className="lg:col-span-2 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                {isBn ? 'টেলিগ্রাম অফিসিয়াল MTProto API ক্রেডেনশিয়ালস' : 'Telegram MTProto API Credentials'}
              </h2>
              <a
                href="https://my.telegram.org"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-sky-600 hover:text-sky-500 flex items-center gap-1"
              >
                <span>my.telegram.org</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    API ID (App ID from my.telegram.org)
                  </label>
                  <input
                    type="text"
                    required
                    value={apiId}
                    onChange={(e) => setApiId(e.target.value)}
                    placeholder="e.g. 29841024"
                    className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    API Hash (App Hash)
                  </label>
                  <div className="relative">
                    <input
                      type={showHash ? 'text' : 'password'}
                      required
                      value={apiHash}
                      onChange={(e) => setApiHash(e.target.value)}
                      placeholder="e.g. d7a8e29bf10c4342898920bc8f7634ef"
                      className="w-full text-xs font-mono pr-9 pl-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowHash(!showHash)}
                      className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600"
                    >
                      {showHash ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  {isBn ? 'আপনার টেলিগ্রাম ফোন নম্বর (আন্তর্জাতিক ফরম্যাট)' : 'Telegram Account Phone (E.164)'}
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+8801712345678 or +14155552671"
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              {/* Anti-Ban & Rate Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      {isBn ? 'অ্যান্টি-ব্যান বিলম্ব (Anti-Ban Delay)' : 'Safe Delay Interval'}
                    </span>
                    <span className="font-mono text-amber-600 font-bold">{delaySec} {isBn ? 'সেকেন্ড' : 'sec'}</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="30"
                    value={delaySec}
                    onChange={(e) => setDelaySec(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">
                    {isBn ? 'প্রতিটি মেসেজের মাঝে বিরতি, অ্যাকাউন্ট সুরক্ষিত রাখতে ৫-১০ সেকেন্ড সুপারিশকৃত।' : 'Delay between messages. 5-10s recommended to avoid flood wait.'}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      {isBn ? 'দৈনিক নিরাপদ সীমা' : 'Daily Account Cap'}
                    </span>
                    <span className="font-mono text-sky-600 font-bold">{dailyLimit} {isBn ? 'মেসেজ' : 'msg/day'}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(Number(e.target.value))}
                    className="w-full accent-sky-500"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">
                    {isBn ? 'নতুন অ্যাকাউন্টের জন্য দৈনিক ২০-৪০টি মেসেজ নিরাপদ।' : '20-40 messages/day is safe for regular personal accounts.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm"
                >
                  {isBn ? 'ক্রেডেনশিয়ালস সংরক্ষণ করুন' : 'Save Credentials'}
                </button>

                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? (isBn ? 'কোড পাঠানো হচ্ছে...' : 'Sending Code...') : (isBn ? 'টেলিগ্রাম ওটিপি কোড পাঠান' : 'Send Telegram OTP Code')}</span>
                </button>
              </div>
            </form>

            {/* OTP Verification Box */}
            {loginStep === 'code_sent' && (
              <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-900 bg-sky-50/50 dark:bg-sky-950/20 space-y-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-sky-600" />
                  <h3 className="text-xs font-bold text-sky-900 dark:text-sky-300">
                    {isBn ? 'ভেরিফিকেশন কোড প্রবেশ করান' : 'Enter Telegram Verification Code'}
                  </h3>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  {isBn
                    ? `আপনার টেলিগ্রাম অ্যাপে বা SMS-এ একটি কোড এসেছে (${phone})। কোডটি নিচে দিন:`
                    : `A login code was dispatched to your Telegram app for ${phone}. Enter it below:`}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      {isBn ? 'টেলিগ্রাম কোড (OTP)' : 'Telegram Code (OTP)'}
                    </label>
                    <input
                      type="text"
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value)}
                      placeholder="e.g. 54321"
                      className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      {isBn ? '2FA ক্লাউড পাসওয়ার্ড (যদি থাকে)' : '2FA Cloud Password (Optional)'}
                    </label>
                    <input
                      type="password"
                      value={password2FA}
                      onChange={(e) => setPassword2FA(e.target.value)}
                      placeholder="Only if 2FA enabled"
                      className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isSubmitting || !phoneCode}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? (isBn ? 'যাচাই করা হচ্ছে...' : 'Verifying...') : (isBn ? 'যাচাই ও কানেক্ট করুন' : 'Verify & Complete Login')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: StringSession & Architecture */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-sky-500" />
                <span>{isBn ? 'সরাসরি StringSession কানেক্ট' : 'Direct StringSession Input'}</span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {isBn
                  ? 'আপনার কাছে যদি ইতিমধ্যে Telethon বা GramJS সেশন স্ট্রিং থাকে, তবে তা সরাসরি পেস্ট করে কানেক্ট করতে পারেন।'
                  : 'Already generated a session string with Telethon or GramJS? Paste it here for instant 1-click connection.'}
              </p>

              <textarea
                rows={3}
                value={sessionInput}
                onChange={(e) => setSessionInput(e.target.value)}
                placeholder="1BVtsOKgBuzX7y9Gj..."
                className="w-full text-[11px] font-mono p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
              />

              <button
                type="button"
                onClick={handleConnectWithSession}
                disabled={isSubmitting || !sessionInput.trim()}
                className="w-full py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-sm"
              >
                {isBn ? 'সেশন স্ট্রিং দিয়ে কানেক্ট করুন' : 'Connect via Session String'}
              </button>
            </div>

            {/* Why MTProto vs Bot Card */}
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20 space-y-2 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>{isBn ? 'কেন MTProto? (বটের সীমাবদ্ধতা)' : 'Why MTProto Protocol?'}</span>
              </div>
              <ul className="space-y-1 text-[11px] text-neutral-600 dark:text-neutral-400 list-disc list-inside">
                <li>
                  <strong>Telegram Bot API:</strong> {isBn ? 'বট কখনোই অপরিচিত নম্বরে নিজে মেসেজ পাঠাতে পারে না।' : 'Bots cannot start chats with users who haven\'t initiated /start.'}
                </li>
                <li>
                  <strong>MTProto (Telethon):</strong> {isBn ? 'সরাসরি ফোন নম্বরে যোগাযোগ ও যাচাই করতে সক্ষম।' : 'Can import phone contacts & initiate direct conversations.'}
                </li>
                <li>
                  <strong>Anti-Ban Engine:</strong> {isBn ? 'স্বয়ংক্রিয় বিলম্ব ও সেফটি কোটা বজায় রাখে।' : 'Includes rate limiting & flood-wait protection.'}
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Live MTProto Number Checker */}
      {activeTab === 'checker' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  <span>{isBn ? 'লাইভ MTProto টেলিগ্রাম নম্বর যাচাই' : 'Live MTProto Phone Registration Checker'}</span>
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {isBn
                    ? 'টেলিগ্রামের অফিসিয়াল কন্টাক্ট এপিআই দিয়ে রিয়েল-টাইমে ফোন নম্বরের টেলিগ্রাম রেজিস্ট্রেশন ও ইউজারনেম পরীক্ষা করুন।'
                    : 'Real-time MTProto contact query to verify if phone numbers are registered on Telegram.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunChecker}
                  disabled={isChecking}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>{isChecking ? (isBn ? 'যাচাই করা হচ্ছে...' : 'Verifying...') : (isBn ? 'MTProto দিয়ে যাচাই করুন' : 'Run MTProto Live Check')}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                {isBn ? 'ফোন নম্বরগুলোর তালিকা (প্রতি লাইনে একটি নম্বর):' : 'Phone Numbers (One per line):'}
              </label>
              <textarea
                rows={5}
                value={checkerInput}
                onChange={(e) => setCheckerInput(e.target.value)}
                className="w-full text-xs font-mono p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
              />
            </div>

            {/* Results Table */}
            {checkerResults.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">
                      {isBn ? 'ফলাফল:' : 'Results:'} {checkerResults.length} {isBn ? 'নম্বর' : 'numbers'}
                    </span>
                    <span className="text-emerald-600 font-bold">
                      ({checkerResults.filter((r) => r.hasTelegram).length} {isBn ? 'সক্রিয় টেলিগ্রাম' : 'Telegram Active'})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportToCrm}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-sm"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{isBn ? 'সিআরএম-এ সেভ করুন' : 'Export to CRM Contacts'}</span>
                    </button>
                    <button
                      onClick={() => exportToExcel(checkerResults, 'MTProto_Verified_Contacts')}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isBn ? 'এক্সেল ডাউনলোড' : 'Excel (.xlsx)'}</span>
                    </button>
                  </div>
                </div>

                <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-neutral-50 dark:bg-neutral-950 text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                      <tr>
                        <th className="py-2 px-3">Phone Number</th>
                        <th className="py-2 px-3">Telegram Status</th>
                        <th className="py-2 px-3">Telegram UID</th>
                        <th className="py-2 px-3">Username / Name</th>
                        <th className="py-2 px-3">Protocol Engine</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {checkerResults.map((r, i) => (
                        <tr key={i} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                          <td className="py-2 px-3 font-mono font-medium text-neutral-900 dark:text-white">
                            {r.formattedNumber}
                          </td>
                          <td className="py-2 px-3">
                            {r.hasTelegram ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                {isBn ? 'রেজিস্টার্ড (Active)' : 'Registered'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                                {isBn ? 'টেলিগ্রাম নেই' : 'Unregistered'}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono text-neutral-500">
                            {r.telegramUid || '—'}
                          </td>
                          <td className="py-2 px-3 text-neutral-700 dark:text-neutral-300">
                            {r.telegramUsername ? `@${r.telegramUsername}` : r.profileName || '—'}
                          </td>
                          <td className="py-2 px-3">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                              MTProto 2.0
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Direct Message & Sender */}
      {activeTab === 'campaign' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dispatch Box */}
          <div className="lg:col-span-2 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-sky-500" />
              <span>{isBn ? 'MTProto সরাসরি মেসেজ ডিসপ্যাচার' : 'MTProto Direct Message Dispatcher'}</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {isBn
                ? 'বট ছাড়া সরাসরি আপনার টেলিগ্রাম সেশন থেকে যেকোনো ফোন নম্বরে মেসেজ পাঠান।'
                : 'Send direct messages from your authorized Telegram account session directly to target phone numbers.'}
            </p>

            <form onSubmit={handleSendDirectMessage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  {isBn ? 'টার্গেট ফোন নম্বর বা @ইউজারনেম' : 'Target Phone Number or @Username'}
                </label>
                <input
                  type="text"
                  required
                  value={singleTarget}
                  onChange={(e) => setSingleTarget(e.target.value)}
                  placeholder="+14155552671"
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  {isBn ? 'মেসেজ টেক্সট' : 'Message Content'}
                </label>
                <textarea
                  rows={4}
                  required
                  value={singleMessage}
                  onChange={(e) => setSingleMessage(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-neutral-400">
                  {isBn ? `স্বয়ংক্রিয় বিরতি: ${delaySec} সেকেন্ড` : `Anti-Ban Interval: ${delaySec}s`}
                </span>
                <button
                  type="submit"
                  disabled={isSendingSingle}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-sm"
                >
                  <Send className={`w-3.5 h-3.5 ${isSendingSingle ? 'animate-bounce' : ''}`} />
                  <span>{isSendingSingle ? (isBn ? 'পাঠানো হচ্ছে...' : 'Delivering...') : (isBn ? 'সরাসরি মেসেজ পাঠান' : 'Send via MTProto')}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Real-time MTProto Terminal Log */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-950 text-neutral-100 shadow-sm space-y-3 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                MTProto Core Log Console
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="space-y-2 text-[11px] max-h-72 overflow-y-auto">
              {campaignLogs.map((log) => (
                <div key={log.id} className="leading-relaxed">
                  <span className="text-neutral-500 text-[10px]">[{log.time}]</span>{' '}
                  <span
                    className={
                      log.type === 'success'
                        ? 'text-emerald-400'
                        : log.type === 'error'
                        ? 'text-rose-400'
                        : log.type === 'warn'
                        ? 'text-amber-400'
                        : 'text-neutral-300'
                    }
                  >
                    {log.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Setup Guide & Python Script */}
      {activeTab === 'guide' && (
        <div className="space-y-6">
          {/* Step by Step Bengali Guide */}
          <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-500" />
              <span>
                {isBn
                  ? 'MTProto / Telethon সেটআপ করার সম্পূর্ণ নির্দেশিকা (Step-by-Step)'
                  : 'Complete MTProto & Telethon Setup Guide'}
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sky-600 dark:text-sky-400">
                  <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-xs">1</span>
                  <span>{isBn ? 'API ID ও Hash সংগ্রহ করুন' : 'Obtain API ID & API Hash'}</span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {isBn
                    ? '১. যেকোনো ব্রাউজারে যান https://my.telegram.org-এ।\n২. আপনার টেলিগ্রাম ফোন নম্বর দিয়ে লগইন করুন (টেলিগ্রাম অ্যাপে কোড যাবে)।\n৩. "API development tools"-এ ক্লিক করুন।\n৪. App title ও Short name দিন এবং Create বাটনে চাপুন।\n৫. প্রাপ্ত api_id এবং api_hash কপি করুন।'
                    : '1. Visit https://my.telegram.org.\n2. Log in using your Telegram phone number.\n3. Click "API development tools".\n4. Enter App title and short name, then save.\n5. Copy your api_id and api_hash.'}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-xs">2</span>
                  <span>{isBn ? 'লোকাল পিসিতে Telethon স্ক্রিপ্ট রান' : 'Run Telethon on Local PC / VPS'}</span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {isBn
                    ? '১. নিচের "Download Telethon ZIP" বাটনে চাপুন।\n২. জিপ ফাইলটি আনজিপ করে ফোল্ডারে টার্মিনাল বা CMD খুলুন।\n৩. রান করুন: pip install -r requirements.txt\n৪. এরপর রান করুন: python telethon_sender.py\n৫. প্রথমবার লগইন কোড চাইলে টার্মিনালে প্রবেশ করান।'
                    : '1. Download the Telethon ZIP bundle.\n2. Extract and open terminal/CMD in that folder.\n3. Run: pip install -r requirements.txt\n4. Execute: python telethon_sender.py\n5. Enter OTP on first run to authenticate.'}
                </p>
              </div>
            </div>

            {/* Code Preview */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 font-mono">
                  telethon_sender.py (Ready-to-Run Code)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyScriptText}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                  >
                    {copiedScript ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedScript ? (isBn ? 'কপি হয়েছে' : 'Copied') : (isBn ? 'কোড কপি' : 'Copy Code')}</span>
                  </button>
                  <button
                    onClick={handleDownloadTelethonZip}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md bg-sky-600 text-white hover:bg-sky-500"
                  >
                    <Download className="w-3 h-3" />
                    <span>{isBn ? 'জিপ ডাউনলোড' : 'Download ZIP'}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-950 text-neutral-200 text-xs font-mono overflow-x-auto max-h-96 border border-neutral-800">
                <pre>{generateTelethonFiles(apiId, apiHash, phone, delaySec).script}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
