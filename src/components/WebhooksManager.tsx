import React, { useState } from 'react';
import {
  Webhook,
  Plus,
  Play,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  Code2,
  Terminal,
  Zap,
  Trash2,
} from 'lucide-react';
import { WebhookEndpoint, WebhookLog, UserAccount } from '../types';

interface WebhooksManagerProps {
  webhooks: WebhookEndpoint[];
  webhookLogs: WebhookLog[];
  currentUser: UserAccount;
  onCreateWebhook: (hook: Omit<WebhookEndpoint, 'id' | 'totalCalls' | 'successRate'>) => void;
  onDeleteWebhook: (id: string) => void;
  onDispatchTestWebhook: (webhookId: string, eventName: string, payload: any) => Promise<WebhookLog>;
}

export const WebhooksManager: React.FC<WebhooksManagerProps> = ({
  webhooks,
  webhookLogs,
  currentUser,
  onCreateWebhook,
  onDeleteWebhook,
  onDispatchTestWebhook,
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedHookForTest, setSelectedHookForTest] = useState<string>(webhooks[0]?.id || 'wh_01');
  const [testEvent, setTestEvent] = useState('order.completed');
  const [testPayloadJson, setTestPayloadJson] = useState(
    JSON.stringify(
      {
        event: 'order.completed',
        customer_name: 'Marcus Vance',
        phone: '+14155552671',
        order_value: 299.0,
        currency: 'USD',
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
  );
  const [testResult, setTestResult] = useState<WebhookLog | null>(null);
  const [testing, setTesting] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // New Hook Form
  const [hookName, setHookName] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [eventsSelected, setEventsSelected] = useState<string[]>([
    'message.sent',
    'contact.created',
  ]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hookName.trim() || !endpointUrl.trim()) return;

    onCreateWebhook({
      name: hookName,
      endpointUrl,
      secretToken: `whsec_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      eventSubscriptions: eventsSelected,
      isActive: true,
    });

    setIsCreateOpen(false);
    setHookName('');
    setEndpointUrl('');
  };

  const handleRunTest = async () => {
    try {
      setTesting(true);
      const parsed = JSON.parse(testPayloadJson);
      const log = await onDispatchTestWebhook(selectedHookForTest, testEvent, parsed);
      setTestResult(log);
    } catch (e) {
      alert('Invalid JSON payload');
    } finally {
      setTesting(false);
    }
  };

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Custom API Webhooks &amp; Automation
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
              HMAC-SHA256 Signed
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Automate bidirectional lead ingests, message delivery notifications, and external CRM syncs.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          disabled={currentUser.role === 'viewer'}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-neutral-400 text-white shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Webhook Endpoint</span>
        </button>
      </div>

      {/* Webhooks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {webhooks.map((hook) => (
          <div
            key={hook.id}
            className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-neutral-900 dark:text-white">
                  {hook.name}
                </span>
                <span className="text-[10px] font-medium text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              </div>

              <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 truncate mt-1">
                {hook.endpointUrl}
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {hook.eventSubscriptions.map((ev) => (
                  <span
                    key={ev}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono"
                  >
                    {ev}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-500 text-[11px]">
                <span>Total Dispatches:</span>
                <span className="font-bold text-neutral-900 dark:text-white">
                  {hook.totalCalls.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-neutral-500 text-[11px]">
                <span>Success Rate:</span>
                <span className="font-bold text-emerald-500">{hook.successRate}%</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => handleCopy(hook.secretToken)}
                  className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                >
                  {copiedToken === hook.secretToken ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedToken === hook.secretToken ? 'Copied' : 'Copy Secret'}</span>
                </button>

                {currentUser.role !== 'viewer' && (
                  <button
                    onClick={() => onDeleteWebhook(hook.id)}
                    className="p-1 text-neutral-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Webhook Simulator */}
      <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-sky-500" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
              Interactive Webhook Tester &amp; Payload Inspector
            </h2>
          </div>
          <span className="text-[11px] text-neutral-400">HTTP POST Simulation</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Target Endpoint
              </label>
              <select
                value={selectedHookForTest}
                onChange={(e) => setSelectedHookForTest(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
              >
                {webhooks.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Event Type
              </label>
              <select
                value={testEvent}
                onChange={(e) => setTestEvent(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
              >
                <option value="order.completed">order.completed (WooCommerce)</option>
                <option value="contact.created">contact.created (Contact Form 7)</option>
                <option value="lead.opt_in">lead.opt_in (GDPR Consent)</option>
                <option value="lead.opt_out">lead.opt_out (STOP Command)</option>
                <option value="broadcast.delivered">broadcast.delivered</option>
              </select>
            </div>

            <button
              onClick={handleRunTest}
              disabled={testing}
              className="w-full py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-neutral-400 text-white text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-colors"
            >
              <Play className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Dispatching...' : 'Dispatch Test Payload'}</span>
            </button>
          </div>

          <div className="md:col-span-8 space-y-2">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              JSON Request Payload
            </label>
            <textarea
              rows={6}
              value={testPayloadJson}
              onChange={(e) => setTestPayloadJson(e.target.value)}
              className="w-full font-mono text-xs p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-950 text-emerald-400 focus:outline-none"
            />

            {testResult && (
              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs space-y-1">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-emerald-500 font-bold">
                    HTTP {testResult.responseStatus} OK
                  </span>
                  <span className="text-neutral-400">{testResult.executionTimeMs}ms latency</span>
                </div>
                <div className="font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
                  Response Body: {testResult.responseBody}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Webhook Execution Logs */}
      <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Recent Webhook Execution Logs
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 text-neutral-400">
              <tr>
                <th className="py-2.5 px-3">Event</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Latency</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Response</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-mono text-[11px]">
              {webhookLogs.map((log) => (
                <tr key={log.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                  <td className="py-2 px-3 text-sky-600 dark:text-sky-400 font-semibold">{log.event}</td>
                  <td className="py-2 px-3 text-emerald-500 font-bold">{log.responseStatus}</td>
                  <td className="py-2 px-3 text-neutral-400">{log.executionTimeMs}ms</td>
                  <td className="py-2 px-3 text-neutral-400">{log.timestamp}</td>
                  <td className="py-2 px-3 text-neutral-600 dark:text-neutral-300 truncate max-w-xs">{log.responseBody}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Create Custom API Webhook</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-neutral-400 hover:text-neutral-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Webhook Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zapier Lead Capture"
                  value={hookName}
                  onChange={(e) => setHookName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Destination URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://hooks.zapier.com/..."
                  value={endpointUrl}
                  onChange={(e) => setEndpointUrl(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg shadow-sm"
                >
                  Save Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
