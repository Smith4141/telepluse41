import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  Bot,
  User,
  Sparkles,
  Volume2,
  VolumeX,
  Languages,
  ArrowRightLeft,
  Globe2,
  CheckCheck,
  Clock,
  Phone,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Contact, ChatMessage, UserAccount } from '../types';
import { translations, SupportedLanguage } from '../translations';
import { translateWithGoogle, detectLanguage } from '../services/translationService';

interface LiveChatViewProps {
  contacts: Contact[];
  chats: Record<string, ChatMessage[]>;
  currentUser: UserAccount;
  allUsers: UserAccount[];
  lang: SupportedLanguage;
  onSendMessage: (contactId: string, text: string) => void;
  onSimulateCustomerReply: (contactId: string, text: string) => void;
  selectedContactId?: string;
  onSelectContact?: (id: string) => void;
}

// Web Audio API chime
function playChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.28);
  } catch {
    // Ignore audio restrictions
  }
}

export const LiveChatView: React.FC<LiveChatViewProps> = ({
  contacts,
  chats,
  currentUser,
  allUsers,
  lang,
  onSendMessage,
  onSimulateCustomerReply,
  selectedContactId: initialContactId,
  onSelectContact,
}) => {
  const t = translations[lang] || translations.en;

  const [activeContactId, setActiveContactId] = useState<string>(
    initialContactId || contacts[0]?.id || 'c_01'
  );
  const [chatSearch, setChatSearch] = useState('');
  const [chatInputText, setChatInputText] = useState('');
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Google Translate state
  const [messageTranslations, setMessageTranslations] = useState<
    Record<string, { text: string; targetLang: string; loading?: boolean }>
  >({});
  const [replyTranslating, setReplyTranslating] = useState(false);
  const [translatedReplyPreview, setTranslatedReplyPreview] = useState<{
    text: string;
    targetLang: 'bn' | 'en';
  } | null>(null);

  // Sync prop changes
  useEffect(() => {
    if (initialContactId) {
      setActiveContactId(initialContactId);
    }
  }, [initialContactId]);

  const activeContact = contacts.find((c) => c.id === activeContactId) || contacts[0];
  const currentMessages = chats[activeContactId] || [];

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isCustomerTyping, activeContactId]);

  // Translate specific message bubble
  const handleTranslateMessage = async (msgId: string, text: string) => {
    const existing = messageTranslations[msgId];
    if (existing && !existing.loading) {
      const nextTarget = existing.targetLang === 'en' ? 'bn' : 'en';
      setMessageTranslations((prev) => ({
        ...prev,
        [msgId]: { text: '', targetLang: nextTarget, loading: true },
      }));
      const res = await translateWithGoogle(text, nextTarget);
      setMessageTranslations((prev) => ({
        ...prev,
        [msgId]: { text: res.translatedText, targetLang: nextTarget, loading: false },
      }));
      return;
    }

    const detected = detectLanguage(text);
    const targetLang = detected === 'bn' ? 'en' : 'bn';

    setMessageTranslations((prev) => ({
      ...prev,
      [msgId]: { text: '', targetLang, loading: true },
    }));

    const res = await translateWithGoogle(text, targetLang);
    setMessageTranslations((prev) => ({
      ...prev,
      [msgId]: { text: res.translatedText, targetLang: false as any, loading: false },
    }));
  };

  // Pre-translate agent reply
  const handleTranslateReplyBeforeSend = async (targetLang: 'bn' | 'en') => {
    if (!chatInputText.trim()) return;
    setReplyTranslating(true);
    try {
      const res = await translateWithGoogle(chatInputText, targetLang);
      setTranslatedReplyPreview({
        text: res.translatedText,
        targetLang,
      });
    } finally {
      setReplyTranslating(false);
    }
  };

  const handleApplyTranslatedReply = () => {
    if (!translatedReplyPreview) return;
    setChatInputText(translatedReplyPreview.text);
    setTranslatedReplyPreview(null);
  };

  // Send message
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim()) return;

    const sent = chatInputText;
    onSendMessage(activeContactId, sent);
    setChatInputText('');
    setTranslatedReplyPreview(null);

    if (autoReplyEnabled) {
      setTimeout(() => {
        setIsCustomerTyping(true);
        setTimeout(() => {
          setIsCustomerTyping(false);
          let reply = `Thank you for the quick message, ${currentUser.name}! Could you share the schedule for our upcoming broadcast?`;
          const lower = sent.toLowerCase();
          if (lower.includes('দাম') || lower.includes('খরচ') || lower.includes('price') || lower.includes('cost')) {
            reply = `টেলিপালসের মাধ্যমে প্রতি মেসেজে মাত্র ৳০.২৫ খরচ হবে। আমরা ১ লাখ মেসেজের প্যাকেজে বিশেষ ছাড় দিচ্ছি!`;
          } else if (lower.includes('demo') || lower.includes('call') || lower.includes('ডেমো')) {
            reply = `হ্যাঁ, আগামীকাল দুপুর ৩টায় গুগল মিটে একটি লাইভ ডেমো মিটিং করতে পারি।`;
          } else if (lower.includes('wordpress') || lower.includes('woocommerce') || lower.includes('অর্ডার')) {
            reply = `ওয়ার্ডপ্রেস প্লাগইন ও উকমার্স অটোমেশন সফলভাবে কানেক্ট হয়েছে।`;
          }
          onSimulateCustomerReply(activeContactId, reply);
          if (soundEnabled) playChime();
        }, 1500);
      }, 700);
    }
  };

  const filteredChatContacts = contacts.filter((c) => {
    const q = chatSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phoneNumber.includes(q) ||
      (c.company && c.company.toLowerCase().includes(q)) ||
      (c.telegramUsername && c.telegramUsername.toLowerCase().includes(q))
    );
  });

  const cannedReplies = [
    lang === 'bn' ? 'আসসালামু আলাইকুম! টেলিপালস সাপোর্টে আপনাকে স্বাগতম। কীভাবে সহায়তা করতে পারি?' : 'Hello! Welcome to TelePulse Enterprise Support. How can we assist you today?',
    lang === 'bn' ? 'আমাদের ডেডিকেটেড পোর্ট ২০০ গেটওয়ে প্রতি সেকেন্ডে ৩৫টি মেসেজ পাঠাতে সক্ষম।' : 'Our Port 200 Gateway delivers up to 35 msg/sec with zero 429 flood errors.',
    lang === 'bn' ? 'আপনি কি আগামীকাল একটি দ্রুত এন্টারপ্রাইজ ডেমো কল শিডিউল করতে চান?' : 'Would you like to schedule an enterprise demo walkthrough tomorrow?',
    lang === 'bn' ? 'আপনার ক্যাম্পেইন সফলভাবে তৈরি হয়েছে এবং অনুমোদিত হয়েছে।' : 'Your bulk campaign has been validated and queued for dispatch.',
  ];

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-sky-500" />
              <span>{lang === 'bn' ? 'লাইভ চ্যাট ও গ্রাহক সহায়তা' : lang === 'zh' ? '在线客服与实时会话' : 'Customer Live Chat & Inbox'}</span>
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              {lang === 'bn' ? 'গুগল অনুবাদ ইন্টিগ্রেটেড (বাংলা ⇄ English)' : lang === 'zh' ? '已集成谷歌翻译 (中/英/孟)' : 'Google Translate Enabled (BN ⇄ EN)'}
            </span>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
              currentUser.role === 'admin'
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                : currentUser.role === 'editor'
                ? 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400'
                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
            }`}>
              {currentUser.role === 'admin'
                ? (lang === 'bn' ? 'অ্যাডমিন মোড' : 'Admin Mode')
                : currentUser.role === 'editor'
                ? (lang === 'bn' ? 'এডিটর মোড' : 'Editor Mode')
                : (lang === 'bn' ? 'ভিউয়ার মোড (গ্রাহককে সরাসরি উত্তর দিন)' : 'Viewer Mode (Full Reply Access)')}
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {lang === 'bn'
              ? 'গ্রাহকদের সাথে রিয়েল-টাইমে যোগাযোগ করুন। বার্তাগুলো গুগল অনুবাদের সাহায্যে তাৎক্ষণিকভাবে বাংলা ও ইংরেজিতে অনুবাদ করে উত্তর দিন।'
              : lang === 'zh'
              ? '与客户进行实时会话沟通，借助谷歌翻译轻松在孟加拉语与英语间快速互译并发送解答。'
              : 'Communicate with customers in real time with Google Translate between Bengali and English.'}
          </p>
        </div>

        {/* Audio and Auto-reply controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              soundEnabled
                ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400'
                : 'bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-400'
            }`}
            title="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline text-[11px]">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
          </button>

          <button
            onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              autoReplyEnabled
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
            }`}
            title={autoReplyEnabled ? 'কৃত্রিম স্বয়ংক্রিয় উত্তর চালু আছে' : 'স্বয়ংক্রিয় কৃত্রিম উত্তর বন্ধ আছে'}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>
              {autoReplyEnabled
                ? (lang === 'bn' ? '⚠️ ডেমো সিমুলেটর চালু' : 'Simulator Active')
                : (lang === 'bn' ? '✓ রিয়েল মোড (সিমুলেটর বন্ধ)' : 'Real Mode (Simulator OFF)')}
            </span>
          </button>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[720px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        {/* Left Column: Contacts Directory for Chat */}
        <div className="lg:col-span-4 border-r border-neutral-200 dark:border-neutral-800 flex flex-col h-full bg-neutral-50/40 dark:bg-neutral-950/40">
          <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder={lang === 'bn' ? 'গ্রাহক বা নম্বর খুঁজুন...' : lang === 'zh' ? '搜索客户或号码...' : 'Search leads, numbers...'}
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60">
            {filteredChatContacts.map((contact) => {
              const msgs = chats[contact.id] || [];
              const lastMsg = msgs[msgs.length - 1];
              const isSelected = contact.id === activeContactId;

              return (
                <div
                  key={contact.id}
                  onClick={() => {
                    setActiveContactId(contact.id);
                    onSelectContact?.(contact.id);
                  }}
                  className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/50 border-l-4 border-sky-500'
                      : 'hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-semibold flex items-center justify-center text-xs">
                      {contact.name.slice(0, 2).toUpperCase()}
                    </div>
                    {contact.hasTelegram && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-sky-500 border-2 border-white dark:border-neutral-900 rounded-full" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                        {contact.name}
                      </h4>
                      <span className="text-[10px] text-neutral-400">
                        {lastMsg ? lastMsg.timestamp.slice(11, 16) : '10:42'}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                      {lastMsg ? lastMsg.text : contact.phoneNumber}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {contact.telegramUsername && (
                        <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400">
                          @{contact.telegramUsername}
                        </span>
                      )}
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 uppercase font-semibold">
                        {contact.stage}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Chat Thread & Composer */}
        <div className="lg:col-span-8 flex flex-col h-full bg-white dark:bg-neutral-900">
          {/* Header of Active Chat */}
          {activeContact ? (
            <div className="p-3 sm:px-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold flex items-center justify-center text-sm">
                  {activeContact.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      {activeContact.name}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {lang === 'bn' ? 'সক্রিয়' : 'Online'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    <span className="font-mono">{activeContact.phoneNumber}</span>
                    {activeContact.company && <span>• {activeContact.company}</span>}
                    {activeContact.telegramUsername && (
                      <span className="text-sky-600 dark:text-sky-400 font-mono">
                        @{activeContact.telegramUsername}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Translation Badge */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                <Globe2 className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">Google Translate Live</span>
              </div>
            </div>
          ) : null}

          {/* Context Guidance Banner */}
          <div className="bg-amber-50/90 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-900/60 px-4 py-2 text-[11px] text-amber-900 dark:text-amber-200 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-amber-800 dark:text-amber-300">💡 {lang === 'bn' ? 'নোট:' : 'Notice:'}</span>
              <span>
                {lang === 'bn'
                  ? 'এটি সাপোর্ট ইনবক্স/ডেমো টেস্ট ভিউ। টার্গেটেড নম্বরে বাল্ক মেসেজ পাঠাতে বাম পাশের "Broadcast Campaigns" অথবা ওয়ার্ডপ্রেস প্লাগিনের "🚀 লাইভ সেন্ডার" ব্যবহার করুন।'
                  : 'This is the Support Inbox view. To broadcast live messages to phone numbers, use "Broadcast Campaigns" or the WordPress plugin "Live Sender".'}
              </span>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              autoReplyEnabled
                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/70 dark:text-amber-200'
                : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/70 dark:text-emerald-200'
            }`}>
              {autoReplyEnabled
                ? (lang === 'bn' ? '⚠️ ডেমো অটো-উত্তর চালু' : 'Demo Auto-Reply ON')
                : (lang === 'bn' ? '✓ লাইভ মোড (অটো-উত্তর বন্ধ)' : 'Live Mode (Auto-Reply OFF)')}
            </span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-neutral-50/20 dark:bg-neutral-950/20">
            {currentMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-neutral-400 text-xs">
                <MessageSquare className="w-8 h-8 mb-2 stroke-1" />
                <p>{lang === 'bn' ? 'কোনো মেসেজ নেই। নিচে টাইপ করে বার্তা পাঠানো শুরু করুন।' : 'No messages yet. Send a message below to start chatting.'}</p>
              </div>
            ) : (
              currentMessages.map((msg) => {
                const isAgent = msg.sender === 'agent';
                const isBot = msg.sender === 'bot';
                const trans = messageTranslations[msg.id];

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] font-semibold text-neutral-400">
                        {isAgent ? `${msg.senderName} (${currentUser.role})` : isBot ? 'TelePulse Bot' : activeContact.name}
                      </span>
                      <span className="text-[9px] text-neutral-400">{msg.timestamp.slice(11, 16)}</span>
                    </div>

                    <div
                      className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-sm ${
                        isAgent
                          ? 'bg-sky-600 text-white rounded-br-none'
                          : isBot
                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-100 border border-amber-200 dark:border-amber-800'
                          : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-bl-none border border-neutral-200 dark:border-neutral-700'
                      }`}
                    >
                      <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                      {/* Google Translated block if toggled */}
                      {trans?.loading && (
                        <div className="mt-2 pt-2 border-t border-sky-400/40 dark:border-neutral-600 flex items-center gap-1.5 text-[11px] text-sky-100 dark:text-neutral-300">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>{lang === 'bn' ? 'গুগল অনুবাদ লোড হচ্ছে...' : 'Translating via Google...'}</span>
                        </div>
                      )}

                      {trans && !trans.loading && trans.text && (
                        <div className={`mt-2 pt-2 border-t text-[11px] leading-normal ${
                          isAgent ? 'border-sky-400/50 text-sky-100 bg-sky-700/40' : 'border-neutral-200 dark:border-neutral-700 text-sky-600 dark:text-sky-300 bg-sky-50/50 dark:bg-sky-950/30'
                        } p-2 rounded-lg`}>
                          <div className="flex items-center gap-1 font-semibold text-[10px] mb-0.5">
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            <span>
                              {trans.targetLang === 'bn' ? 'বাংলা অনুবাদ (Google Translate):' : 'English Translation (Google Translate):'}
                            </span>
                          </div>
                          <p>{trans.text}</p>
                        </div>
                      )}

                      {/* Google Translate action button */}
                      <div className="mt-2 flex items-center justify-between gap-2 pt-1 border-t border-black/5 dark:border-white/5">
                        <button
                          type="button"
                          onClick={() => handleTranslateMessage(msg.id, msg.text)}
                          className={`text-[10px] flex items-center gap-1 font-medium transition-colors ${
                            isAgent
                              ? 'text-sky-200 hover:text-white'
                              : 'text-neutral-500 hover:text-sky-600 dark:hover:text-sky-400'
                          }`}
                        >
                          <Languages className="w-3 h-3" />
                          <span>
                            {trans?.text
                              ? trans.targetLang === 'en'
                                ? 'বাংলায় দেখুন (Show in বাংলা)'
                                : 'Show in English'
                              : lang === 'bn'
                              ? 'গুগল অনুবাদ (Translate)'
                              : 'Google Translate'}
                          </span>
                        </button>

                        <div className="flex items-center gap-1 text-[9px] opacity-75">
                          {isAgent && <CheckCheck className="w-3 h-3 text-sky-200" />}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {isCustomerTyping && (
              <div className="flex items-center gap-2 text-xs text-neutral-400 italic">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>{activeContact?.name} {lang === 'bn' ? 'টাইপ করছেন...' : 'is typing...'}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick canned replies */}
          <div className="px-4 py-2 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/40 flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider flex-shrink-0">
              {lang === 'bn' ? 'দ্রুত উত্তর:' : 'Quick Reply:'}
            </span>
            {cannedReplies.map((reply, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setChatInputText(reply)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-sky-400 hover:text-sky-600 dark:hover:text-sky-400 whitespace-nowrap transition-colors flex-shrink-0"
              >
                {reply.slice(0, 36)}...
              </button>
            ))}
          </div>

          {/* Google Translate bar above composer */}
          <div className="px-4 py-2 bg-sky-50/70 dark:bg-sky-950/30 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300 flex items-center gap-1">
                <Languages className="w-3.5 h-3.5 text-sky-500" />
                {lang === 'bn' ? 'গুগল অনুবাদ টুলবার:' : 'Google Translate Bar:'}
              </span>
              <button
                type="button"
                onClick={() => handleTranslateReplyBeforeSend('en')}
                disabled={!chatInputText.trim() || replyTranslating}
                className="text-[10px] font-medium px-2 py-0.5 rounded bg-white dark:bg-neutral-800 border border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900 disabled:opacity-40 transition-colors"
              >
                {replyTranslating ? 'Translating...' : 'বাংলা → English'}
              </button>
              <button
                type="button"
                onClick={() => handleTranslateReplyBeforeSend('bn')}
                disabled={!chatInputText.trim() || replyTranslating}
                className="text-[10px] font-medium px-2 py-0.5 rounded bg-white dark:bg-neutral-800 border border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900 disabled:opacity-40 transition-colors"
              >
                {replyTranslating ? 'অনুবাদ হচ্ছে...' : 'English → বাংলা'}
              </button>
            </div>

            {translatedReplyPreview && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-300">
                  {lang === 'bn' ? 'অনূদিত প্রিভিউ:' : 'Translated Preview:'} &quot;{translatedReplyPreview.text.slice(0, 30)}...&quot;
                </span>
                <button
                  type="button"
                  onClick={handleApplyTranslatedReply}
                  className="text-[10px] px-2 py-0.5 rounded bg-emerald-600 text-white font-semibold hover:bg-emerald-500"
                >
                  {lang === 'bn' ? 'ব্যবহার করুন' : 'Apply'}
                </button>
              </div>
            )}
          </div>

          {/* Message Input Form */}
          <form
            onSubmit={handleSendChatMessage}
            className="p-3 sm:p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2 bg-white dark:bg-neutral-900"
          >
            <input
              type="text"
              value={chatInputText}
              onChange={(e) => setChatInputText(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? `${activeContact ? activeContact.name : 'গ্রাহক'}-কে উত্তর লিখুন (বাংলা বা ইংরেজিতে)...`
                  : `Reply to ${activeContact ? activeContact.name : 'customer'} (English or Bengali)...`
              }
              className="flex-1 px-4 py-2 text-xs sm:text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <button
              type="submit"
              disabled={!chatInputText.trim()}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 flex items-center gap-1.5 transition-all shadow-sm shadow-sky-600/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'পাঠান' : 'Send'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
