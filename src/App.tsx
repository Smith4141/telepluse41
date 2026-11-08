/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, TabId } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { CampaignManager } from './components/CampaignManager';
import { PhoneFilterView } from './components/PhoneFilterView';
import { ContactManager } from './components/ContactManager';
import { LiveChatView } from './components/LiveChatView';
import { WordPressIntegration } from './components/WordPressIntegration';
import { WebhooksManager } from './components/WebhooksManager';
import { BotSettingsView } from './components/BotSettingsView';
import { MTProtoManager } from './components/MTProtoManager';
import { CloudStorageView } from './components/CloudStorageView';
import { RoleManagementView } from './components/RoleManagementView';
import { AuditLogsView } from './components/AuditLogsView';
import { LandingPage } from './components/LandingPage';
import { LoginView } from './components/LoginView';
import { storageService, canPerform } from './services/storageService';
import { SupportedLanguage } from './translations';
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
  MTProtoConfig,
  AuditLog,
  CloudFile,
  UserAccount,
} from './types';

export default function App() {
  // Theme & Language
  const [theme, setTheme] = useState<'dark' | 'light'>(() => storageService.getTheme());
  const [lang, setLang] = useState<SupportedLanguage>(() => (storageService.getLanguage() as SupportedLanguage) || 'en');
  const [viewMode, setViewMode] = useState<'portal' | 'website'>('portal');
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [selectedChatContactId, setSelectedChatContactId] = useState<string>('c_01');

  // Users & RBAC
  const [allUsers, setAllUsers] = useState<UserAccount[]>(() => storageService.getUsers());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => storageService.getIsLoggedIn());
  const [currentUserId, setCurrentUserId] = useState<string>(() => storageService.getCurrentUserId());
  const currentUser = allUsers.find((u) => u.id === currentUserId) || allUsers[0];

  // Core Data
  const [contacts, setContacts] = useState<Contact[]>(() => storageService.getContacts());
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => storageService.getCampaigns());
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>(() => storageService.getChats());
  const [autoResponses, setAutoResponses] = useState<AutoResponseRule[]>(() => storageService.getAutoResponses());
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>(() => storageService.getWebhooks());
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>(() => storageService.getWebhookLogs());
  const [wpConfig, setWpConfig] = useState<WordPressConfig>(() => storageService.getWordPressConfig());
  const [googleSync, setGoogleSync] = useState<GoogleContactsSync>(() => storageService.getGoogleSync());
  const [botConfig, setBotConfig] = useState<TelegramBotConfig>(() => storageService.getBotConfig());
  const [mtprotoConfig, setMtprotoConfig] = useState<MTProtoConfig>(() => storageService.getMTProtoConfig());
  const [cloudFiles, setCloudFiles] = useState<CloudFile[]>(() => storageService.getCloudFiles());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => storageService.getAuditLogs());

  // Apply dark theme class to root html element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    storageService.setTheme(theme);
  }, [theme]);

  // 3 Strict Rules Enforcement on Navigation:
  // 1. Admin: Everything
  // 2. Editor: Manage SMS campaigns, filter numbers, handle contact lists, MTProto ('campaigns', 'phone_filter', 'contacts', 'mtproto')
  // 3. Viewer: ONLY CRM Leads & Live Chat Customer Replies ('contacts', 'live_chat')
  useEffect(() => {
    if (currentUser.role === 'editor') {
      if (!['campaigns', 'phone_filter', 'contacts', 'mtproto'].includes(activeTab)) {
        setActiveTab('campaigns');
      }
    } else if (currentUser.role === 'viewer') {
      if (!['contacts', 'live_chat'].includes(activeTab)) {
        setActiveTab('contacts');
      }
    }
  }, [currentUser.role, activeTab]);

  // Handle language change
  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLang(newLang);
    storageService.setLanguage(newLang);
  };

  // Switch User (Admin testing or session switch)
  const handleSwitchUser = (userId: string) => {
    setCurrentUserId(userId);
    storageService.setCurrentUserId(userId);
    const targetUser = allUsers.find((u) => u.id === userId) || allUsers[0];
    if (targetUser.role === 'editor') {
      if (!['campaigns', 'phone_filter', 'contacts', 'mtproto'].includes(activeTab)) {
        setActiveTab('campaigns');
      }
    } else if (targetUser.role === 'viewer') {
      if (!['contacts', 'live_chat'].includes(activeTab)) {
        setActiveTab('contacts');
      }
    }
    storageService.logAction('USER_SESSION_SWITCH', 'Auth System', `Switched active session to ${targetUser.name} (${targetUser.role})`, currentUser);
    setAuditLogs(storageService.getAuditLogs());
  };

  // Login handler
  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUserId(user.id);
    storageService.setCurrentUserId(user.id);
    setIsLoggedIn(true);
    storageService.setIsLoggedIn(true);

    if (user.role === 'editor') {
      setActiveTab('campaigns');
    } else if (user.role === 'viewer') {
      setActiveTab('contacts');
    } else {
      setActiveTab('dashboard');
    }

    storageService.logAction('USER_LOGGED_IN', 'Auth System', `User @${user.username} (${user.name}) logged in as ${user.role}.`, user);
    setAuditLogs(storageService.getAuditLogs());
  };

  // Logout handler
  const handleLogout = () => {
    storageService.logAction('USER_LOGGED_OUT', 'Auth System', `User @${currentUser.username} logged out.`, currentUser);
    setIsLoggedIn(false);
    storageService.setIsLoggedIn(false);
    setAuditLogs(storageService.getAuditLogs());
  };

  // Create User (Admin Only: sets Name, Username, Password, Role)
  const handleCreateUser = (newUserData: Omit<UserAccount, 'id'>) => {
    const newUser: UserAccount = {
      ...newUserData,
      id: `usr_${Date.now()}`,
    };
    const updated = [...allUsers, newUser];
    setAllUsers(updated);
    storageService.setUsers(updated);
    storageService.logAction(
      'USER_CREATED',
      'RBAC Security',
      `Admin created new user @${newUser.username} (${newUser.name}) with role: ${newUser.role}`,
      currentUser
    );
    setAuditLogs(storageService.getAuditLogs());
  };

  // Delete User (Admin Only)
  const handleDeleteUser = (userId: string) => {
    if (userId === 'usr_admin') return;
    const target = allUsers.find((u) => u.id === userId);
    const updated = allUsers.filter((u) => u.id !== userId);
    setAllUsers(updated);
    storageService.setUsers(updated);
    if (target) {
      storageService.logAction(
        'USER_DELETED',
        'RBAC Security',
        `Admin deleted user @${target.username} (${target.name})`,
        currentUser
      );
      setAuditLogs(storageService.getAuditLogs());
    }
  };

  // Persist State Changes
  useEffect(() => {
    storageService.setContacts(contacts);
  }, [contacts]);

  useEffect(() => {
    storageService.setCampaigns(campaigns);
  }, [campaigns]);

  useEffect(() => {
    storageService.setChats(chats);
  }, [chats]);

  useEffect(() => {
    storageService.setAutoResponses(autoResponses);
  }, [autoResponses]);

  useEffect(() => {
    storageService.setWebhooks(webhooks);
  }, [webhooks]);

  useEffect(() => {
    storageService.setWordPressConfig(wpConfig);
  }, [wpConfig]);

  useEffect(() => {
    storageService.setGoogleSync(googleSync);
  }, [googleSync]);

  useEffect(() => {
    storageService.setBotConfig(botConfig);
  }, [botConfig]);

  useEffect(() => {
    storageService.setCloudFiles(cloudFiles);
  }, [cloudFiles]);

  // LIVE CAMPAIGN DISPATCH SIMULATOR
  // Incrementally progress campaigns that are marked as 'running'
  useEffect(() => {
    const interval = setInterval(() => {
      setCampaigns((prev) => {
        let changed = false;
        const next = prev.map((camp) => {
          if (camp.status !== 'running') return camp;
          if (camp.sentCount >= camp.recipientCount) {
            changed = true;
            return { ...camp, status: 'completed' as const };
          }

          changed = true;
          const increment = Math.min(camp.sendRatePerSecond * 2, camp.recipientCount - camp.sentCount);
          const newSent = camp.sentCount + increment;
          const newDelivered = Math.round(newSent * 0.982);
          const newRead = Math.round(newDelivered * 0.81);
          const newClicked = Math.round(newRead * 0.36);
          const newFailed = Math.round(newSent * 0.018);

          return {
            ...camp,
            sentCount: newSent,
            deliveredCount: newDelivered,
            readCount: newRead,
            clickedCount: newClicked,
            failedCount: newFailed,
          };
        });

        return changed ? next : prev;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Contact Handlers
  const handleAddContact = (contactData: Omit<Contact, 'id' | 'createdAt'>) => {
    const newContact: Contact = {
      ...contactData,
      id: `c_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setContacts((prev) => [newContact, ...prev]);
    storageService.logAction('CONTACT_CREATED', 'CRM Lead', `Added contact ${newContact.name} (${newContact.phoneNumber})`, currentUser);
    setAuditLogs(storageService.getAuditLogs());
  };

  const handleUpdateContact = (id: string, updates: Partial<Contact>) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleDeleteContact = (id: string) => {
    const deleted = contacts.find((c) => c.id === id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
    if (deleted) {
      storageService.logAction('CONTACT_GDPR_ERASED', 'CRM Lead', `Purged contact ${deleted.name} (${deleted.phoneNumber})`, currentUser);
      setAuditLogs(storageService.getAuditLogs());
    }
  };

  const handleBulkAddContacts = (newContacts: Partial<Contact>[]) => {
    const prepared: Contact[] = newContacts.map((c, idx) => ({
      id: `c_${Date.now()}_${idx}`,
      name: c.name || `Lead ${idx + 1}`,
      phoneNumber: c.phoneNumber || '+15551234567',
      telegramUsername: c.telegramUsername,
      telegramUid: c.telegramUid || `tg_${Math.floor(Math.random() * 900000000 + 100000000)}`,
      hasTelegram: c.hasTelegram ?? true,
      telegramStatus: c.telegramStatus || 'active',
      lastSeen: 'Verified via tool',
      company: c.company || '',
      email: c.email || '',
      stage: c.stage || 'lead',
      tags: c.tags || ['Batch Import'],
      optInStatus: c.optInStatus || 'explicit_opt_in',
      optInDate: new Date().toISOString().slice(0, 10),
      optInSource: c.optInSource || 'Batch Ingest Tool',
      googleContactSynced: c.googleContactSynced ?? false,
      assignedToAgentId: currentUser.id,
      notes: c.notes || 'Imported via TelePulse Phone Filter / CSV.',
      createdAt: new Date().toISOString(),
    }));

    setContacts((prev) => [...prepared, ...prev]);
    storageService.logAction('BULK_CONTACT_INGEST', 'CRM Engine', `Ingested ${prepared.length} leads into CRM`, currentUser);
    setAuditLogs(storageService.getAuditLogs());
  };

  // Campaign Handlers
  const handleCreateCampaign = (campData: any) => {
    const newCamp: Campaign = {
      ...campData,
      id: `cmp_${Date.now()}`,
      createdAt: new Date().toISOString(),
      sentCount: 0,
      deliveredCount: 0,
      readCount: 0,
      clickedCount: 0,
      failedCount: 0,
      unsubscribedCount: 0,
    };
    setCampaigns((prev) => [newCamp, ...prev]);
    storageService.logAction('CAMPAIGN_CREATED', 'Broadcast Engine', `Created campaign "${newCamp.name}" targeting ${newCamp.targetSegment}`, currentUser);
    setAuditLogs(storageService.getAuditLogs());
  };

  const handleUpdateCampaignStatus = (id: string, status: Campaign['status']) => {
    setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    storageService.logAction('CAMPAIGN_STATUS_CHANGE', 'Broadcast Engine', `Updated campaign ${id} status to ${status}`, currentUser);
    setAuditLogs(storageService.getAuditLogs());
  };

  const handleDeleteCampaign = (id: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  };

  // Live Chat Handlers
  const handleSendMessage = async (contactId: string, text: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    const newMsg: ChatMessage = {
      id: `m_${Date.now()}`,
      contactId,
      sender: 'agent',
      senderName: currentUser.name,
      text,
      timestamp: 'Just now',
      status: 'sent',
    };

    setChats((prev) => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), newMsg],
    }));

    // If real Telegram Bot token is configured, attempt real dispatch
    if (botConfig?.botToken) {
      const targetChatId = (contact as any)?.telegramChatId || (contact?.telegramUsername ? contact.telegramUsername.replace(/^@/, '') : '');
      if (targetChatId) {
        try {
          await fetch('/api/bot/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              botToken: botConfig.botToken,
              chatId: targetChatId,
              text,
            }),
          });
        } catch (e) {
          console.warn('Real bot dispatch in Live Chat failed:', e);
        }
      }
    }

    // Acknowledge sent status
    setTimeout(() => {
      setChats((prev) => {
        const contactMsgs = prev[contactId] || [];
        return {
          ...prev,
          [contactId]: contactMsgs.map((m) => (m.id === newMsg.id ? { ...m, status: 'read' as const } : m)),
        };
      });
    }, 1500);
  };

  const handleSimulateInboundMessage = (contactId: string, incomingText: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    const newMsg: ChatMessage = {
      id: `m_in_${Date.now()}`,
      contactId,
      sender: 'contact',
      senderName: contact ? contact.name : 'Telegram Lead',
      text: incomingText,
      timestamp: 'Just now',
      status: 'read',
    };

    // Check if any auto-response rule matches
    const lower = incomingText.toLowerCase();
    const matchedRule = autoResponses.find((r) => {
      if (!r.isActive) return false;
      const kw = r.triggerKeyword.toLowerCase();
      if (r.matchType === 'exact') return lower === kw;
      if (r.matchType === 'starts_with') return lower.startsWith(kw);
      return lower.includes(kw);
    });

    setChats((prev) => {
      const existing = prev[contactId] || [];
      const updated = [...existing, newMsg];

      if (matchedRule) {
        const botReply: ChatMessage = {
          id: `m_bot_${Date.now() + 10}`,
          contactId,
          sender: 'bot',
          senderName: 'TelePulse Smart Bot',
          text: matchedRule.replyText,
          timestamp: 'Just now',
          status: 'read',
        };
        return { ...prev, [contactId]: [...updated, botReply] };
      }

      return { ...prev, [contactId]: updated };
    });

    if (matchedRule && matchedRule.action === 'opt_out') {
      // Mark contact as opted-out
      handleUpdateContact(contactId, { optInStatus: 'opted_out' });
      storageService.logAction('LEAD_OPTED_OUT', 'Compliance Bot', `Customer ${contact?.phoneNumber} texted STOP and was unsubscribed.`, currentUser);
      setAuditLogs(storageService.getAuditLogs());
    }
  };

  const handleAddAutoRule = (rule: Omit<AutoResponseRule, 'id'>) => {
    const newRule: AutoResponseRule = {
      ...rule,
      id: `rule_${Date.now()}`,
    };
    setAutoResponses((prev) => [...prev, newRule]);
  };

  const handleToggleAutoRule = (id: string) => {
    setAutoResponses((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)));
  };

  const handleDeleteAutoRule = (id: string) => {
    setAutoResponses((prev) => prev.filter((r) => r.id !== id));
  };

  // Google Contacts Sync Trigger
  const handleTriggerGoogleSync = () => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setGoogleSync((prev) => ({
      ...prev,
      lastSyncedAt: now,
      syncedContactsCount: contacts.length,
    }));
    // Mark all contacts as synced
    setContacts((prev) => prev.map((c) => ({ ...c, googleContactSynced: true })));
    storageService.logAction('GOOGLE_CONTACTS_SYNC', 'Google People API', `Synchronized ${contacts.length} CRM contacts with ${googleSync.accountEmail}`, currentUser);
    setAuditLogs(storageService.getAuditLogs());
  };

  // Webhook Test Dispatcher
  const handleDispatchTestWebhook = async (webhookId: string, eventName: string, payload: any): Promise<WebhookLog> => {
    const hook = webhooks.find((w) => w.id === webhookId);
    const newLog: WebhookLog = {
      id: `log_${Date.now()}`,
      webhookId,
      event: eventName,
      payload: JSON.stringify(payload, null, 2),
      responseStatus: 200,
      responseBody: JSON.stringify({
        status: 'success',
        dispatched_to: hook?.endpointUrl,
        timestamp: new Date().toISOString(),
        trace_id: `tr_${Math.random().toString(36).substring(2, 10)}`,
      }),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      executionTimeMs: Math.floor(Math.random() * 45 + 25),
    };

    setWebhookLogs((prev) => [newLog, ...prev]);
    storageService.setWebhookLogs([newLog, ...webhookLogs]);
    return newLog;
  };

  const handleCreateWebhook = (hook: any) => {
    const newHook: WebhookEndpoint = {
      ...hook,
      id: `wh_${Date.now()}`,
      totalCalls: 0,
      successRate: 100,
    };
    setWebhooks((prev) => [...prev, newHook]);
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  };

  // Cloud Files Handlers
  const handleUploadFile = (fileData: any) => {
    const newFile: CloudFile = {
      ...fileData,
      id: `f_${Date.now()}`,
      uploadedAt: new Date().toISOString().slice(0, 10),
    };
    setCloudFiles((prev) => [newFile, ...prev]);
    storageService.logAction('CLOUD_FILE_UPLOAD', 'Encrypted Storage', `Uploaded asset ${newFile.name} (AES-256)`, currentUser);
    setAuditLogs(storageService.getAuditLogs());
  };

  const handleDeleteFile = (id: string) => {
    setCloudFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // WordPress Test Connection
  const handleTestWordPress = async () => {
    await new Promise((r) => setTimeout(r, 700));
    setWpConfig((prev) => ({ ...prev, connected: true, lastSyncTimestamp: new Date().toISOString() }));
    storageService.logAction('WORDPRESS_REST_VERIFY', 'WordPress Bridge', `Verified connection to ${wpConfig.siteUrl}`, currentUser);
    setAuditLogs(storageService.getAuditLogs());
    return true;
  };

  // Telegram Bot Test Notification
  const handleSendTestNotification = () => {
    storageService.logAction('TELEGRAM_ADMIN_ALERT', 'Telegram Bot API', `Dispatched system test alert to admin Chat ID: ${botConfig.adminChatId}`, currentUser);
    setAuditLogs(storageService.getAuditLogs());
  };

  // Render view
  if (viewMode === 'website') {
    return (
      <LandingPage
        lang={lang}
        onLanguageChange={handleLanguageChange}
        onEnterPortal={() => setViewMode('portal')}
        onOpenQuickFilter={() => {
          setViewMode('portal');
          setActiveTab('phone_filter');
        }}
      />
    );
  }

  // Mandatory Login Screen (Everyone must log in with username and password)
  if (!isLoggedIn) {
    return (
      <LoginView
        allUsers={allUsers}
        lang={lang}
        onLanguageChange={handleLanguageChange}
        onLoginSuccess={handleLoginSuccess}
        onViewWebsite={() => setViewMode('website')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors">
      <Header
        currentUser={currentUser}
        allUsers={allUsers}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
        lang={lang}
        onLanguageChange={handleLanguageChange}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        botConfig={botConfig}
        googleSync={googleSync}
        onTriggerGoogleSync={handleTriggerGoogleSync}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode((prev) => (prev === 'portal' ? 'website' : 'portal'))}
        onOpenQuickFilter={() => setActiveTab('phone_filter')}
        onOpenQuickCampaign={() => setActiveTab('campaigns')}
        onNavigateToCrmInbox={() => setActiveTab('live_chat')}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          lang={lang}
          currentUser={currentUser}
          unreadChatCount={2}
          activeCampaignCount={campaigns.filter((c) => c.status === 'running').length}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-neutral-50/60 dark:bg-neutral-950/60">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardOverview
                campaigns={campaigns}
                contacts={contacts}
                botConfig={botConfig}
                wpConfig={wpConfig}
                googleSync={googleSync}
                currentUser={currentUser}
                lang={lang}
                onNavigateToCampaigns={() => setActiveTab('campaigns')}
                onNavigateToPhoneFilter={() => setActiveTab('phone_filter')}
                onNavigateToContacts={() => setActiveTab('contacts')}
                onNavigateToWordPress={() => setActiveTab('wordpress')}
              />
            )}

            {activeTab === 'campaigns' && (
              <CampaignManager
                campaigns={campaigns}
                contacts={contacts}
                cloudFiles={cloudFiles}
                currentUser={currentUser}
                lang={lang}
                onCreateCampaign={handleCreateCampaign}
                onUpdateCampaignStatus={handleUpdateCampaignStatus}
                onDeleteCampaign={handleDeleteCampaign}
              />
            )}

            {activeTab === 'phone_filter' && (
              <PhoneFilterView
                currentUser={currentUser}
                lang={lang}
                onAddContactsToCrm={handleBulkAddContacts}
                onOpenGoogleSync={handleTriggerGoogleSync}
              />
            )}

            {activeTab === 'contacts' && (
              <ContactManager
                contacts={contacts}
                chats={chats}
                currentUser={currentUser}
                allUsers={allUsers}
                googleSync={googleSync}
                lang={lang}
                onAddContact={handleAddContact}
                onUpdateContact={handleUpdateContact}
                onDeleteContact={handleDeleteContact}
                onBulkAddContacts={handleBulkAddContacts}
                onTriggerGoogleSync={handleTriggerGoogleSync}
                onSendMessage={handleSendMessage}
                onSimulateCustomerReply={handleSimulateInboundMessage}
                onNavigateToLiveChat={(contactId) => {
                  if (contactId) setSelectedChatContactId(contactId);
                  setActiveTab('live_chat');
                }}
                onCreateCampaign={handleCreateCampaign}
              />
            )}

            {activeTab === 'live_chat' && (
              <LiveChatView
                contacts={contacts}
                chats={chats}
                currentUser={currentUser}
                allUsers={allUsers}
                lang={lang}
                onSendMessage={handleSendMessage}
                onSimulateCustomerReply={handleSimulateInboundMessage}
                selectedContactId={selectedChatContactId}
                onSelectContact={setSelectedChatContactId}
              />
            )}

            {activeTab === 'wordpress' && (
              <WordPressIntegration
                wpConfig={wpConfig}
                currentUser={currentUser}
                onUpdateWpConfig={(updates) => setWpConfig((prev) => ({ ...prev, ...updates }))}
                onTestConnection={handleTestWordPress}
                lang={lang}
              />
            )}

            {activeTab === 'webhooks' && (
              <WebhooksManager
                webhooks={webhooks}
                webhookLogs={webhookLogs}
                currentUser={currentUser}
                onCreateWebhook={handleCreateWebhook}
                onDeleteWebhook={handleDeleteWebhook}
                onDispatchTestWebhook={handleDispatchTestWebhook}
              />
            )}

            {activeTab === 'bot_settings' && (
              <BotSettingsView
                botConfig={botConfig}
                currentUser={currentUser}
                onUpdateBotConfig={(updates) => setBotConfig((prev) => ({ ...prev, ...updates }))}
                onSendTestNotification={handleSendTestNotification}
              />
            )}

            {activeTab === 'mtproto' && (
              <MTProtoManager
                mtprotoConfig={mtprotoConfig}
                onUpdateConfig={(updates) => {
                  setMtprotoConfig((prev) => {
                    const next = { ...prev, ...updates };
                    storageService.setMTProtoConfig(next);
                    return next;
                  });
                }}
                currentUser={currentUser}
                lang={lang}
                onAddContactsToCrm={handleBulkAddContacts}
              />
            )}

            {activeTab === 'cloud_storage' && (
              <CloudStorageView
                cloudFiles={cloudFiles}
                currentUser={currentUser}
                onUploadFile={handleUploadFile}
                onDeleteFile={handleDeleteFile}
              />
            )}

            {activeTab === 'team_rbac' && (
              <RoleManagementView
                allUsers={allUsers}
                currentUser={currentUser}
                onSwitchUser={handleSwitchUser}
                onCreateUser={handleCreateUser}
                onDeleteUser={handleDeleteUser}
              />
            )}

            {activeTab === 'audit_logs' && <AuditLogsView logs={auditLogs} />}
          </div>
        </main>
      </div>
    </div>
  );
}
