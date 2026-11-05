import React from 'react';
import { FileText, ShieldCheck, Search, Filter } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditLogsViewProps {
  logs: AuditLog[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Enterprise Audit &amp; Activity Log
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
              Immutable ERP Audit Trail
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Chronological audit records of all broadcast dispatches, batch phone verifications, webhook calls, and user permission updates.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Operator</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Entity</th>
                <th className="py-2.5 px-4">Audit Details</th>
                <th className="py-2.5 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-normal">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                  <td className="py-2.5 px-4 font-mono text-[11px] text-neutral-500">
                    {log.timestamp}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-neutral-900 dark:text-white">
                    {log.userName}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-neutral-700 dark:text-neutral-300">
                    {log.entity}
                  </td>
                  <td className="py-2.5 px-4 text-neutral-600 dark:text-neutral-400 text-[11px]">
                    {log.details}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-neutral-400">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
