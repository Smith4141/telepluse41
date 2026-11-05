export type UserRole = 'admin' | 'editor' | 'viewer';

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  department: string;
  assignedPort: number;
}

export type OptInStatus = 'explicit_opt_in' | 'implicit_opt_in' | 'opted_out' | 'dnc_suppressed';

export type LeadStage = 'lead' | 'qualified' | 'contacted' | 'opportunity' | 'customer' | 'churned';

export interface ContactGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string; // E.164 formatted
  telegramUsername?: string;
  telegramUid?: string;
  hasTelegram: boolean;
  telegramStatus: 'active' | 'inactive' | 'unknown';
  lastSeen?: string;
  company?: string;
  email?: string;
  stage: LeadStage;
  tags: string[];
  group?: string;
  optInStatus: OptInStatus;
  optInDate: string;
  optInSource: string;
  googleContactSynced: boolean;
  assignedToAgentId: string;
  notes?: string;
  createdAt: string;
}

export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'completed' | 'paused' | 'failed';
export type CampaignSendingEngine = 'bot_api' | 'mtproto';

export interface Campaign {
  id: string;
  name: string;
  messageText: string;
  mediaUrl?: string;
  mediaType?: 'photo' | 'video' | 'document' | 'none';
  targetSegment: string; // 'all' | 'tag:xxx' | 'stage:xxx' | 'telegram_verified'
  recipientCount: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  clickedCount: number;
  failedCount: number;
  unsubscribedCount: number;
  status: CampaignStatus;
  scheduledTime?: string;
  createdAt: string;
  sendRatePerSecond: number;
  buttonText?: string;
  buttonUrl?: string;
  tags: string[];
  sendingEngine?: CampaignSendingEngine;
  antiBanDelaySeconds?: number;
}

export interface ChatMessage {
  id: string;
  contactId: string;
  sender: 'contact' | 'agent' | 'bot';
  senderName: string;
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  mediaUrl?: string;
  translatedText?: string;
  translatedLang?: string;
}

export interface AutoResponseRule {
  id: string;
  triggerKeyword: string;
  matchType: 'exact' | 'contains' | 'starts_with';
  replyText: string;
  isActive: boolean;
  priority: number;
  action?: 'assign_agent' | 'tag_contact' | 'opt_out';
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  endpointUrl: string;
  secretToken: string;
  eventSubscriptions: string[];
  isActive: boolean;
  totalCalls: number;
  successRate: number;
  lastTriggered?: string;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  event: string;
  payload: string;
  responseStatus: number;
  responseBody: string;
  timestamp: string;
  executionTimeMs: number;
}

export interface WordPressConfig {
  siteUrl: string;
  consumerKey: string;
  consumerSecret: string;
  connected: boolean;
  syncWooCommerceOrders: boolean;
  syncContactForm7: boolean;
  autoBroadcastNewPosts: boolean;
  selectedPostCategories: string[];
  lastSyncTimestamp?: string;
}

export interface GoogleContactsSync {
  connected: boolean;
  accountEmail: string;
  lastSyncedAt?: string;
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number;
  syncedContactsCount: number;
  conflictResolution: 'telepulse_wins' | 'google_wins';
}

export interface TelegramBotConfig {
  botToken: string;
  botUsername: string;
  botName: string;
  webhookUrl: string;
  gatewayPort: number;
  sslMode: 'custom_cert' | 'letsencrypt' | 'strict_ca';
  adminChatId: string;
  notifyOnBroadcastFinish: boolean;
  notifyOnFailedDeliveries: boolean;
  notifyOnLeadOptOut: boolean;
  isConnected: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

export interface CloudFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  url: string;
  encrypted: boolean;
}

export interface TelegramLookupResult {
  phoneNumber: string;
  formattedNumber: string;
  isValid: boolean;
  countryCode: string;
  hasTelegram: boolean;
  telegramUid?: string;
  telegramUsername?: string;
  profileName?: string;
  status: 'active' | 'inactive' | 'unregistered' | 'invalid_format';
  verificationSource: 'Live Bot Query' | 'Direct Gateway API' | 'MTProto Core Protocol';
}

export interface MTProtoAccount {
  id: string;
  firstName: string;
  lastName?: string;
  username?: string;
  phone: string;
  dcId?: number;
  isPremium?: boolean;
}

export interface MTProtoConfig {
  apiId: string;
  apiHash: string;
  phoneNumber: string;
  sessionString: string;
  isConnected: boolean;
  account?: MTProtoAccount;
  antiBanDelaySeconds: number;
  dailyMessageLimit: number;
  messagesSentToday: number;
  lastConnectedAt?: string;
}

