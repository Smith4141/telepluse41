import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Tag,
  Phone,
  Mail,
  Building,
  UserCheck,
  AlertTriangle,
  ArrowUpDown,
  MessageSquare,
  Send,
  Bot,
  User,
  Sparkles,
  PhoneCall,
  FolderPlus,
  Layers,
  Zap,
  Check,
  Copy,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { Contact, LeadStage, OptInStatus, UserAccount, GoogleContactsSync, ChatMessage, ContactGroup, TelegramLookupResult } from '../types';
import { exportToExcel, exportToCSV, parseUploadedSpreadsheet, normalizePhoneNumber, batchFilterPhoneNumbers } from '../services/telegramService';
import { translations, SupportedLanguage } from '../translations';
import { storageService } from '../services/storageService';

interface ContactManagerProps {
  contacts: Contact[];
  chats: Record<string, ChatMessage[]>;
  currentUser: UserAccount;
  allUsers: UserAccount[];
  googleSync: GoogleContactsSync;
  lang: SupportedLanguage;
  onAddContact: (contact: Omit<Contact, 'id' | 'createdAt'>) => void;
  onUpdateContact: (id: string, updates: Partial<Contact>) => void;
  onDeleteContact: (id: string) => void;
  onBulkAddContacts: (newContacts: Partial<Contact>[]) => void;
  onTriggerGoogleSync: () => void;
  onSendMessage: (contactId: string, text: string) => void;
  onSimulateCustomerReply: (contactId: string, text: string) => void;
  onNavigateToLiveChat?: (contactId?: string) => void;
  onCreateCampaign?: (campaignData: any) => void;
}

export const ContactManager: React.FC<ContactManagerProps> = ({
  contacts,
  chats,
  currentUser,
  allUsers,
  googleSync,
  lang,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  onBulkAddContacts,
  onTriggerGoogleSync,
  onNavigateToLiveChat,
  onCreateCampaign,
}) => {
  const t = translations[lang] || translations.en;

  // Sub-tabs in Contact Management module:
  // 1. 'directory': Contact List & Table
  // 2. 'groups': Contact Groups (Create & Manage)
  // 3. 'checker': Phone Filter & Telegram Checker
  // 4. 'campaign': Campaign Dispatch
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'groups' | 'checker' | 'campaign'>('directory');

  // Groups state
  const [groups, setGroups] = useState<ContactGroup[]>([
    { id: 'grp_01', name: 'VIP Enterprise Clients', description: 'Priority accounts with high volume Telegram broadcasts', color: '#10b981', createdAt: '2026-03-01' },
    { id: 'grp_02', name: 'Bangladesh E-Commerce', description: 'Dhaka & Chittagong online stores for SMS tracking', color: '#3b82f6', createdAt: '2026-03-05' },
    { id: 'grp_03', name: 'Telegram Verified Active', description: 'Filter-verified numbers with active Telegram profiles', color: '#06b6d4', createdAt: '2026-03-10' },
    { id: 'grp_04', name: 'Wholesale B2B Buyers', description: 'Direct distributors and bulk shipment clients', color: '#8b5cf6', createdAt: '2026-03-12' },
  ]);
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#3b82f6');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedOptIn, setSelectedOptIn] = useState<string>('all');
  const [selectedTelegramFilter, setSelectedTelegramFilter] = useState<'all' | 'verified' | 'unverified'>('all');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState<Contact | null>(null);

  // Form States for Add/Edit
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelegram, setFormTelegram] = useState('');
  const [formStage, setFormStage] = useState<LeadStage>('lead');
  const [formOptIn, setFormOptIn] = useState<OptInStatus>('explicit_opt_in');
  const [formTags, setFormTags] = useState('New Lead');
  const [formGroup, setFormGroup] = useState<string>('VIP Enterprise Clients');
  const [formAgent, setFormAgent] = useState<string>(currentUser.id);

  // CSV/Excel Import State
  const [importFileName, setImportFileName] = useState('');
  const [csvPreviewRows, setCsvPreviewRows] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  // Phone Filter & Telegram Checker sub-module state
  const [checkerRawInput, setCheckerRawInput] = useState(
    `+880 1712 345678\n+880 1819 876543\n+1 (415) 555-2671\n+33 6 12 34 56 78\n+971 50 123 4567\n+880 1911 223344\n+44 7911 123456\nINVALID-NUMBER-00`
  );
  const [checkerIsProcessing, setCheckerIsProcessing] = useState(false);
  const [checkerResults, setCheckerResults] = useState<TelegramLookupResult[]>([]);
  const [checkerFilterTab, setCheckerFilterTab] = useState<'all' | 'telegram' | 'unregistered' | 'invalid'>('all');
  const [checkerTargetGroup, setCheckerTargetGroup] = useState('Telegram Verified Active');
  const [checkerAddSuccess, setCheckerAddSuccess] = useState(false);

  // Campaign launcher sub-module state
  const [campaignName, setCampaignName] = useState('New Contact Group Broadcast');
  const [campaignTargetGroup, setCampaignTargetGroup] = useState('all');
  const [campaignMessage, setCampaignMessage] = useState(
    'আসসালামু আলাইকুম {{name}}, টেলিপালস এন্টারপ্রাইজের নতুন অফারে স্বাগতম! যেকোনো তথ্যের জন্য আমাদের সরাসরি ইনবক্স করুন।'
  );
  const [campaignRate, setCampaignRate] = useState(25);
  const [campaignLaunchedSuccess, setCampaignLaunchedSuccess] = useState(false);

  // Filtered Contacts
  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phoneNumber.includes(searchQuery) ||
      (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.telegramUsername && c.telegramUsername.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStage = selectedStage === 'all' || c.stage === selectedStage;
    const matchesOptIn = selectedOptIn === 'all' || c.optInStatus === selectedOptIn;
    const matchesTelegram =
      selectedTelegramFilter === 'all' ||
      (selectedTelegramFilter === 'verified' && c.hasTelegram) ||
      (selectedTelegramFilter === 'unverified' && !c.hasTelegram);
    const matchesGroup =
      selectedGroupFilter === 'all' ||
      c.group === selectedGroupFilter ||
      (c.tags && c.tags.includes(selectedGroupFilter));

    return matchesSearch && matchesStage && matchesOptIn && matchesTelegram && matchesGroup;
  });

  // Export handlers
  const handleExportExcel = () => {
    const exportRows = filteredContacts.map((c) => ({
      ID: c.id,
      Name: c.name,
      'Phone Number': c.phoneNumber,
      Group: c.group || 'Unassigned',
      'Has Telegram': c.hasTelegram ? 'Yes' : 'No',
      'Telegram Handle': c.telegramUsername ? `@${c.telegramUsername}` : '',
      Company: c.company || '',
      Email: c.email || '',
      'Lead Stage': c.stage,
      Tags: c.tags.join(', '),
      'Opt-In Status': c.optInStatus,
    }));
    exportToExcel(exportRows, `TelePulse_Contacts_${Date.now()}.xlsx`, 'Contacts');
  };

  const handleExportCSV = () => {
    const exportRows = filteredContacts.map((c) => ({
      name: c.name,
      phone: c.phoneNumber,
      group: c.group || '',
      telegram: c.telegramUsername || '',
      company: c.company || '',
      email: c.email || '',
      stage: c.stage,
      tags: c.tags.join(';'),
    }));
    exportToCSV(exportRows, `TelePulse_Contacts_${Date.now()}.csv`);
  };

  // Add Contact Form Submit
  const handleCreateContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { formatted } = normalizePhoneNumber(formPhone);

    onAddContact({
      name: formName,
      phoneNumber: formatted || formPhone,
      company: formCompany,
      email: formEmail,
      telegramUsername: formTelegram ? formTelegram.replace('@', '') : undefined,
      telegramUid: `tg_${Date.now().toString().slice(-8)}`,
      hasTelegram: true,
      telegramStatus: 'active',
      stage: formStage,
      tags: formTags.split(',').map((t) => t.trim()).filter(Boolean),
      group: formGroup,
      optInStatus: formOptIn,
      optInDate: new Date().toISOString().slice(0, 10),
      optInSource: 'Contact Module',
      googleContactSynced: true,
      assignedToAgentId: formAgent,
      notes: 'Added via Contact Management Module.',
    });

    setIsAddModalOpen(false);
    setFormName('');
    setFormPhone('');
    setFormCompany('');
    setFormEmail('');
  };

  // Create Group Submit
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const newG: ContactGroup = {
      id: `grp_${Date.now()}`,
      name: newGroupName.trim(),
      description: newGroupDesc.trim() || 'Custom Contact Group',
      color: newGroupColor,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setGroups((prev) => [...prev, newG]);
    setNewGroupName('');
    setNewGroupDesc('');
    setIsNewGroupModalOpen(false);
  };

  // Run Phone Filter & Telegram Checker
  const handleRunChecker = () => {
    setCheckerIsProcessing(true);
    setCheckerAddSuccess(false);
    setTimeout(() => {
      const lines = checkerRawInput.split('\n');
      const results = batchFilterPhoneNumbers(lines);
      setCheckerResults(results);
      setCheckerIsProcessing(false);
    }, 600);
  };

  // Add Verified Numbers to Contact Group
  const handleAddVerifiedToGroup = () => {
    const verified = checkerResults.filter((r) => r.isValid && r.hasTelegram);
    if (verified.length === 0) return;

    const newContacts: Partial<Contact>[] = verified.map((v, i) => ({
      name: v.profileName || `Contact ${v.countryCode} ${i + 1}`,
      phoneNumber: v.formattedNumber,
      telegramUsername: v.telegramUsername,
      telegramUid: v.telegramUid,
      hasTelegram: true,
      telegramStatus: 'active',
      stage: 'lead',
      group: checkerTargetGroup,
      tags: ['Telegram Filtered', checkerTargetGroup],
      optInStatus: 'explicit_opt_in',
      optInDate: new Date().toISOString().slice(0, 10),
      optInSource: 'Phone Filter & Telegram Checker',
      assignedToAgentId: currentUser.id,
    }));

    onBulkAddContacts(newContacts);
    setCheckerAddSuccess(true);
    setTimeout(() => setCheckerAddSuccess(false), 4000);
  };

  // Launch Campaign from Contacts
  const handleLaunchCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const recipients =
      campaignTargetGroup === 'all'
        ? contacts
        : contacts.filter((c) => c.group === campaignTargetGroup || c.tags.includes(campaignTargetGroup));

    const newCamp = {
      id: `camp_${Date.now()}`,
      name: campaignName,
      messageText: campaignMessage,
      targetSegment: campaignTargetGroup,
      recipientCount: recipients.length || 1,
      sentCount: recipients.length || 1,
      deliveredCount: recipients.length || 1,
      readCount: Math.round((recipients.length || 1) * 0.85),
      clickedCount: Math.round((recipients.length || 1) * 0.4),
      failedCount: 0,
      unsubscribedCount: 0,
      status: 'running',
      sendRatePerSecond: campaignRate,
      tags: [campaignTargetGroup, 'SMS & Telegram'],
    };

    if (onCreateCampaign) {
      onCreateCampaign(newCamp);
    }
    setCampaignLaunchedSuccess(true);
    setTimeout(() => setCampaignLaunchedSuccess(false), 4500);
  };

  return (
    <div className="space-y-5">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-500" />
              <span>{lang === 'bn' ? 'কন্ট্যাক্ট ম্যানেজমেন্ট মডিউল' : lang === 'zh' ? '联系人管理模块' : 'Contact Management Module'}</span>
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
              {lang === 'bn' ? 'গ্রুপ, ফিল্টার ও ক্যাম্পেইন সমন্বিত' : 'Groups, Filter & Campaigns Integrated'}
            </span>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
              currentUser.role === 'admin'
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                : currentUser.role === 'editor'
                ? 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400'
                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
            }`}>
              {currentUser.role === 'admin'
                ? (lang === 'bn' ? 'অ্যাডমিন মোড (সর্বোচ্চ সুবিধা)' : 'Admin Mode')
                : currentUser.role === 'editor'
                ? (lang === 'bn' ? 'এডিটর মোড (SMS, ফিল্টার ও কন্টাক্ট)' : 'Editor Mode')
                : (lang === 'bn' ? 'ভিউয়ার মোড (CRM লিডস)' : 'Viewer Mode')}
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {lang === 'bn'
              ? 'কন্ট্যাক্ট তালিকা পরিচালনা করুন, কন্ট্যাক্ট গ্রুপ তৈরি করুন, ফোন নম্বর ফিল্টার ও টেলিগ্রাম চেকার চালান এবং সরাসরি ক্যাম্পেইন পরিচালনা করুন।'
              : lang === 'zh'
              ? '管理联系人名录、创建并分组管理客群、在模块内运行手机号码筛查与 Telegram 状态验证，并直接一键推送广播营销。'
              : 'Manage contact directory, build contact groups, run phone filter and Telegram checker, and launch broadcast campaigns.'}
          </p>
        </div>

        {/* Live Chat Direct Navigation Link Button */}
        {onNavigateToLiveChat && (
          <button
            onClick={() => onNavigateToLiveChat()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
            <span>{lang === 'bn' ? 'গ্রাহক লাইভ চ্যাট মেনুতে যান' : lang === 'zh' ? '前往在线客服独立菜单' : 'Open Live Chat Menu'}</span>
            <ExternalLink className="w-3 h-3 text-emerald-400 ml-0.5" />
          </button>
        )}
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('directory')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            activeSubTab === 'directory'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? '১. কন্ট্যাক্ট তালিকা ও ডিরেক্টরি' : '1. Contacts Directory'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-700/50 text-sky-100">
            {contacts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('groups')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            activeSubTab === 'groups'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? '২. কন্ট্যাক্ট গ্রুপ (Groups)' : '2. Contact Groups'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
            {groups.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('checker')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            activeSubTab === 'checker'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? '৩. ফোন ফিল্টার ও টেলিগ্রাম চেকার' : '3. Phone Filter & Telegram Checker'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('campaign')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
            activeSubTab === 'campaign'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? '৪. ক্যাম্পেইন পরিচালনা' : '4. Campaign Dispatch'}</span>
        </button>
      </div>

      {/* ==================== SUB-TAB 1: CONTACTS DIRECTORY ==================== */}
      {activeSubTab === 'directory' && (
        <div className="space-y-4">
          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'নাম, ফোন বা গ্রুপ খুঁজুন...' : 'Search contacts, phone, group...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 w-56 sm:w-64"
                />
              </div>

              {/* Group Filter */}
              <select
                value={selectedGroupFilter}
                onChange={(e) => setSelectedGroupFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="all">{lang === 'bn' ? 'সকল গ্রুপ' : 'All Groups'}</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.name}>{g.name}</option>
                ))}
              </select>

              {/* Stage Filter */}
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="all">{lang === 'bn' ? 'সকল স্টেজ' : 'All Stages'}</option>
                <option value="lead">Lead</option>
                <option value="qualified">Qualified</option>
                <option value="opportunity">Opportunity</option>
                <option value="customer">Customer</option>
              </select>

              {/* Telegram Status Filter */}
              <select
                value={selectedTelegramFilter}
                onChange={(e) => setSelectedTelegramFilter(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="all">{lang === 'bn' ? 'সকল টেলিগ্রাম স্ট্যাটাস' : 'All Telegram'}</option>
                <option value="verified">{lang === 'bn' ? 'টেলিগ্রাম সক্রিয়' : 'Verified Active'}</option>
                <option value="unverified">{lang === 'bn' ? 'টেলিগ্রাম নেই' : 'No Telegram'}</option>
              </select>
            </div>

            {/* Buttons: Add Contact, Import, Export */}
            <div className="flex items-center gap-2 flex-wrap">
              {currentUser.role !== 'viewer' && (
                <>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 text-white hover:bg-sky-500 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'নতুন কন্ট্যাক্ট' : 'Add Contact'}</span>
                  </button>

                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                  >
                    <Upload className="w-3.5 h-3.5 text-sky-500" />
                    <span>{lang === 'bn' ? 'ইমপোর্ট CSV' : 'Import'}</span>
                  </button>
                </>
              )}

              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
              >
                <Download className="w-3.5 h-3.5 text-emerald-500" />
                <span>{lang === 'bn' ? 'এক্সেল (.xlsx)' : 'Export'}</span>
              </button>
            </div>
          </div>

          {/* Contacts Table */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-neutral-950/50 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400">
                  <tr>
                    <th className="py-3 px-4 font-semibold">{lang === 'bn' ? 'নাম ও কোম্পানি' : 'Name & Company'}</th>
                    <th className="py-3 px-4 font-semibold">{lang === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}</th>
                    <th className="py-3 px-4 font-semibold">{lang === 'bn' ? 'কন্ট্যাক্ট গ্রুপ' : 'Group'}</th>
                    <th className="py-3 px-4 font-semibold">Telegram</th>
                    <th className="py-3 px-4 font-semibold">{lang === 'bn' ? 'লিড স্টেজ' : 'Stage'}</th>
                    <th className="py-3 px-4 font-semibold text-right">{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                  {filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-neutral-400">
                        {lang === 'bn' ? 'কোনো কন্ট্যাক্ট পাওয়া যায়নি।' : 'No contacts match the filters.'}
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-neutral-900 dark:text-white">{contact.name}</div>
                          {contact.company && (
                            <div className="text-[11px] text-neutral-400">{contact.company}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-neutral-600 dark:text-neutral-300">
                          {contact.phoneNumber}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                            {contact.group || 'VIP Enterprise'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {contact.hasTelegram ? (
                            <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-mono text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>{contact.telegramUsername ? `@${contact.telegramUsername}` : 'Active UID'}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-neutral-400">Unregistered</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                            {contact.stage}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Live Chat Direct Action */}
                            {onNavigateToLiveChat && (
                              <button
                                onClick={() => onNavigateToLiveChat(contact.id)}
                                title="Open Live Chat with this contact"
                                className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {currentUser.role !== 'viewer' && (
                              <>
                                <button
                                  onClick={() => onDeleteContact(contact.id)}
                                  className="p-1.5 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                                  title="Delete Contact"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 2: CONTACT GROUPS ==================== */}
      {activeSubTab === 'groups' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                {lang === 'bn' ? 'কন্ট্যাক্ট গ্রুপ ব্যবস্থাপনা' : 'Contact Groups Management'}
              </h2>
              <p className="text-xs text-neutral-500">
                {lang === 'bn'
                  ? 'গ্রাহকদের নির্দিষ্ট গ্রুপে বিভক্ত করুন এবং এক ক্লিকে টার্গেটেড ব্রডকাস্ট ক্যাম্পেইন চালান।'
                  : 'Organize leads into dedicated groups and launch targeted broadcasts with one click.'}
              </p>
            </div>

            {currentUser.role !== 'viewer' && (
              <button
                onClick={() => setIsNewGroupModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 text-white hover:bg-sky-500 shadow-sm"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'নতুন গ্রুপ তৈরি করুন' : 'Create New Group'}</span>
              </button>
            )}
          </div>

          {/* Group Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {groups.map((grp) => {
              const memberCount = contacts.filter(
                (c) => c.group === grp.name || (c.tags && c.tags.includes(grp.name))
              ).length;

              return (
                <div
                  key={grp.id}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: grp.color }}
                      />
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                        {grp.name}
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      {memberCount} {lang === 'bn' ? 'জন' : 'members'}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                    {grp.description}
                  </p>

                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                    <button
                      onClick={() => {
                        setSelectedGroupFilter(grp.name);
                        setActiveSubTab('directory');
                      }}
                      className="text-sky-600 dark:text-sky-400 font-medium hover:underline"
                    >
                      {lang === 'bn' ? 'কন্ট্যাক্ট দেখুন' : 'View Contacts'}
                    </button>

                    <button
                      onClick={() => {
                        setCampaignTargetGroup(grp.name);
                        setActiveSubTab('campaign');
                      }}
                      className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3" />
                      <span>{lang === 'bn' ? 'ক্যাম্পেইন চালান' : 'Launch Broadcast'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 3: PHONE FILTER & TELEGRAM CHECKER ==================== */}
      {activeSubTab === 'checker' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-sky-500" />
                <span>{lang === 'bn' ? 'ফোন নম্বর ফিল্টার ও টেলিগ্রাম চেকার' : 'Phone Number Filter & Telegram Checker'}</span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {lang === 'bn'
                  ? 'একসাথে একাধিক ফোন নম্বর ইনপুট দিন, টেলিগ্রাম অ্যাকাউন্ট সক্রিয় কি না যাচাই করুন এবং সরাসরি নির্বাচিত কন্ট্যাক্ট গ্রুপে যোগ করুন।'
                  : 'Batch validate numbers, verify Telegram registration, and save verified contacts straight into your groups.'}
              </p>
            </div>

            {/* Input Box */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                {lang === 'bn' ? 'ফোন নম্বর তালিকা (প্রতি লাইনে একটি নম্বর):' : 'Enter Phone Numbers (One per line):'}
              </label>
              <textarea
                rows={5}
                value={checkerRawInput}
                onChange={(e) => setCheckerRawInput(e.target.value)}
                placeholder="+880 1712 345678&#10;+1 415 555 2671&#10;+44 7911 123456"
                className="w-full p-3 font-mono text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunChecker}
                  disabled={checkerIsProcessing || !checkerRawInput.trim()}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checkerIsProcessing ? 'animate-spin' : ''}`} />
                  <span>{checkerIsProcessing ? (lang === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Checking...') : (lang === 'bn' ? 'যাচাই করুন (Run Checker)' : 'Run Telegram Checker')}</span>
                </button>
              </div>

              {checkerResults.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-neutral-500">{lang === 'bn' ? 'সংরক্ষণের গ্রুপ:' : 'Target Group:'}</span>
                  <select
                    value={checkerTargetGroup}
                    onChange={(e) => setCheckerTargetGroup(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.name}>{g.name}</option>
                    ))}
                  </select>

                  <button
                    onClick={handleAddVerifiedToGroup}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 flex items-center gap-1.5 shadow-sm"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'যাচাইকৃত নম্বর গ্রুপে যোগ করুন' : 'Save Verified to Group'}</span>
                  </button>
                </div>
              )}
            </div>

            {checkerAddSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>
                  {lang === 'bn'
                    ? `সফলভাবে যাচাইকৃত কন্ট্যাক্টগুলো "${checkerTargetGroup}" গ্রুপে যুক্ত করা হয়েছে!`
                    : `Verified contacts successfully added to group "${checkerTargetGroup}"!`}
                </span>
              </div>
            )}

            {/* Results Table */}
            {checkerResults.length > 0 && (
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    {lang === 'bn' ? 'যাচাইয়ের ফলাফল:' : 'Lookup Results:'} ({checkerResults.length} {lang === 'bn' ? 'টি নম্বর' : 'numbers'})
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-semibold">
                      {checkerResults.filter((r) => r.hasTelegram).length} Active Telegram
                    </span>
                    <span>•</span>
                    <span className="text-neutral-400">
                      {checkerResults.filter((r) => !r.hasTelegram).length} Unregistered
                    </span>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto border border-neutral-200 dark:border-neutral-800 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50 dark:bg-neutral-950 text-neutral-500">
                      <tr>
                        <th className="py-2.5 px-3">Number</th>
                        <th className="py-2.5 px-3">Country</th>
                        <th className="py-2.5 px-3">Telegram Status</th>
                        <th className="py-2.5 px-3">Telegram Handle / UID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                      {checkerResults.map((r, i) => (
                        <tr key={i} className="hover:bg-neutral-50/50">
                          <td className="py-2 px-3 font-mono font-medium">{r.formattedNumber}</td>
                          <td className="py-2 px-3 uppercase text-neutral-500">{r.countryCode || 'N/A'}</td>
                          <td className="py-2 px-3">
                            {r.hasTelegram ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 w-max">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Active</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
                                Unregistered
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px] text-sky-600">
                            {r.telegramUsername ? `@${r.telegramUsername}` : r.telegramUid || '—'}
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

      {/* ==================== SUB-TAB 4: CAMPAIGN DISPATCH ==================== */}
      {activeSubTab === 'campaign' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-sky-500" />
                <span>{lang === 'bn' ? 'কন্ট্যাক্ট গ্রুপে ক্যাম্পেইন পরিচালনা' : 'Launch Campaign to Contacts'}</span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {lang === 'bn'
                  ? 'টার্গেট কন্ট্যাক্ট গ্রুপ নির্বাচন করুন, বার্তা কাস্টমাইজ করুন এবং সাথে সাথে এসএমএস ও টেলিগ্রাম ব্রডকাস্ট চালু করুন।'
                  : 'Select target group, customize message template with dynamic variables, and launch your campaign.'}
              </p>
            </div>

            <form onSubmit={handleLaunchCampaignSubmit} className="space-y-4 max-w-2xl">
              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {lang === 'bn' ? 'ক্যাম্পেইনের নাম:' : 'Campaign Name:'}
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {lang === 'bn' ? 'টার্গেট কন্ট্যাক্ট গ্রুপ:' : 'Target Contact Group:'}
                </label>
                <select
                  value={campaignTargetGroup}
                  onChange={(e) => setCampaignTargetGroup(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="all">{lang === 'bn' ? 'সকল কন্ট্যাক্ট (All Contacts)' : 'All Contacts'}</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                  <span>{lang === 'bn' ? 'বার্তা লিখুন (Message Body):' : 'Message Body:'}</span>
                  <span className="text-[10px] text-sky-600 font-mono">
                    {lang === 'bn' ? 'ভ্যারিয়েবল: {{name}}, {{phone}}, {{company}}' : 'Tags: {{name}}, {{phone}}, {{company}}'}
                  </span>
                </label>
                <textarea
                  rows={4}
                  value={campaignMessage}
                  onChange={(e) => setCampaignMessage(e.target.value)}
                  className="w-full mt-1 p-3 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {lang === 'bn' ? 'প্রেরণ গতি (মেসেজ/সেকেন্ড):' : 'Speed (msg/sec):'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={campaignRate}
                    onChange={(e) => setCampaignRate(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <div className="text-[11px] text-neutral-500 bg-sky-50 dark:bg-sky-950/40 p-2 rounded-lg border border-sky-200 dark:border-sky-800">
                    {lang === 'bn' ? 'ডেডিকেটেড পোর্ট ২০০ সুরক্ষিত গেটওয়ে সক্রিয়।' : 'Dedicated Port 200 Gateway Active.'}
                  </div>
                </div>
              </div>

              {campaignLaunchedSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>
                    {lang === 'bn'
                      ? 'ক্যাম্পেইন সফলভাবে শুরু হয়েছে! ক্যাম্পেইন ট্যাবে লাইভ প্রগ্রেস দেখুন।'
                      : 'Campaign launched successfully! Live progress tracking active in Campaigns tab.'}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={currentUser.role === 'viewer'}
                className="px-5 py-2.5 rounded-lg text-xs font-bold bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-40 flex items-center gap-2 shadow-sm shadow-sky-600/20"
              >
                <Zap className="w-4 h-4" />
                <span>{lang === 'bn' ? 'ক্যাম্পেইন শুরু করুন (Launch Broadcast)' : 'Launch Broadcast Now'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ADD CONTACT MODAL ==================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              {lang === 'bn' ? 'নতুন কন্ট্যাক্ট যুক্ত করুন' : 'Add New Contact'}
            </h3>

            <form onSubmit={handleCreateContactSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  {lang === 'bn' ? 'পূর্ণ নাম:' : 'Full Name:'}
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  {lang === 'bn' ? 'ফোন নম্বর:' : 'Phone Number:'}
                </label>
                <input
                  type="text"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+8801712345678"
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  {lang === 'bn' ? 'কন্ট্যাক্ট গ্রুপ:' : 'Group:'}
                </label>
                <select
                  value={formGroup}
                  onChange={(e) => setFormGroup(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  Telegram Handle:
                </label>
                <input
                  type="text"
                  value={formTelegram}
                  onChange={(e) => setFormTelegram(e.target.value)}
                  placeholder="@username"
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 text-white hover:bg-sky-500"
                >
                  {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== CREATE GROUP MODAL ==================== */}
      {isNewGroupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              {lang === 'bn' ? 'নতুন কন্ট্যাক্ট গ্রুপ তৈরি করুন' : 'Create Contact Group'}
            </h3>

            <form onSubmit={handleCreateGroup} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  {lang === 'bn' ? 'গ্রুপের নাম:' : 'Group Name:'}
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Bangladesh Wholesale Clients"
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  {lang === 'bn' ? 'বিবরণ:' : 'Description:'}
                </label>
                <input
                  type="text"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="e.g. Regular buyers for bulk updates"
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  {lang === 'bn' ? 'রং (Color Tag):' : 'Color:'}
                </label>
                <div className="flex items-center gap-3 mt-1">
                  {['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setNewGroupColor(col)}
                      className={`w-6 h-6 rounded-full border-2 ${newGroupColor === col ? 'border-black dark:border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsNewGroupModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 text-white hover:bg-sky-500"
                >
                  {lang === 'bn' ? 'গ্রুপ তৈরি করুন' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
