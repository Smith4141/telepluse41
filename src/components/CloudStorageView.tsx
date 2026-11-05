import React, { useState } from 'react';
import {
  HardDrive,
  Upload,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  FileCode,
  Download,
  Copy,
  Check,
  Trash2,
  Lock,
} from 'lucide-react';
import { CloudFile, UserAccount } from '../types';

interface CloudStorageViewProps {
  cloudFiles: CloudFile[];
  currentUser: UserAccount;
  onUploadFile: (file: Omit<CloudFile, 'id' | 'uploadedAt'>) => void;
  onDeleteFile: (id: string) => void;
}

export const CloudStorageView: React.FC<CloudStorageViewProps> = ({
  cloudFiles,
  currentUser,
  onUploadFile,
  onDeleteFile,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onUploadFile({
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      url: `https://cdn.telepulse.enterprise/storage/uploads/${file.name}`,
      encrypted: true,
    });
  };

  const handleCopyLink = (file: CloudFile) => {
    navigator.clipboard.writeText(file.url);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Secure Cloud Media &amp; Data Storage
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
              AES-256 Server-Side Encrypted
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Store promotional brochures, video teasers, catalogs, and customer data export backups with high-speed CDN delivery.
          </p>
        </div>

        <label
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg text-white transition-all cursor-pointer ${
            currentUser.role === 'viewer'
              ? 'bg-neutral-400 dark:bg-neutral-700 cursor-not-allowed opacity-60'
              : 'bg-sky-600 hover:bg-sky-500 shadow-sm shadow-sky-600/20'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Asset</span>
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={currentUser.role === 'viewer'}
            className="hidden"
          />
        </label>
      </div>

      {/* Storage Quota Card */}
      <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-900 dark:text-white">
              Enterprise Tenant Storage Quota
            </div>
            <div className="text-[11px] text-neutral-500">
              14.2 GB used of 500 GB high-throughput bandwidth limit
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-40 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-sky-500 rounded-full" style={{ width: '12%' }} />
          </div>
          <span className="text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300">
            12%
          </span>
        </div>
      </div>

      {/* Files List */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Cloud Assets Repository ({cloudFiles.length})
          </h2>
          <div className="flex items-center gap-1 text-[11px] text-emerald-500">
            <Lock className="w-3 h-3" />
            <span>End-to-End Encrypted</span>
          </div>
        </div>

        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {cloudFiles.map((file) => (
            <div
              key={file.id}
              className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                  {file.type.includes('image') ? (
                    <ImageIcon className="w-4 h-4 text-sky-500" />
                  ) : file.type.includes('pdf') ? (
                    <FileText className="w-4 h-4 text-red-500" />
                  ) : (
                    <FileCode className="w-4 h-4 text-purple-500" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                    {file.name}
                  </div>
                  <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5">
                    <span>{formatBytes(file.size)}</span>
                    <span aria-hidden="true">·</span>
                    <span>Uploaded {file.uploadedAt}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-500 font-medium">AES-256</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyLink(file)}
                  className="px-2.5 py-1 text-xs font-medium rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center gap-1 transition-colors"
                >
                  {copiedId === file.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === file.id ? 'Copied Link' : 'Copy CDN URL'}</span>
                </button>

                {currentUser.role !== 'viewer' && (
                  <button
                    onClick={() => onDeleteFile(file.id)}
                    className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"
                    title="Delete File"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
