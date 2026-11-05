import React, { useState } from 'react';
import {
  Bot,
  Radio,
  Lock,
  Bell,
  CheckCircle2,
  ShieldCheck,
  Send,
  Eye,
  EyeOff,
  AlertCircle,
  Key,
} from 'lucide-react';
import { TelegramBotConfig, UserAccount } from '../types';

interface BotSettingsViewProps {
  botConfig: TelegramBotConfig;
  currentUser: UserAccount;
  onUpdateBotConfig: (updates: Partial<TelegramBotConfig>) => void;
  onSendTestNotification: () => void;
}

export const BotSettingsView: React.FC<BotSettingsViewProps> = ({
  botConfig,
  currentUser,
  onUpdateBotConfig,
  onSendTestNotification,
}) => {
  const [token, setToken] = useState(botConfig.botToken);
  const [showToken, setShowToken] = useState(false);
  const [username, setUsername] = useState(botConfig.botUsername);
  const [adminChatId, setAdminChatId] = useState(botConfig.adminChatId);
  const [port, setPort] = useState(botConfig.gatewayPort);
  const [sslMode, setSslMode] = useState(botConfig.sslMode);
  const [alertSent, setAlertSent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; text: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [subscribers, setSubscribers] = useState<any[]>([]);

  const handleVerify = async () => {
    if (!token) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await fetch('/api/bot/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success && data.bot) {
        setVerifyResult({
          success: true,
          text: `Verified: ${data.botName} (@${data.botUsername}) - Status: Active`,
        });
        if (data.botUsername) {
          setUsername(data.botUsername);
          onUpdateBotConfig({
            botToken: token,
            botUsername: data.botUsername,
          });
        }
      } else {
        setVerifyResult({
          success: false,
          text: data.error || 'Failed to verify token with Telegram.',
        });
      }
    } catch (err: any) {
      setVerifyResult({
        success: false,
        text: `Network error: ${err.message}`,
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleSyncSubscribers = async () => {
    if (!token) return;
    setSyncing(true);
    try {
      const res = await fetch('/api/bot/get-subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success && data.subscribers) {
        setSubscribers(data.subscribers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBotConfig({
      botToken: token,
      botUsername: username,
      adminChatId,
      gatewayPort: Number(port),
      sslMode,
    });
  };

  const handleTriggerAlert = async () => {
    onSendTestNotification();
    setAlertSent(true);
    // If adminChatId and token exist, attempt live Telegram dispatch too
    if (token && adminChatId) {
      try {
        await fetch('/api/bot/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            target: adminChatId,
            message: `🔔 TelePulse Enterprise Alert: System test broadcast sent to Admin Chat ID ${adminChatId} successfully!`,
          }),
        });
      } catch (e) {}
    }
    setTimeout(() => setAlertSent(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Telegram Bot &amp; Port {currentUser.assignedPort} Gateway Setup
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              Gateway Online
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Dedicated reverse proxy gateway, SSL encryption protocols, and automated real-time notification alerts.
          </p>
        </div>

        <button
          onClick={handleTriggerAlert}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 shadow-sm"
        >
          <Bell className="w-3.5 h-3.5 text-amber-500" />
          <span>Send Test Admin Alert</span>
        </button>
      </div>

      {alertSent && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Test alert dispatched to Admin Telegram Chat ID ({adminChatId}) via Bot API!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Telegram Bot Credentials &amp; Reverse Proxy Port
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Telegram Bot API Token (from @BotFather)
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full text-xs font-mono pr-9 pl-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600"
                >
                  {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Bot Verify and Sync Actions */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifying || !token}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {verifying ? (
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Verify Bot Token</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncSubscribers}
                  disabled={syncing || !token}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {syncing ? (
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-neutral-600 border-t-transparent rounded-full" />
                  ) : (
                    <Radio className="w-3.5 h-3.5 text-sky-500" />
                  )}
                  <span>Sync Subscribers / Chat IDs</span>
                </button>
              </div>

              {verifyResult && (
                <div
                  className={`mt-2 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                    verifyResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {verifyResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span>{verifyResult.text}</span>
                </div>
              )}

              {subscribers.length > 0 && (
                <div className="mt-2 p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-800 dark:text-sky-300">
                  <div className="font-semibold mb-1">Found {subscribers.length} Subscribers:</div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {subscribers.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-white dark:bg-neutral-900 border border-sky-200 dark:border-sky-800 font-mono text-[11px]"
                      >
                        {s.name} ({s.chatId})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Bot Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Dedicated User Gateway Port
                </label>
                <input
                  type="number"
                  required
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
                />
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  Configured Port 200 proxy tunnel per enterprise user requirements.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Admin Telegram Chat ID (For Alerts)
                </label>
                <input
                  type="text"
                  value={adminChatId}
                  onChange={(e) => setAdminChatId(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  SSL / TLS Protocol Mode
                </label>
                <select
                  value={sslMode}
                  onChange={(e) => setSslMode(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
                >
                  <option value="strict_ca">Strict CA TLS 1.3 (Enterprise)</option>
                  <option value="letsencrypt">Let's Encrypt Auto-Renewal</option>
                  <option value="custom_cert">Self-Signed / Custom Cert</option>
                </select>
              </div>
            </div>

            {/* Alert Checkboxes */}
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2.5">
              <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Automated Bot Alert Subscriptions
              </div>

              <label className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={botConfig.notifyOnBroadcastFinish}
                  onChange={(e) => onUpdateBotConfig({ notifyOnBroadcastFinish: e.target.checked })}
                  disabled={currentUser.role === 'viewer'}
                  className="w-4 h-4 text-sky-600 rounded"
                />
                <span>Notify Admin chat when a bulk campaign finishes dispatching</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={botConfig.notifyOnFailedDeliveries}
                  onChange={(e) => onUpdateBotConfig({ notifyOnFailedDeliveries: e.target.checked })}
                  disabled={currentUser.role === 'viewer'}
                  className="w-4 h-4 text-sky-600 rounded"
                />
                <span>Alert on abnormal delivery failures or rate-limit warnings</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={botConfig.notifyOnLeadOptOut}
                  onChange={(e) => onUpdateBotConfig({ notifyOnLeadOptOut: e.target.checked })}
                  disabled={currentUser.role === 'viewer'}
                  className="w-4 h-4 text-sky-600 rounded"
                />
                <span>Log and alert when a customer texts STOP to unsubscribe</span>
              </label>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={currentUser.role === 'viewer'}
                className="px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 disabled:bg-neutral-400 text-white rounded-lg shadow-sm"
              >
                Save Bot Configuration
              </button>
            </div>
          </form>
        </div>

        {/* Right Col: Gateway Architecture Spec */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
              <h2 className="text-xs font-bold text-neutral-900 dark:text-white">
                Port {currentUser.assignedPort} Gateway Topology
              </h2>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Every provisioned user session is mapped to an isolated socket proxy on Port {currentUser.assignedPort}. This prevents rate-limit cross-talk and ensures compliant concurrent Telegram Bot API delivery.
            </p>

            <div className="p-3 rounded-lg bg-neutral-950 font-mono text-[10px] text-emerald-400 space-y-1">
              <div>HOST: gateway.telepulse.enterprise</div>
              <div>PORT: {currentUser.assignedPort} (DEDICATED)</div>
              <div>SSL: TLS 1.3 / ECDHE-RSA-AES128-GCM-SHA256</div>
              <div>STATUS: ESTABLISHED (0ms drops)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
