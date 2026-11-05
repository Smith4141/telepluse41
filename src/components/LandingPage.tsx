import React, { useState } from 'react';
import {
  Send,
  Globe,
  Radio,
  PhoneCall,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  FileSpreadsheet,
  Globe2,
} from 'lucide-react';
import { SupportedLanguage, landingPageTranslations } from '../translations';

interface LandingPageProps {
  onEnterPortal: () => void;
  onOpenQuickFilter: () => void;
  lang?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterPortal,
  onOpenQuickFilter,
  lang = 'en',
  onLanguageChange,
}) => {
  const [audienceSize, setAudienceSize] = useState(25000);
  const [speedPerSec, setSpeedPerSec] = useState(25);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  // Normalize language for landing page to 'en', 'bn', or 'zh'
  const activeLangKey = lang === 'bn' ? 'bn' : lang === 'zh' ? 'zh' : 'en';
  const t = landingPageTranslations[activeLangKey] || landingPageTranslations.en;

  const estimatedMinutes = Math.round((audienceSize / speedPerSec / 60) * 10) / 10;
  const estimatedDelivery = Math.round(audienceSize * 0.984).toLocaleString();

  const languageOptions: { code: SupportedLanguage; label: string; flag: string }[] = [
    { code: 'bn', label: 'বাংলা (Bengali)', flag: '🇧🇩' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'zh', label: '中文 (Chinese)', flag: '🇨🇳' },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-sky-500 selection:text-white">
      {/* Top Navbar */}
      <nav className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500 text-white font-bold shadow-md shadow-sky-500/20">
            <Send className="w-4 h-4 -rotate-12 translate-x-0.5" />
          </div>
          <span className="font-bold text-base sm:text-lg tracking-tight">TelePulse Enterprise</span>
        </div>

        <div className="hidden lg:flex items-center gap-6 text-xs text-neutral-400">
          <a href="#features" className="hover:text-white transition-colors">{t.navFeatures}</a>
          <a href="#wordpress" className="hover:text-white transition-colors">{t.navWordpress}</a>
          <a href="#phone-checker" className="hover:text-white transition-colors">{t.navChecker}</a>
          <a href="#calculator" className="hover:text-white transition-colors">{t.navCalculator}</a>
          <a href="#pricing" className="hover:text-white transition-colors">{t.navPricing}</a>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher for Bengali, English, Chinese */}
          <div className="relative">
            <button
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-neutral-800 bg-neutral-900 hover:border-neutral-700 text-neutral-300 transition-colors"
              title="Change Website Language"
            >
              <Globe2 className="w-3.5 h-3.5 text-sky-400" />
              <span>
                {languageOptions.find((l) => l.code === lang)?.label.split(' ')[0] || 'English'}
              </span>
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-44 rounded-xl border border-neutral-800 bg-neutral-900 shadow-xl py-1 z-50">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-neutral-400 border-b border-neutral-800">
                  Select Language / ভাষা / 语言
                </div>
                {languageOptions.map((opt) => (
                  <button
                    key={opt.code}
                    onClick={() => {
                      if (onLanguageChange) onLanguageChange(opt.code);
                      setIsLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-neutral-800 transition-colors ${
                      lang === opt.code ? 'text-sky-400 font-semibold bg-neutral-800/50' : 'text-neutral-300'
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
            onClick={onOpenQuickFilter}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-700 hover:border-neutral-500 text-neutral-300 transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5 text-sky-400" />
            <span>{t.testCheckerBtn}</span>
          </button>

          <button
            onClick={onEnterPortal}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 transition-all"
          >
            <span>{t.launchConsoleBtn}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-20 pb-16 px-4 sm:px-6 max-w-6xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t.heroBadge}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
          {t.heroTitle}
          <span className="text-sky-400">{t.heroHighlight}</span>
        </h1>

        <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          {t.heroSubtitle}
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onEnterPortal}
            className="w-full sm:w-auto px-6 py-3 text-sm font-semibold rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2"
          >
            <span>{t.openCrmBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenQuickFilter}
            className="w-full sm:w-auto px-6 py-3 text-sm font-semibold rounded-xl border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 transition-all flex items-center justify-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>{t.batchCheckBtn}</span>
          </button>
        </div>

        {/* Live Metrics Ribbon */}
        <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <div className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-900/40">
            <div className="text-2xl font-bold text-white">{t.deliveryRateStat}</div>
            <div className="text-xs text-neutral-400 mt-1">{t.deliveryRateLabel}</div>
          </div>
          <div className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-900/40">
            <div className="text-2xl font-bold text-emerald-400">Port 200</div>
            <div className="text-xs text-neutral-400 mt-1">{t.port200Label}</div>
          </div>
          <div className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-900/40">
            <div className="text-2xl font-bold text-sky-400">Zero Flood 429</div>
            <div className="text-xs text-neutral-400 mt-1">{t.zeroFloodLabel}</div>
          </div>
          <div className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-900/40">
            <div className="text-2xl font-bold text-purple-400">WP REST API</div>
            <div className="text-xs text-neutral-400 mt-1">{t.wpSyncLabel}</div>
          </div>
        </div>
      </section>

      {/* Interactive Dispatch Calculator */}
      <section id="calculator" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="p-6 sm:p-8 rounded-2xl border border-neutral-800 bg-neutral-900/60 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">
              {t.calcTitle}
            </h2>
            <p className="text-xs text-neutral-400 max-w-lg mx-auto">
              {t.calcSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-4">
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span>{t.audienceLabel}</span>
                  <span className="text-sky-400 font-mono text-sm">{audienceSize.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="200000"
                  step="1000"
                  value={audienceSize}
                  onChange={(e) => setAudienceSize(Number(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span>{t.speedLabel}</span>
                  <span className="text-emerald-400 font-mono text-sm">{speedPerSec} msg/sec</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={speedPerSec}
                  onChange={(e) => setSpeedPerSec(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <span className="text-[11px] text-neutral-500 mt-1 block">
                  Port 200 Gateway reverse-proxy queue shield.
                </span>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-950 space-y-4">
              <div className="text-xs font-semibold uppercase text-neutral-400">
                {t.calcResultTitle}
              </div>
              <div className="flex justify-between items-baseline border-b border-neutral-800/80 pb-2">
                <span className="text-xs text-neutral-400">{t.estTimeLabel}</span>
                <span className="text-xl font-bold text-white font-mono">{estimatedMinutes} mins</span>
              </div>
              <div className="flex justify-between items-baseline border-b border-neutral-800/80 pb-2">
                <span className="text-xs text-neutral-400">{t.deliveredLabel}</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">{estimatedDelivery}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-neutral-400">{t.floodLabel}</span>
                <span className="text-sm font-bold text-sky-400 font-mono">0 (Anti-Flood Shield)</span>
              </div>

              <button
                onClick={onEnterPortal}
                className="w-full mt-2 py-2.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors"
              >
                {t.scheduleBtn}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Core Enterprise Modules Breakdown */}
      <section id="features" className="py-16 px-4 sm:px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-white">{t.featuresTitle}</h2>
          <p className="text-xs text-neutral-400 max-w-lg mx-auto">
            {t.featuresSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-3">
            <div className="p-2.5 w-fit rounded-lg bg-sky-500/10 text-sky-400">
              <PhoneCall className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">{t.feat1Title}</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {t.feat1Desc}
            </p>
          </div>

          <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-3">
            <div className="p-2.5 w-fit rounded-lg bg-purple-500/10 text-purple-400">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">{t.feat2Title}</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {t.feat2Desc}
            </p>
          </div>

          <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-3">
            <div className="p-2.5 w-fit rounded-lg bg-emerald-500/10 text-emerald-400">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">{t.feat3Title}</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {t.feat3Desc}
            </p>
          </div>

          <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-3">
            <div className="p-2.5 w-fit rounded-lg bg-amber-500/10 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">{t.feat4Title}</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {t.feat4Desc}
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section id="pricing" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-white">{t.pricingTitle}</h2>
          <p className="text-xs text-neutral-400">
            {t.pricingSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/30 flex flex-col justify-between">
            <div>
              <div className="text-xs uppercase font-bold text-neutral-400">{t.planStarter}</div>
              <div className="text-3xl font-extrabold text-white mt-2">$79<span className="text-xs text-neutral-400 font-normal">{t.perMonth}</span></div>
              <p className="text-xs text-neutral-400 mt-2">For growing WordPress stores and local marketing lists.</p>
              <ul className="text-xs text-neutral-300 space-y-2 mt-4">
                <li>✓ Up to 50,000 monthly messages</li>
                <li>✓ Phone number Telegram checker</li>
                <li>✓ Excel &amp; CSV export/import</li>
                <li>✓ WordPress CF7 webhook sync</li>
              </ul>
            </div>
            <button
              onClick={onEnterPortal}
              className="mt-6 w-full py-2 text-xs font-semibold rounded-lg border border-neutral-700 hover:bg-neutral-800 text-white transition-colors"
            >
              {t.getStarted}
            </button>
          </div>

          <div className="p-6 rounded-2xl border-2 border-sky-500 bg-neutral-900 shadow-xl flex flex-col justify-between relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-sky-500 text-white text-[10px] font-bold uppercase tracking-wider">
              Popular
            </span>
            <div>
              <div className="text-xs uppercase font-bold text-sky-400">{t.planPro}</div>
              <div className="text-3xl font-extrabold text-white mt-2">$249<span className="text-xs text-neutral-400 font-normal">{t.perMonth}</span></div>
              <p className="text-xs text-neutral-400 mt-2">For high-volume brands, agencies, and e-commerce leaders.</p>
              <ul className="text-xs text-neutral-300 space-y-2 mt-4">
                <li>✓ 250,000 monthly messages</li>
                <li>✓ Dedicated Port 200 proxy gateway</li>
                <li>✓ WooCommerce &amp; REST API bridge</li>
                <li>✓ Live Two-Way Chat &amp; Google Translate</li>
                <li>✓ Google Contacts Bi-Directional Sync</li>
                <li>✓ RBAC Team Access (Admin, Editor, Viewer)</li>
              </ul>
            </div>
            <button
              onClick={onEnterPortal}
              className="mt-6 w-full py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors"
            >
              {t.getStarted}
            </button>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/30 flex flex-col justify-between">
            <div>
              <div className="text-xs uppercase font-bold text-neutral-400">{t.planEnterprise}</div>
              <div className="text-3xl font-extrabold text-white mt-2">$699<span className="text-xs text-neutral-400 font-normal">{t.perMonth}</span></div>
              <p className="text-xs text-neutral-400 mt-2">Unlimited dedicated cluster proxies with SLA uptime guarantee.</p>
              <ul className="text-xs text-neutral-300 space-y-2 mt-4">
                <li>✓ 1M+ monthly messages</li>
                <li>✓ Multi-port cluster routing</li>
                <li>✓ Custom HMAC Webhook integrations</li>
                <li>✓ Dedicated account manager</li>
              </ul>
            </div>
            <button
              onClick={onEnterPortal}
              className="mt-6 w-full py-2 text-xs font-semibold rounded-lg border border-neutral-700 hover:bg-neutral-800 text-white transition-colors"
            >
              {t.getStarted}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-900 py-8 px-6 text-center text-xs text-neutral-500">
        <p>© 2026 TelePulse Enterprise CRM &amp; Telegram Bulk Messaging. Designed for seamless WordPress CMS integrations.</p>
      </footer>
    </div>
  );
};
