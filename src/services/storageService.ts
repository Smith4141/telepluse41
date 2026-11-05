import {
  Contact,
  Campaign,
  ChatMessage,
  AutoResponseRule,
  WebhookEndpoint,
  WebhookLog,
  WordPressConfig,
  GoogleContactsSync,
  TelegramBotConfig,
  AuditLog,
  CloudFile,
  UserAccount,
  UserRole,
  MTProtoConfig,
} from '../types';
import {
  initialContacts,
  initialCampaigns,
  initialChatMessages,
  initialAutoResponses,
  initialWebhooks,
  initialWebhookLogs,
  initialWordPressConfig,
  initialGoogleSync,
  initialBotConfig,
  initialMTProtoConfig,
  initialCloudFiles,
  initialAuditLogs,
  initialUsers,
} from '../data/mockData';

const STORAGE_KEYS = {
  CONTACTS: 'telepulse_contacts',
  CAMPAIGNS: 'telepulse_campaigns',
  CHATS: 'telepulse_chats',
  AUTO_RESPONSES: 'telepulse_auto_responses',
  WEBHOOKS: 'telepulse_webhooks',
  WEBHOOK_LOGS: 'telepulse_webhook_logs',
  WP_CONFIG: 'telepulse_wp_config',
  GOOGLE_SYNC: 'telepulse_google_sync',
  BOT_CONFIG: 'telepulse_bot_config',
  MTPROTO_CONFIG: 'telepulse_mtproto_config',
  CLOUD_FILES: 'telepulse_cloud_files',
  AUDIT_LOGS: 'telepulse_audit_logs',
  USERS: 'telepulse_users',
  IS_LOGGED_IN: 'telepulse_is_logged_in',
  CURRENT_USER_ID: 'telepulse_current_user_id',
  THEME: 'telepulse_theme',
  LANG: 'telepulse_lang',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Storage save error:', e);
  }
}

export const storageService = {
  getContacts: (): Contact[] => load(STORAGE_KEYS.CONTACTS, initialContacts),
  setContacts: (contacts: Contact[]) => save(STORAGE_KEYS.CONTACTS, contacts),

  getCampaigns: (): Campaign[] => load(STORAGE_KEYS.CAMPAIGNS, initialCampaigns),
  setCampaigns: (campaigns: Campaign[]) => save(STORAGE_KEYS.CAMPAIGNS, campaigns),

  getChats: (): Record<string, ChatMessage[]> => load(STORAGE_KEYS.CHATS, initialChatMessages),
  setChats: (chats: Record<string, ChatMessage[]>) => save(STORAGE_KEYS.CHATS, chats),

  getAutoResponses: (): AutoResponseRule[] => load(STORAGE_KEYS.AUTO_RESPONSES, initialAutoResponses),
  setAutoResponses: (rules: AutoResponseRule[]) => save(STORAGE_KEYS.AUTO_RESPONSES, rules),

  getWebhooks: (): WebhookEndpoint[] => load(STORAGE_KEYS.WEBHOOKS, initialWebhooks),
  setWebhooks: (webhooks: WebhookEndpoint[]) => save(STORAGE_KEYS.WEBHOOKS, webhooks),

  getWebhookLogs: (): WebhookLog[] => load(STORAGE_KEYS.WEBHOOK_LOGS, initialWebhookLogs),
  setWebhookLogs: (logs: WebhookLog[]) => save(STORAGE_KEYS.WEBHOOK_LOGS, logs),

  getWordPressConfig: (): WordPressConfig => load(STORAGE_KEYS.WP_CONFIG, initialWordPressConfig),
  setWordPressConfig: (cfg: WordPressConfig) => save(STORAGE_KEYS.WP_CONFIG, cfg),

  getGoogleSync: (): GoogleContactsSync => load(STORAGE_KEYS.GOOGLE_SYNC, initialGoogleSync),
  setGoogleSync: (sync: GoogleContactsSync) => save(STORAGE_KEYS.GOOGLE_SYNC, sync),

  getBotConfig: (): TelegramBotConfig => load(STORAGE_KEYS.BOT_CONFIG, initialBotConfig),
  setBotConfig: (cfg: TelegramBotConfig) => save(STORAGE_KEYS.BOT_CONFIG, cfg),

  getMTProtoConfig: (): MTProtoConfig => {
    const cfg = load<MTProtoConfig>(STORAGE_KEYS.MTPROTO_CONFIG, initialMTProtoConfig);
    if (!cfg.apiId || cfg.apiId === '29841024') {
      cfg.apiId = '37979808';
      cfg.apiHash = '8ed857b64a55e9aa61468ab6b2fa6240';
      save(STORAGE_KEYS.MTPROTO_CONFIG, cfg);
    }
    return cfg;
  },
  setMTProtoConfig: (cfg: MTProtoConfig) => save(STORAGE_KEYS.MTPROTO_CONFIG, cfg),

  getCloudFiles: (): CloudFile[] => load(STORAGE_KEYS.CLOUD_FILES, initialCloudFiles),
  setCloudFiles: (files: CloudFile[]) => save(STORAGE_KEYS.CLOUD_FILES, files),

  getAuditLogs: (): AuditLog[] => load(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs),
  setAuditLogs: (logs: AuditLog[]) => save(STORAGE_KEYS.AUDIT_LOGS, logs),

  getUsers: (): UserAccount[] => load(STORAGE_KEYS.USERS, initialUsers),
  setUsers: (users: UserAccount[]) => save(STORAGE_KEYS.USERS, users),

  getIsLoggedIn: (): boolean => load(STORAGE_KEYS.IS_LOGGED_IN, true),
  setIsLoggedIn: (val: boolean) => save(STORAGE_KEYS.IS_LOGGED_IN, val),

  getCurrentUserId: (): string => load(STORAGE_KEYS.CURRENT_USER_ID, 'usr_admin'),
  setCurrentUserId: (id: string) => save(STORAGE_KEYS.CURRENT_USER_ID, id),

  getTheme: (): 'dark' | 'light' => load(STORAGE_KEYS.THEME, 'dark'),
  setTheme: (theme: 'dark' | 'light') => save(STORAGE_KEYS.THEME, theme),

  getLanguage: (): string => load(STORAGE_KEYS.LANG, 'en'),
  setLanguage: (lang: string) => save(STORAGE_KEYS.LANG, lang),

  logAction: (action: string, entity: string, details: string, user: UserAccount) => {
    const logs = load(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
    const newLog: AuditLog = {
      id: `aud_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      action,
      entity,
      details,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      ipAddress: '198.51.100.42',
    };
    save(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...logs.slice(0, 49)]);
  },
};

/**
 * RBAC Permission Checker
 * Admins: all privileges
 * Editors: campaigns, phone filter, contacts, chat, templates, cloud files
 * Viewers: read-only on dashboards and analytics (no modification)
 */
export type AppAction =
  | 'manage_users'
  | 'manage_webhooks'
  | 'manage_bot_gateway'
  | 'manage_wordpress_config'
  | 'create_campaign'
  | 'edit_contacts'
  | 'delete_contacts'
  | 'send_live_chat'
  | 'run_phone_filter'
  | 'export_data'
  | 'upload_cloud_files'
  | 'view_analytics';

export function canPerform(role: UserRole, action: AppAction): boolean {
  if (role === 'admin') return true;

  if (role === 'editor') {
    return [
      'create_campaign',
      'edit_contacts',
      'delete_contacts',
      'send_live_chat',
      'run_phone_filter',
      'export_data',
      'upload_cloud_files',
      'view_analytics',
    ].includes(action);
  }

  if (role === 'viewer') {
    return ['view_analytics', 'export_data', 'send_live_chat'].includes(action);
  }

  return false;
}
