import React, { useState } from 'react';
import {
  PhoneCall,
  Search,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  UserPlus,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { TelegramLookupResult, Contact, UserAccount } from '../types';
import {
  batchFilterPhoneNumbers,
  batchFilterWithMTProto,
  exportToExcel,
  exportToCSV,
  parseUploadedSpreadsheet,
} from '../services/telegramService';
import { translations, SupportedLanguage } from '../translations';

interface PhoneFilterViewProps {
  currentUser: UserAccount;
  lang: SupportedLanguage;
  onAddContactsToCrm: (newContacts: Partial<Contact>[]) => void;
  onOpenGoogleSync: () => void;
}

export const PhoneFilterView: React.FC<PhoneFilterViewProps> = ({
  currentUser,
  lang,
  onAddContactsToCrm,
  onOpenGoogleSync,
}) => {
  const t = translations[lang] || translations.en;

  const [rawInput, setRawInput] = useState<string>(
    `+1 (415) 555-2671\n+33 6 12 34 56 78\n+49 152 01234567\n+971 50 123 4567\n+44 7911 123456\n+81 90 1234 5678\n+52 55 1234 5678\n+966 50 987 6543\n+1 202 555 0143\n+44 7700 900077\n+34 600 123 456\n+1 312 555 7890\n555-NOT-VALID`
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<TelegramLookupResult[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'telegram' | 'unregistered' | 'invalid'>('all');
  const [copied, setCopied] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [useMTProtoEngine, setUseMTProtoEngine] = useState(true);

  const handleRunCheck = async () => {
    setIsProcessing(true);
    setAddedSuccess(false);
    const lines = rawInput.split('\n');
    if (useMTProtoEngine) {
      try {
        const checked = await batchFilterWithMTProto(lines);
        setResults(checked);
      } catch (e) {
        const checked = batchFilterPhoneNumbers(lines);
        setResults(checked);
      } finally {
        setIsProcessing(false);
      }
    } else {
      setTimeout(() => {
        const checked = batchFilterPhoneNumbers(lines);
        setResults(checked);
        setIsProcessing(false);
      }, 700);
    }
  };

  const handleLoadDemoDataset = () => {
    const demo = [
      '+14155550199',
      '+12065550182',
      '+447911123456',
      '+447820998877',
      '+33612345678',
      '+4915201234567',
      '+971501234567',
      '+971559876543',
      '+966509876543',
      '+525512345678',
      '+34600123456',
      '+819012345678',
      '+79161234567',
      '+8613800138000',
      '+5511987654321',
      '+18005550199', // invalid
      '+999999999',
    ].join('\n');
    setRawInput(demo);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const rows = await parseUploadedSpreadsheet(file);
      // Try to find phone column
      const phoneValues: string[] = [];
      for (const row of rows) {
        const val =
          row.phone ||
          row.Phone ||
          row.phoneNumber ||
          row['Phone Number'] ||
          row.mobile ||
          row.Mobile ||
          row.contact ||
          row.tel ||
          Object.values(row)[0];
        if (val) phoneValues.push(String(val));
      }

      if (phoneValues.length > 0) {
        setRawInput(phoneValues.slice(0, 1000).join('\n'));
      }
    } catch (err) {
      console.error('File parsing error:', err);
    } finally {
      setIsProcessing(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleExportExcel = () => {
    const exportData = results.map((r) => ({
      'Raw Input': r.phoneNumber,
      'Formatted E.164': r.formattedNumber,
      'Has Telegram': r.hasTelegram ? 'YES' : 'NO',
      'Telegram Status': r.status,
      'Telegram UID': r.telegramUid || 'N/A',
      'Telegram Handle': r.telegramUsername ? `@${r.telegramUsername}` : 'N/A',
      'Country / Region': r.countryCode,
      'Validation Status': r.isValid ? 'Valid Format' : 'Invalid Format',
      'Verified At': new Date().toISOString(),
    }));

    exportToExcel(exportData, `TelePulse_Telegram_Filter_${Date.now()}.xlsx`, 'Verified_Numbers');
  };

  const handleExportCSV = () => {
    const exportData = results.map((r) => ({
      raw_phone: r.phoneNumber,
      formatted_e164: r.formattedNumber,
      has_telegram: r.hasTelegram,
      status: r.status,
      telegram_uid: r.telegramUid || '',
      telegram_username: r.telegramUsername || '',
      country: r.countryCode,
    }));
    exportToCSV(exportData, `TelePulse_Telegram_Filter_${Date.now()}.csv`);
  };

  const handleAddVerifiedToCRM = () => {
    const verifiedOnly = results.filter((r) => r.hasTelegram);
    const newContacts: Partial<Contact>[] = verifiedOnly.map((r, i) => ({
      name: r.profileName || `Lead ${r.formattedNumber.slice(-4)}`,
      phoneNumber: r.formattedNumber,
      telegramUsername: r.telegramUsername,
      telegramUid: r.telegramUid,
      hasTelegram: true,
      telegramStatus: r.status === 'active' ? 'active' : 'inactive',
      lastSeen: r.status === 'active' ? 'Active recently' : 'Inactive',
      stage: 'lead',
      tags: ['Telegram Verified', 'Batch Filter'],
      optInStatus: 'implicit_opt_in',
      optInDate: new Date().toISOString().slice(0, 10),
      optInSource: 'Phone Filter Tool',
      googleContactSynced: false,
      assignedToAgentId: currentUser.id,
      notes: `Verified via Telegram Port ${currentUser.assignedPort} Gateway.`,
    }));

    onAddContactsToCrm(newContacts);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 3500);
  };

  const handleCopyNumbers = () => {
    const activeTg = results.filter((r) => r.hasTelegram).map((r) => r.formattedNumber).join('\n');
    navigator.clipboard.writeText(activeTg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered view
  const filteredResults = results.filter((r) => {
    if (activeFilter === 'telegram') return r.hasTelegram;
    if (activeFilter === 'unregistered') return r.isValid && !r.hasTelegram;
    if (activeFilter === 'invalid') return !r.isValid;
    return true;
  });

  const totalTested = results.length;
  const activeTelegramCount = results.filter((r) => r.hasTelegram).length;
  const unregisteredCount = results.filter((r) => r.isValid && !r.hasTelegram).length;
  const invalidCount = results.filter((r) => !r.isValid).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {t.phoneFilter}
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
              Live Telegram Gateway API
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Batch verify telephone numbers against Telegram network, detect active accounts, and export verified leads to Excel (.xlsx) or CRM.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenGoogleSync}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
            <span>Google Sync</span>
          </button>
        </div>
      </div>

      {/* Input / Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Textarea & Controls */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <span>Paste Phone Numbers (One per line or comma-separated)</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLoadDemoDataset}
                className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Load Sample Dataset</span>
              </button>
              <label className="cursor-pointer text-[11px] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1">
                <Upload className="w-3 h-3" />
                <span>Import CSV/Excel</span>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            rows={6}
            placeholder="+14155552671&#10;+447911123456&#10;+33612345678"
            className="w-full font-mono text-xs p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUseMTProtoEngine(!useMTProtoEngine)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-lg border transition-colors ${
                  useMTProtoEngine
                    ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 font-semibold'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>{useMTProtoEngine ? 'Engine: ⚡ MTProto Live Query' : 'Engine: Standard Gateway'}</span>
              </button>
              <span className="text-[11px] text-neutral-500">
                {rawInput.split('\n').filter((l) => l.trim().length > 0).length} numbers ready
              </span>
            </div>

            <button
              onClick={handleRunCheck}
              disabled={isProcessing || !rawInput.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-neutral-400 text-white text-xs font-semibold shadow-sm transition-all shadow-sky-600/20"
            >
              <Search className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>{isProcessing ? 'Scanning Telegram Network...' : 'Verify Telegram Numbers Now'}</span>
            </button>
          </div>
        </div>

        {/* Right Col: Quick Summary & Filter Stats */}
        <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Batch Verification Metrics
          </h2>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800/60">
              <span className="text-xs text-neutral-600 dark:text-neutral-400">Total Scanned</span>
              <span className="text-xs font-bold text-neutral-900 dark:text-white">{totalTested}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Active on Telegram
              </span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                {activeTelegramCount} {totalTested > 0 && `(${Math.round((activeTelegramCount / totalTested) * 100)}%)`}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800/60">
              <span className="text-xs text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-neutral-400" />
                No Telegram Account
              </span>
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{unregisteredCount}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/40 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
              <span className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Invalid Format
              </span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{invalidCount}</span>
            </div>
          </div>

          {/* Action triggers */}
          {results.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={handleAddVerifiedToCRM}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add {activeTelegramCount} Telegram Leads to CRM</span>
              </button>

              {addedSuccess && (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 text-center font-medium animate-fade-in">
                  ✓ Contacts successfully saved to TelePulse CRM!
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleExportExcel}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-sky-600" />
                  <span>CSV File</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Verification Results Table */}
      {results.length > 0 && (
        <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                All Numbers ({results.length})
              </button>
              <button
                onClick={() => setActiveFilter('telegram')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeFilter === 'telegram'
                    ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Telegram Active ({activeTelegramCount})
              </button>
              <button
                onClick={() => setActiveFilter('unregistered')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeFilter === 'unregistered'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Unregistered ({unregisteredCount})
              </button>
              <button
                onClick={() => setActiveFilter('invalid')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeFilter === 'invalid'
                    ? 'bg-white dark:bg-neutral-900 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Invalid ({invalidCount})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyNumbers}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Active Numbers'}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Input Number</th>
                  <th className="py-2.5 px-3">Standardized E.164</th>
                  <th className="py-2.5 px-3">Country</th>
                  <th className="py-2.5 px-3">Telegram Status</th>
                  <th className="py-2.5 px-3">Telegram UID / Handle</th>
                  <th className="py-2.5 px-3">Gateway Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-normal">
                {filteredResults.map((r, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-mono text-neutral-600 dark:text-neutral-400">
                      {r.phoneNumber}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-neutral-900 dark:text-white">
                      {r.formattedNumber}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-300">
                      {r.countryCode}
                    </td>
                    <td className="py-2.5 px-3">
                      {r.hasTelegram ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Has Telegram ({r.status})</span>
                        </div>
                      ) : !r.isValid ? (
                        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Invalid Format</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-neutral-500 font-medium">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>No Telegram Account</span>
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-neutral-600 dark:text-neutral-400">
                      {r.hasTelegram ? (
                        <div className="space-y-0.5">
                          {r.telegramUsername && (
                            <span className="text-sky-600 dark:text-sky-400 font-medium">
                              @{r.telegramUsername}
                            </span>
                          )}
                          <div className="text-[10px] text-neutral-400">{r.telegramUid}</div>
                        </div>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-400 text-[11px]">
                      {r.verificationSource}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
