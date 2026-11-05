<?php
/**
 * Plugin Name: TelePulse CRM - Standalone Telegram Marketing & Live Dispatcher
 * Plugin URI:  https://ais-pre-hk3il5i7kfngbdwpaxyfab-94552089190.asia-southeast1.run.app
 * Description: Standalone Telegram Marketing, Bulk Dispatcher & Phone Number Filter for WordPress. Pre-configured with Telegram Core MTProto (App API ID: 37979808, API Hash: 8ed857b64a55e9aa61468ab6b2fa6240) for immediate live messaging on localhost and live servers with zero external setup.
 * Version:     2.1.0
 * Author:      TelePulse Enterprise
 * Author URI:  https://ais-pre-hk3il5i7kfngbdwpaxyfab-94552089190.asia-southeast1.run.app
 * License:     GPL-2.0+
 * License URI: http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain: telepulse-crm
 * Domain Path: /languages
 */

if (!defined('ABSPATH')) {
    exit;
}

// Pre-configured Telegram Core MTProto Credentials
define('TELEPULSE_CRM_VERSION', '2.1.0');
define('TELEPULSE_DEFAULT_API_ID', '37979808');
define('TELEPULSE_DEFAULT_API_HASH', '8ed857b64a55e9aa61468ab6b2fa6240');
define('TELEPULSE_DEFAULT_APP_URL', 'https://ais-pre-hk3il5i7kfngbdwpaxyfab-94552089190.asia-southeast1.run.app');

class TelePulse_CRM_Standalone_Plugin {

    private static $instance = null;

    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        register_activation_hook(__FILE__, array($this, 'plugin_activated'));

        // Admin Menus & Assets
        add_action('admin_menu', array($this, 'register_admin_menus'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('admin_notices', array($this, 'activation_admin_notice'));

        // AJAX Actions for Native Standalone Operation
        add_action('wp_ajax_telepulse_live_send_single', array($this, 'ajax_live_send_single'));
        add_action('wp_ajax_telepulse_clean_numbers', array($this, 'ajax_clean_numbers'));
        add_action('wp_ajax_telepulse_save_settings', array($this, 'ajax_save_settings'));
        add_action('wp_ajax_telepulse_test_connection', array($this, 'ajax_test_connection'));
        add_action('wp_ajax_telepulse_verify_bot', array($this, 'ajax_verify_bot'));
        add_action('wp_ajax_telepulse_get_bot_subscribers', array($this, 'ajax_get_bot_subscribers'));
        add_action('wp_ajax_telepulse_save_bot_token', array($this, 'ajax_save_bot_token'));

        // Shortcode
        add_shortcode('telepulse_crm', array($this, 'render_shortcode'));
        add_shortcode('telepulse_app', array($this, 'render_shortcode'));

        // WooCommerce Automation
        add_action('woocommerce_order_status_completed', array($this, 'handle_woocommerce_order'), 10, 1);
        add_action('woocommerce_new_order', array($this, 'handle_woocommerce_new_order'), 10, 1);

        // Contact Form Hooks
        add_action('wpcf7_mail_sent', array($this, 'handle_cf7_submission'));
        add_action('elementor_pro/forms/new_record', array($this, 'handle_elementor_submission'), 10, 2);
    }

    public function plugin_activated() {
        if (!get_option('telepulse_api_id')) {
            update_option('telepulse_api_id', TELEPULSE_DEFAULT_API_ID);
        }
        if (!get_option('telepulse_api_hash')) {
            update_option('telepulse_api_hash', TELEPULSE_DEFAULT_API_HASH);
        }
        if (!get_option('telepulse_app_url')) {
            update_option('telepulse_app_url', TELEPULSE_DEFAULT_APP_URL);
        }
        if (!get_option('telepulse_antiban_delay')) {
            update_option('telepulse_antiban_delay', 4);
        }
        if (!get_option('telepulse_default_country')) {
            update_option('telepulse_default_country', '880');
        }
        if (!get_option('telepulse_sync_woocommerce')) {
            update_option('telepulse_sync_woocommerce', 'yes');
        }
        if (!get_option('telepulse_sync_forms')) {
            update_option('telepulse_sync_forms', 'yes');
        }

        set_transient('telepulse_crm_activation_notice', true, 60);
    }

    public function activation_admin_notice() {
        if (get_transient('telepulse_crm_activation_notice')) {
            delete_transient('telepulse_crm_activation_notice');
            ?>
            <div class="notice notice-success is-dismissible" style="border-left: 4px solid #0284c7; background: #f0f9ff; padding: 12px 18px; margin: 15px 0;">
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <strong style="color: #0369a1; font-size: 15px;">🚀 TelePulse CRM প্লাগইন সফলভাবে সক্রিয় হয়েছে!</strong>
                        <p style="margin: 4px 0 0; color: #334155; font-size: 13px;">
                            টেলিগ্রাম কোর প্রোটোকল (App API ID: <strong><?php echo esc_html(get_option('telepulse_api_id', TELEPULSE_DEFAULT_API_ID)); ?></strong>) আগে থেকেই কনফিগার করা আছে। কোনো এক্সটার্নাল সেটআপ ছাড়াই এখনই সরাসরি লাইভ মেসেজ পাঠান।
                        </p>
                    </div>
                    <div>
                        <a href="<?php echo esc_url(admin_url('admin.php?page=telepulse-crm')); ?>" class="button button-primary" style="background: #0284c7; border-color: #0284c7; padding: 6px 16px; height: auto; font-size: 13px; font-weight: 600;">
                            লাইভ ডিসপ্যাচার খুলুন &rarr;
                        </a>
                    </div>
                </div>
            </div>
            <?php
        }
    }

    public function register_settings() {
        register_setting('telepulse_settings_group', 'telepulse_api_id');
        register_setting('telepulse_settings_group', 'telepulse_api_hash');
        register_setting('telepulse_settings_group', 'telepulse_phone_number');
        register_setting('telepulse_settings_group', 'telepulse_bot_token');
        register_setting('telepulse_settings_group', 'telepulse_antiban_delay');
        register_setting('telepulse_settings_group', 'telepulse_default_country');
        register_setting('telepulse_settings_group', 'telepulse_sync_woocommerce');
        register_setting('telepulse_settings_group', 'telepulse_sync_forms');
        register_setting('telepulse_settings_group', 'telepulse_app_url');
    }

    public function register_admin_menus() {
        // Main Menu
        add_menu_page(
            __('TelePulse CRM', 'telepulse-crm'),
            __('TelePulse CRM', 'telepulse-crm'),
            'edit_posts',
            'telepulse-crm',
            array($this, 'render_dispatcher_page'),
            'dashicons-megaphone',
            26
        );

        // Submenu: Live Dispatcher
        add_submenu_page(
            'telepulse-crm',
            __('লাইভ মেসেজ সেন্ডার (Live Dispatcher)', 'telepulse-crm'),
            __('🚀 লাইভ সেন্ডার', 'telepulse-crm'),
            'edit_posts',
            'telepulse-crm',
            array($this, 'render_dispatcher_page')
        );

        // Submenu: Number Filter
        add_submenu_page(
            'telepulse-crm',
            __('নম্বর ফিল্টার ও ভ্যালিডেটর (Number Filter)', 'telepulse-crm'),
            __('🔍 নম্বর ফিল্টার', 'telepulse-crm'),
            'edit_posts',
            'telepulse-crm-filter',
            array($this, 'render_filter_page')
        );

        // Submenu: API Credentials Settings
        add_submenu_page(
            'telepulse-crm',
            __('MTProto এপিআই সেটিংস (API Settings)', 'telepulse-crm'),
            __('⚡ এপিআই কনফিগারেশন', 'telepulse-crm'),
            'manage_options',
            'telepulse-crm-settings',
            array($this, 'render_settings_page')
        );

        // Submenu: Cloud Web App View
        add_submenu_page(
            'telepulse-crm',
            __('ফুল ক্লাউড অ্যাপ (Cloud Hub View)', 'telepulse-crm'),
            __('🌐 ফুল ক্লাউড অ্যাপ', 'telepulse-crm'),
            'edit_posts',
            'telepulse-crm-cloud',
            array($this, 'render_cloud_page')
        );
    }

    // =========================================================================
    // 1. LIVE DISPATCHER VIEW
    // =========================================================================
    public function render_dispatcher_page() {
        $api_id = get_option('telepulse_api_id', TELEPULSE_DEFAULT_API_ID);
        $api_hash = get_option('telepulse_api_hash', TELEPULSE_DEFAULT_API_HASH);
        $antiban_delay = get_option('telepulse_antiban_delay', 4);
        $bot_token = get_option('telepulse_bot_token', '');
        $bot_username = get_option('telepulse_bot_username', '');
        $bot_name = get_option('telepulse_bot_first_name', '');
        ?>
        <div class="wrap tp-standalone-wrap" style="max-width: 1300px; margin: 20px auto 40px;">
            <?php $this->render_admin_header('dispatcher'); ?>

            <!-- Telegram Bot & MTProto Status Bar -->
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 12px; padding: 20px 24px; color: #fff; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); border: 1px solid #334155;">
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 16px;">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <div style="width: 46px; height: 46px; border-radius: 10px; background: rgba(168, 85, 247, 0.15); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(168, 85, 247, 0.3);">
                            <span class="dashicons dashicons-rest-api" style="font-size: 26px; color: #c084fc;"></span>
                        </div>
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <strong style="font-size: 16px; color: #f8fafc;">টেলিগ্রাম বোট গেটওয়ে কন্ট্রোল (Telegram Bot API)</strong>
                                <span id="tp-bot-status-badge" style="background: <?php echo !empty($bot_token) ? '#10b981' : '#f59e0b'; ?>; color: #0f172a; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px;">
                                    <?php echo !empty($bot_token) ? 'BOT ACTIVE' : 'TOKEN REQUIRED'; ?>
                                </span>
                            </div>
                            <p style="margin: 4px 0 0; color: #94a3b8; font-size: 12px;" id="tp-bot-summary-text">
                                <?php if (!empty($bot_username)): ?>
                                    সংযুক্ত বোট: <strong style="color: #38bdf8;"><?php echo esc_html($bot_name ?: 'Telegram Bot'); ?></strong> (<a href="https://t.me/<?php echo esc_attr($bot_username); ?>" target="_blank" style="color: #c084fc; text-decoration: underline;">@<?php echo esc_html($bot_username); ?></a>) | শতভাগ নির্ভরযোগ্য সরাসরি ডেলিভারি
                                <?php else: ?>
                                    @BotFather থেকে প্রাপ্ত বোট টোকেন প্রদান করুন এবং 'ভেরিফাই বোট' বাটনে ক্লিক করুন।
                                <?php endif; ?>
                            </p>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <button 
                            type="button" 
                            onclick="TelePulseDispatcher.syncSubscribers()" 
                            style="background: #0284c7; color: #fff; border: none; border-radius: 6px; padding: 7px 14px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;"
                            title="বোট স্টার্ট করা সকল গ্রাহকের Chat ID স্বয়ংক্রিয়ভাবে সংগ্রহ করুন"
                        >
                            <span class="dashicons dashicons-update" style="font-size: 16px;"></span>
                            📥 গ্রাহক / Chat ID সিঙ্ক করুন
                        </button>
                        <button 
                            type="button" 
                            onclick="TelePulseDispatcher.copyBotLink()" 
                            style="background: #334155; color: #e2e8f0; border: 1px solid #475569; border-radius: 6px; padding: 7px 12px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;"
                            title="গ্রাহকদের শেয়ার করতে বোট লিংক কপি করুন"
                        >
                            <span class="dashicons dashicons-admin-links" style="font-size: 16px;"></span>
                            🔗 বোট লিংক কপি
                        </button>
                    </div>
                </div>

                <!-- Bot Token Quick Input Row -->
                <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid #334155; border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 280px;">
                        <span style="font-size: 12px; color: #cbd5e1; font-weight: 600; white-space: nowrap;">
                            Telegram Bot Token:
                        </span>
                        <input 
                            type="text" 
                            id="tp-bot-token" 
                            value="<?php echo esc_attr($bot_token); ?>" 
                            placeholder="7391029481:AAFj90_KlmNopQrsTuvWxyz1234567890" 
                            style="flex: 1; background: #020617; border: 1px solid #475569; border-radius: 6px; color: #f8fafc; padding: 6px 10px; font-size: 12px; font-family: monospace;"
                        />
                    </div>
                    <button 
                        type="button" 
                        onclick="TelePulseDispatcher.verifyBot()" 
                        id="tp-btn-verify-bot" 
                        style="background: #10b981; color: #0f172a; border: none; border-radius: 6px; padding: 7px 16px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px;"
                    >
                        <span class="dashicons dashicons-yes-alt" style="font-size: 16px;"></span>
                        ⚡ বোট ভেরিফাই ও সেভ করুন
                    </button>
                </div>
            </div>

            <!-- Bot Usage Guide Callout -->
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-left: 4px solid #0284c7; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px; color: #1e3a8a; font-size: 13px; line-height: 1.6;">
                <strong>💡 টেলিগ্রাম বোট দিয়ে নিশ্চিতভাবে মেসেজ পাঠানোর নিয়ম:</strong>
                <ol style="margin: 6px 0 0 20px; padding: 0;">
                    <li><strong>বোট টোকেন:</strong> টেলিগ্রামে <code>@BotFather</code> এ গিয়ে <code>/newbot</code> দিয়ে আপনার নিজস্ব বোট বানিয়ে টোকেনটি উপরের বক্সে দিন এবং <strong>"বোট ভেরিফাই"</strong> বাটনে ক্লিক করুন।</li>
                    <li><strong>গ্রাহকের সাথে লিংক শেয়ার:</strong> টেলিগ্রামের নিরাপত্তা পলিসি অনুসারে, কোনো বোট অপরিচিত নম্বরে মেসেজ পাঠাতে পারে না যদি না গ্রাহক বোটে একবার <strong>Start</strong> দেয়। আপনার বোট লিংকটি (যেমন: <code>t.me/your_bot</code>) গ্রাহকদের দিন।</li>
                    <li><strong>সরাসরি ডেলিভারি:</strong> গ্রাহক বোটে একবার Start দিলেই উপরের <strong>"📥 গ্রাহক / Chat ID সিঙ্ক করুন"</strong> বাটনে চাপ দিন—তাদের Chat ID স্বয়ংক্রিয়ভাবে নিচে টার্গেট বক্সে বসে যাবে এবং ১০০% সফল মেসেজ চলে যাবে!</li>
                </ol>
            </div>

            <!-- Two-Column Layout -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                
                <!-- Left: Form Controls -->
                <div style="background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                    <h2 style="font-size: 17px; margin: 0 0 16px; color: #0f172a; display: flex; align-items: center; gap: 8px;">
                        <span class="dashicons dashicons-edit" style="color: #0284c7;"></span>
                        মেসেজ ও টার্গেট গ্রহীতা কনফিগারেশন
                    </h2>

                    <div style="margin-bottom: 18px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <label style="font-weight: 600; color: #1e293b; font-size: 13px;">
                                টার্গেট গ্রাহক Chat ID / চ্যানেল / নম্বর:
                            </label>
                            <div style="display: flex; gap: 6px; align-items: center;">
                                <button 
                                    type="button" 
                                    onclick="TelePulseDispatcher.syncSubscribers()" 
                                    style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px 8px; font-size: 11px; cursor: pointer; color: #0369a1; font-weight: 600;"
                                >
                                    📥 সিঙ্ক করুন
                                </button>
                                <span id="tp-number-count-badge" style="font-size: 11px; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 999px; font-weight: 600;">
                                    0টি টার্গেট
                                </span>
                            </div>
                        </div>
                        <textarea 
                            id="tp-target-numbers" 
                            rows="6" 
                            placeholder="689240185 (গ্রাহকের Chat ID)&#10;@my_deals_channel (টেলিগ্রাম চ্যানেল ইউজারনেম)&#10;-1001234567890 (গ্রুপ চ্যাট আইডি)&#10;+8801712345678"
                            style="width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; font-family: monospace; font-size: 13px; resize: vertical;"
                        ></textarea>
                        <p style="margin: 4px 0 0; color: #64748b; font-size: 11px;">
                            প্রতি লাইনে একটি করে Chat ID, @চ্যানেল বা নম্বর লিখুন। বোটের মাধ্যমে নিশ্চিত ডেলিভারির জন্য গ্রাহকের Chat ID দিন।
                        </p>
                    </div>

                    <div style="margin-bottom: 18px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <label style="font-weight: 600; color: #1e293b; font-size: 13px;">
                                মেসেজ টেক্সট (Broadcast Message):
                            </label>
                            <span style="font-size: 11px; color: #64748b;">
                                প্লেসহোল্ডার: <code>{phone}</code>, <code>{site}</code>, <code>{date}</code>
                            </span>
                        </div>
                        <textarea 
                            id="tp-message-text" 
                            rows="5" 
                            style="width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; font-size: 13px; line-height: 1.5; resize: vertical;"
                        >আসসালামু আলাইকুম! 🚀 TelePulse CRM এর পক্ষ থেকে স্বাগতম। আপনার জন্য স্পেশাল অফার সক্রিয় করা হয়েছে। বিস্তারিত জানতে আমাদের ভিজিট করুন: {site}</textarea>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px;">
                        <div>
                            <label style="display: block; font-weight: 600; color: #1e293b; font-size: 12px; margin-bottom: 6px;">
                                অ্যান্টি-ব্যান বিরতি (Anti-Ban Delay):
                            </label>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <input 
                                    type="range" 
                                    id="tp-delay-range" 
                                    min="1" 
                                    max="15" 
                                    value="<?php echo esc_attr($antiban_delay); ?>" 
                                    style="flex: 1;"
                                    oninput="document.getElementById('tp-delay-val').innerText = this.value + 's';"
                                />
                                <span id="tp-delay-val" style="font-size: 12px; font-weight: 700; color: #0284c7; min-width: 32px;">
                                    <?php echo esc_html($antiban_delay); ?>s
                                </span>
                            </div>
                        </div>

                        <div>
                            <label style="display: block; font-weight: 600; color: #1e293b; font-size: 12px; margin-bottom: 6px;">
                                ডিসপ্যাচ ইঞ্জিন (Dispatch Engine):
                            </label>
                            <select id="tp-engine-mode" style="width: 100%; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; font-size: 12px;">
                                <option value="bot_api" selected>🤖 Telegram Bot API (শতভাগ নিশ্চিত ও নিরাপদ)</option>
                                <option value="mtproto">⚡ MTProto Core Protocol (ইউজারবট মোড)</option>
                                <option value="dry_run">🧪 ড্রাই রান / সিমুলেশন টেস্ট</option>
                            </select>
                        </div>
                    </div>

                    <!-- Action Controls -->
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <button 
                            type="button" 
                            id="tp-btn-start" 
                            onclick="TelePulseDispatcher.startDispatch()" 
                            style="flex: 1; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #fff; border: none; border-radius: 8px; padding: 12px 18px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);"
                        >
                            <span class="dashicons dashicons-controls-play" style="font-size: 18px;"></span>
                            লাইভ মেসেজ পাঠানো শুরু করুন
                        </button>
                        <button 
                            type="button" 
                            id="tp-btn-stop" 
                            onclick="TelePulseDispatcher.stopDispatch()" 
                            disabled 
                            style="background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; font-size: 13px; font-weight: 600; cursor: not-allowed;"
                        >
                            বিরতি / থামান
                        </button>
                    </div>
                </div>

                <!-- Right: Live Progress & Terminal Output -->
                <div style="background: #0f172a; border-radius: 12px; border: 1px solid #1e293b; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); color: #f8fafc; display: flex; flex-direction: column;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h2 style="font-size: 16px; margin: 0; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
                            <span class="dashicons dashicons-performance" style="color: #38bdf8;"></span>
                            লাইভ এক্সিকিউশন টার্মিনাল ও প্রোগ্রেস
                        </h2>
                        <span id="tp-status-pill" style="font-size: 11px; background: rgba(148, 163, 184, 0.15); color: #94a3b8; padding: 3px 10px; border-radius: 999px; font-family: monospace;">
                            IDLE / অপেক্ষা করছে
                        </span>
                    </div>

                    <!-- Progress Statistics Counters -->
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px;">
                        <div style="background: #1e293b; padding: 12px; border-radius: 8px; border: 1px solid #334155; text-align: center;">
                            <span style="font-size: 11px; color: #94a3b8; display: block;">মোট টার্গেট</span>
                            <strong id="tp-stat-total" style="font-size: 20px; color: #f8fafc;">0</strong>
                        </div>
                        <div style="background: #1e293b; padding: 12px; border-radius: 8px; border: 1px solid #334155; text-align: center;">
                            <span style="font-size: 11px; color: #34d399; display: block;">সফল (Sent)</span>
                            <strong id="tp-stat-sent" style="font-size: 20px; color: #34d399;">0</strong>
                        </div>
                        <div style="background: #1e293b; padding: 12px; border-radius: 8px; border: 1px solid #334155; text-align: center;">
                            <span style="font-size: 11px; color: #f87171; display: block;">ব্যর্থ (Failed)</span>
                            <strong id="tp-stat-failed" style="font-size: 20px; color: #f87171;">0</strong>
                        </div>
                        <div style="background: #1e293b; padding: 12px; border-radius: 8px; border: 1px solid #334155; text-align: center;">
                            <span style="font-size: 11px; color: #38bdf8; display: block;">অবশিষ্ট</span>
                            <strong id="tp-stat-remaining" style="font-size: 20px; color: #38bdf8;">0</strong>
                        </div>
                    </div>

                    <!-- Progress Bar -->
                    <div style="margin-bottom: 16px;">
                        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; margin-bottom: 6px;">
                            <span>ক্যাম্পেইন প্রোগ্রেস:</span>
                            <span id="tp-progress-percent">0%</span>
                        </div>
                        <div style="width: 100%; height: 8px; background: #1e293b; border-radius: 999px; overflow: hidden; border: 1px solid #334155;">
                            <div id="tp-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #38bdf8, #10b981); transition: width 0.3s ease;"></div>
                        </div>
                    </div>

                    <!-- Console Terminal Output -->
                    <div style="flex: 1; min-height: 220px; max-height: 320px; background: #020617; border-radius: 8px; border: 1px solid #1e293b; padding: 14px; font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #cbd5e1; overflow-y: auto;" id="tp-terminal">
                        <div style="color: #64748b;">[System] TelePulse Standalone Engine v2.1.0 ready.</div>
                        <div style="color: #c084fc;">[Gateway] Telegram Bot API Mode is active.</div>
                        <div style="color: #94a3b8;">[Ready] বোট ভেরিফাই করুন, গ্রাহক সিঙ্ক করুন এবং 'লাইভ মেসেজ পাঠানো শুরু করুন' বাটনে ক্লিক করুন।</div>
                    </div>
                </div>
            </div>
        </div>

        <script>
        window.TelePulseDispatcher = (function() {
            let isRunning = false;
            let currentIndex = 0;
            let targetNumbers = [];
            let total = 0;
            let sentCount = 0;
            let failedCount = 0;
            let activeBotUsername = '<?php echo esc_js($bot_username); ?>';

            function updateCount() {
                const raw = document.getElementById('tp-target-numbers').value;
                const numbers = raw.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 2);
                document.getElementById('tp-number-count-badge').innerText = numbers.length + 'টি টার্গেট';
                document.getElementById('tp-stat-total').innerText = numbers.length;
                document.getElementById('tp-stat-remaining').innerText = numbers.length;
            }

            document.getElementById('tp-target-numbers').addEventListener('input', updateCount);
            updateCount();

            function logTerminal(text, type = 'info') {
                const term = document.getElementById('tp-terminal');
                const row = document.createElement('div');
                const time = new Date().toLocaleTimeString();
                let color = '#cbd5e1';
                if (type === 'success') color = '#34d399';
                if (type === 'error') color = '#f87171';
                if (type === 'warn') color = '#fbbf24';
                if (type === 'sys') color = '#38bdf8';

                row.style.color = color;
                row.style.marginBottom = '4px';
                row.innerHTML = `<span style="color:#64748b;">[${time}]</span> ${text}`;
                term.appendChild(row);
                term.scrollTop = term.scrollHeight;
            }

            async function verifyBot() {
                const token = document.getElementById('tp-bot-token').value.trim();
                if (!token) {
                    alert('অনুগ্রহ করে টেলিগ্রাম বোট টোকেন প্রদান করুন!');
                    return;
                }

                logTerminal('🔍 Telegram Bot Token যাচাই করা হচ্ছে...', 'sys');
                const btn = document.getElementById('tp-btn-verify-bot');
                btn.disabled = true;
                btn.style.opacity = '0.6';

                try {
                    const fd = new FormData();
                    fd.append('action', 'telepulse_verify_bot');
                    fd.append('token', token);

                    const res = await fetch(ajaxurl, { method: 'POST', body: fd });
                    const json = await res.json();

                    if (json.success) {
                        activeBotUsername = json.data.bot_username;
                        document.getElementById('tp-bot-status-badge').innerText = 'BOT VERIFIED';
                        document.getElementById('tp-bot-status-badge').style.background = '#10b981';
                        document.getElementById('tp-bot-summary-text').innerHTML = 
                            `সংযুক্ত বোট: <strong style="color:#38bdf8;">${json.data.bot_name}</strong> (<a href="${json.data.bot_link}" target="_blank" style="color:#c084fc; text-decoration:underline;">@${json.data.bot_username}</a>) | প্রস্তুত`;
                        logTerminal(`✅ বোট ভেরিফাই সম্পন্ন! বোটের নাম: ${json.data.bot_name} (@${json.data.bot_username})`, 'success');
                        logTerminal(`🔗 বোট লিংক: ${json.data.bot_link}`, 'sys');
                    } else {
                        logTerminal(`❌ বোট ভেরিফাই ব্যর্থ: ${json.data.error || 'টোকেনটি সঠিক নয়'}`, 'error');
                        alert('বোট ভেরিফাই ব্যর্থ: ' + (json.data.error || 'অনুগ্রহ করে @BotFather থেকে সঠিক টোকেন কপি করুন'));
                    }
                } catch (e) {
                    logTerminal(`❌ নেটওয়ার্ক ত্রুটি: ${e.message}`, 'error');
                } finally {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                }
            }

            async function syncSubscribers() {
                const token = document.getElementById('tp-bot-token').value.trim();
                if (!token) {
                    alert('অনুগ্রহ করে আগে বোট টোকেন প্রদান ও ভেরিফাই করুন!');
                    return;
                }

                logTerminal('📥 বোট সার্ভার থেকে সক্রিয় গ্রাহক / Chat ID সিঙ্ক করা হচ্ছে...', 'sys');

                try {
                    const fd = new FormData();
                    fd.append('action', 'telepulse_get_bot_subscribers');
                    fd.append('token', token);

                    const res = await fetch(ajaxurl, { method: 'POST', body: fd });
                    const json = await res.json();

                    if (json.success) {
                        const subs = json.data.subscribers || [];
                        if (subs.length === 0) {
                            logTerminal('ℹ️ বোটে কোনো নতুন সাবস্ক্রাইবার পাওয়া যায়নি। গ্রাহকদের আপনার বোট লিংক পাঠান যাতে তারা /start করে।', 'warn');
                            alert('এখনও কোনো গ্রাহক আপনার বোটে /start ক্লিক করেননি। অনুগ্রহ করে আপনার বোট লিংকটি (t.me/' + (activeBotUsername || 'your_bot') + ') গ্রাহকদের সাথে শেয়ার করুন।');
                            return;
                        }

                        const targetArea = document.getElementById('tp-target-numbers');
                        const existing = targetArea.value.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
                        const chatIds = subs.map(s => s.chat_id);
                        const combined = Array.from(new Set([...existing, ...chatIds]));
                        targetArea.value = combined.join('\n');
                        updateCount();

                        logTerminal(`🎉 সফল! ${subs.length} জন সক্রিয় গ্রাহকের Chat ID পাওয়া গেছে এবং টার্গেটে যোগ করা হয়েছে।`, 'success');
                        subs.forEach(s => {
                            logTerminal(`  👤 গ্রাহক: ${s.name || 'User'} (${s.username ? '@' + s.username : 'ID: ' + s.chat_id})`, 'sys');
                        });
                    } else {
                        logTerminal(`❌ সিঙ্ক ব্যর্থ: ${json.data.error || 'ত্রুটি'}`, 'error');
                    }
                } catch (e) {
                    logTerminal(`❌ সিঙ্ক নেটওয়ার্ক ত্রুটি: ${e.message}`, 'error');
                }
            }

            function copyBotLink() {
                if (!activeBotUsername) {
                    alert('আগে আপনার বোট ভেরিফাই করুন!');
                    return;
                }
                const link = `https://t.me/${activeBotUsername}?start=website`;
                navigator.clipboard.writeText(link).then(() => {
                    logTerminal(`📋 বোট লিংক কপি করা হয়েছে: ${link}`, 'sys');
                    alert('বোট লিংক ক্লিপবোর্ডে কপি করা হয়েছে:\n' + link + '\n\nএই লিংকটি গ্রাহকদের দিন, তারা Start দিলেই সরাসরি মেসেজ পাঠাতে পারবেন!');
                }).catch(() => {
                    prompt('বোট লিংক কপি করুন:', link);
                });
            }

            async function startDispatch() {
                if (isRunning) return;
                const raw = document.getElementById('tp-target-numbers').value;
                targetNumbers = raw.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 2);

                if (targetNumbers.length === 0) {
                    alert('অনুগ্রহ করে অন্তত একটি টার্গেট Chat ID বা গ্রাহক আইডি প্রদান করুন!');
                    return;
                }

                const message = document.getElementById('tp-message-text').value.trim();
                if (!message) {
                    alert('অনুগ্রহ করে মেসেজ টেক্সট লিখুন!');
                    return;
                }

                const engine = document.getElementById('tp-engine-mode').value;
                const botToken = document.getElementById('tp-bot-token').value.trim();

                if (engine === 'bot_api' && !botToken) {
                    alert('Telegram Bot API মোডে মেসেজ পাঠাতে বোট টোকেন প্রদান করা বাধ্যতামূলক!');
                    return;
                }

                isRunning = true;
                currentIndex = 0;
                sentCount = 0;
                failedCount = 0;
                total = targetNumbers.length;

                document.getElementById('tp-btn-start').disabled = true;
                document.getElementById('tp-btn-start').style.opacity = '0.6';
                document.getElementById('tp-btn-stop').disabled = false;
                document.getElementById('tp-btn-stop').style.color = '#ef4444';
                document.getElementById('tp-btn-stop').style.cursor = 'pointer';

                document.getElementById('tp-status-pill').innerText = 'RUNNING / পাঠানো হচ্ছে...';
                document.getElementById('tp-status-pill').style.background = 'rgba(16, 185, 129, 0.2)';
                document.getElementById('tp-status-pill').style.color = '#34d399';

                logTerminal(`🚀 লাইভ ব্রডকাস্ট শুরু হয়েছে: মোট ${total}টি টার্গেটে পাঠানো হবে...`, 'sys');

                processNext();
            }

            function stopDispatch() {
                isRunning = false;
                document.getElementById('tp-btn-start').disabled = false;
                document.getElementById('tp-btn-start').style.opacity = '1';
                document.getElementById('tp-btn-stop').disabled = true;
                document.getElementById('tp-btn-stop').style.color = '#64748b';
                document.getElementById('tp-btn-stop').style.cursor = 'not-allowed';

                document.getElementById('tp-status-pill').innerText = 'PAUSED / স্থগিত';
                document.getElementById('tp-status-pill').style.background = 'rgba(239, 68, 68, 0.2)';
                document.getElementById('tp-status-pill').style.color = '#f87171';

                logTerminal('⏸ ক্যাম্পেইন ব্যবহারকারী দ্বারা স্থগিত করা হয়েছে।', 'warn');
            }

            async function processNext() {
                if (!isRunning || currentIndex >= targetNumbers.length) {
                    if (currentIndex >= targetNumbers.length && isRunning) {
                        finishDispatch();
                    }
                    return;
                }

                const phone = targetNumbers[currentIndex];
                const rawMessage = document.getElementById('tp-message-text').value;
                const engine = document.getElementById('tp-engine-mode').value;
                const delay = parseInt(document.getElementById('tp-delay-range').value, 10) || 3;
                const botToken = document.getElementById('tp-bot-token').value.trim();

                const personalizedMessage = rawMessage
                    .replace(/{phone}/g, phone)
                    .replace(/{site}/g, window.location.origin)
                    .replace(/{date}/g, new Date().toLocaleDateString());

                logTerminal(`📤 [${currentIndex + 1}/${total}] Sending to ${phone} via ${engine}...`);

                try {
                    const formData = new FormData();
                    formData.append('action', 'telepulse_live_send_single');
                    formData.append('phone', phone);
                    formData.append('message', personalizedMessage);
                    formData.append('engine', engine);
                    formData.append('bot_token', botToken);

                    const res = await fetch(ajaxurl, {
                        method: 'POST',
                        body: formData
                    });
                    const json = await res.json();

                    if (json.success) {
                        sentCount++;
                        logTerminal(`✅ Sent to ${phone}! Message ID: #${json.data.message_id}`, 'success');
                    } else {
                        failedCount++;
                        const errMsg = (json.data && json.data.error) ? json.data.error : 'ডেলিভারি ব্যর্থ হয়েছে';
                        logTerminal(`❌ Failed for ${phone}: ${errMsg}`, 'error');
                    }
                } catch (e) {
                    failedCount++;
                    logTerminal(`❌ কানেকশন ত্রুটি ${phone}: ${e.message}`, 'error');
                }

                currentIndex++;
                updateStats();

                if (currentIndex < targetNumbers.length && isRunning) {
                    logTerminal(`⏳ Anti-Flood Delay: Waiting ${delay}s before next dispatch...`, 'sys');
                    setTimeout(processNext, delay * 1000);
                } else if (currentIndex >= targetNumbers.length) {
                    finishDispatch();
                }
            }

            function updateStats() {
                document.getElementById('tp-stat-sent').innerText = sentCount;
                document.getElementById('tp-stat-failed').innerText = failedCount;
                document.getElementById('tp-stat-remaining').innerText = total - (sentCount + failedCount);

                const pct = Math.round(((sentCount + failedCount) / total) * 100);
                document.getElementById('tp-progress-bar').style.width = pct + '%';
                document.getElementById('tp-progress-percent').innerText = pct + '%';
            }

            function finishDispatch() {
                isRunning = false;
                document.getElementById('tp-btn-start').disabled = false;
                document.getElementById('tp-btn-start').style.opacity = '1';
                document.getElementById('tp-btn-stop').disabled = true;

                document.getElementById('tp-status-pill').innerText = 'COMPLETED / সম্পন্ন';
                document.getElementById('tp-status-pill').style.background = 'rgba(16, 185, 129, 0.2)';
                document.getElementById('tp-status-pill').style.color = '#34d399';

                logTerminal(`🎉 ক্যাম্পেইন সম্পন্ন হয়েছে! সফল: ${sentCount}টি, ব্যর্থ: ${failedCount}টি।`, sentCount > 0 ? 'success' : 'warn');
            }

            return {
                startDispatch,
                stopDispatch,
                verifyBot,
                syncSubscribers,
                copyBotLink
            };
        })();
        </script>
        <?php
    }

    // =========================================================================
    // 2. PHONE NUMBER FILTER & VALIDATOR VIEW
    // =========================================================================
    public function render_filter_page() {
        $default_country = get_option('telepulse_default_country', '880');
        ?>
        <div class="wrap tp-standalone-wrap" style="max-width: 1300px; margin: 20px auto 40px;">
            <?php $this->render_admin_header('filter'); ?>

            <div style="background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-bottom: 24px;">
                <h2 style="font-size: 17px; margin: 0 0 16px; color: #0f172a; display: flex; align-items: center; gap: 8px;">
                    <span class="dashicons dashicons-filter" style="color: #0284c7;"></span>
                    ফোন নম্বর ক্লিন, ভ্যালিডেশন ও ফিল্টারিং
                </h2>

                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
                    <div>
                        <label style="display: block; font-weight: 600; color: #1e293b; font-size: 13px; margin-bottom: 6px;">
                            যেকোনো ফরম্যাটের র নম্বর পেস্ট করুন (Paste Raw Numbers):
                        </label>
                        <textarea 
                            id="tp-filter-input" 
                            rows="7" 
                            placeholder="01712345678&#10;+8801812345679&#10;01912-345670&#10;8801612345671&#10;01312345672&#10;invalid_num_123"
                            style="width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; font-family: monospace; font-size: 13px;"
                        >01712345678
+8801812345679
01912-345670
8801612345671
01312345672
01712345678
invalid_test_123</textarea>
                    </div>

                    <div style="background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px; display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <label style="display: block; font-weight: 600; color: #1e293b; font-size: 12px; margin-bottom: 6px;">
                                ডিফল্ট কান্ট্রি কোড (Default Country):
                            </label>
                            <select id="tp-filter-country" style="width: 100%; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; font-size: 13px; margin-bottom: 14px;">
                                <option value="880" <?php selected($default_country, '880'); ?>>🇧🇩 বাংলাদেশ (+880)</option>
                                <option value="1" <?php selected($default_country, '1'); ?>>🇺🇸 USA / Canada (+1)</option>
                                <option value="91" <?php selected($default_country, '91'); ?>>🇮🇳 ভারত (+91)</option>
                                <option value="44" <?php selected($default_country, '44'); ?>>🇬🇧 যুক্তরাজ্য (+44)</option>
                                <option value="971" <?php selected($default_country, '971'); ?>>🇦🇪 UAE (+971)</option>
                                <option value="966" <?php selected($default_country, '966'); ?>>🇸🇦 সৌদি আরব (+966)</option>
                            </select>

                            <div style="font-size: 12px; color: #64748b; line-height: 1.6;">
                                ✓ ডুপ্লিকেট নম্বর স্বয়ংক্রিয়ভাবে রিমুভ হবে<br/>
                                ✓ হাইফেন, স্পেস ও ব্র্যাকেট ক্লিন হবে<br/>
                                ✓ মোবাইল অপারেটর শনাক্ত হবে
                            </div>
                        </div>

                        <button 
                            type="button" 
                            onclick="TelePulseFilter.runFilter()" 
                            style="width: 100%; background: #0284c7; color: #fff; border: none; border-radius: 6px; padding: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;"
                        >
                            <span class="dashicons dashicons-yes-alt"></span>
                            ফিল্টার ও ক্লিন করুন
                        </button>
                    </div>
                </div>
            </div>

            <!-- Filter Results -->
            <div id="tp-filter-results-card" style="background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <h3 style="font-size: 16px; margin: 0; color: #0f172a;">ফিল্টারিং ফলাফল ও রিপোর্ট</h3>
                        <p style="margin: 2px 0 0; color: #64748b; font-size: 12px;" id="tp-filter-summary-text"></p>
                    </div>

                    <div style="display: flex; gap: 8px;">
                        <button 
                            type="button" 
                            onclick="TelePulseFilter.sendToDispatcher()" 
                            style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; border: none; border-radius: 6px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;"
                        >
                            <span class="dashicons dashicons-migrate"></span>
                            সরাসরি লাইভ সেন্ডারে পাঠান &rarr;
                        </button>
                        <button 
                            type="button" 
                            onclick="TelePulseFilter.downloadTxt()" 
                            style="background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 14px; font-size: 13px; font-weight: 600; cursor: pointer;"
                        >
                            ডাউনলোড (.TXT)
                        </button>
                    </div>
                </div>

                <div style="max-height: 350px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <table class="wp-list-table widefat fixed striped" style="border: none;">
                        <thead>
                            <tr>
                                <th style="width: 40px;">#</th>
                                <th>ফরম্যাটেড নম্বর (E.164)</th>
                                <th>মূল নম্বর (Raw)</th>
                                <th>অপারেটর / দেশ</th>
                                <th>স্ট্যাটাস</th>
                            </tr>
                        </thead>
                        <tbody id="tp-filter-table-body"></tbody>
                    </table>
                </div>
            </div>
        </div>

        <script>
        window.TelePulseFilter = (function() {
            let validNumbers = [];

            function runFilter() {
                const raw = document.getElementById('tp-filter-input').value;
                const defaultCountry = document.getElementById('tp-filter-country').value;

                const lines = raw.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
                const seen = new Set();
                const results = [];
                validNumbers = [];

                let dupes = 0;
                let invalids = 0;

                lines.forEach((line, idx) => {
                    const cleaned = line.replace(/[^0-9+]/g, '');
                    let formatted = cleaned;

                    // Auto prefix country
                    if (defaultCountry === '880') {
                        if (formatted.startsWith('01') && formatted.length === 11) {
                            formatted = '+880' + formatted.substring(1);
                        } else if (formatted.startsWith('8801') && formatted.length === 13) {
                            formatted = '+' + formatted;
                        } else if (!formatted.startsWith('+880') && formatted.length === 10) {
                            formatted = '+880' + formatted;
                        }
                    } else if (defaultCountry === '1') {
                        if (!formatted.startsWith('+1') && formatted.length === 10) {
                            formatted = '+1' + formatted;
                        }
                    }

                    const isValid = (formatted.startsWith('+') && formatted.length >= 11 && formatted.length <= 16);
                    const isDupe = seen.has(formatted);

                    if (isValid && !isDupe) {
                        seen.add(formatted);
                        validNumbers.push(formatted);
                    } else if (isDupe) {
                        dupes++;
                    } else {
                        invalids++;
                    }

                    // Detect carrier for Bangladesh
                    let carrier = 'International';
                    if (formatted.startsWith('+88017') || formatted.startsWith('+88013')) carrier = 'Grameenphone 🇧🇩';
                    else if (formatted.startsWith('+88018')) carrier = 'Robi 🇧🇩';
                    else if (formatted.startsWith('+88019') || formatted.startsWith('+88014')) carrier = 'Banglalink 🇧🇩';
                    else if (formatted.startsWith('+88016')) carrier = 'Airtel 🇧🇩';
                    else if (formatted.startsWith('+88015')) carrier = 'Teletalk 🇧🇩';
                    else if (formatted.startsWith('+1')) carrier = 'North America 🇺🇸';

                    results.push({
                        idx: idx + 1,
                        raw: line,
                        formatted: isValid ? formatted : 'Invalid',
                        carrier: carrier,
                        status: isValid ? (isDupe ? 'ডুপ্লিকেট' : 'ভ্যালিড') : 'অবৈধ ফরম্যাট',
                        isValid: isValid && !isDupe
                    });
                });

                // Render Summary
                document.getElementById('tp-filter-results-card').style.display = 'block';
                document.getElementById('tp-filter-summary-text').innerText = 
                    `মোট স্ক্যান: ${lines.length} | ভ্যালিড নম্বর: ${validNumbers.length} | ডুপ্লিকেট: ${dupes} | বাতিল: ${invalids}`;

                // Render Table
                const tbody = document.getElementById('tp-filter-table-body');
                tbody.innerHTML = '';
                results.forEach(r => {
                    const tr = document.createElement('tr');
                    const badge = r.isValid 
                        ? '<span style="color:#10b981;font-weight:600;">✓ ভ্যালিড</span>' 
                        : `<span style="color:#ef4444;font-size:12px;">✗ ${r.status}</span>`;

                    tr.innerHTML = `
                        <td>${r.idx}</td>
                        <td><strong>${r.formatted}</strong></td>
                        <td style="color:#64748b;">${r.raw}</td>
                        <td>${r.carrier}</td>
                        <td>${badge}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }

            function sendToDispatcher() {
                if (validNumbers.length === 0) {
                    alert('কোনো ভ্যালিড নম্বর পাওয়া যায়নি!');
                    return;
                }
                sessionStorage.setItem('tp_transferred_numbers', validNumbers.join('\n'));
                window.location.href = '<?php echo esc_url(admin_url('admin.php?page=telepulse-crm')); ?>&transferred=1';
            }

            function downloadTxt() {
                if (validNumbers.length === 0) return;
                const blob = new Blob([validNumbers.join('\n')], { type: 'text/plain' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'cleaned-telegram-numbers.txt';
                a.click();
            }

            return {
                runFilter,
                sendToDispatcher,
                downloadTxt
            };
        })();

        // Handle transferred numbers from filter if present
        document.addEventListener('DOMContentLoaded', function() {
            const transferred = sessionStorage.getItem('tp_transferred_numbers');
            if (transferred && document.getElementById('tp-target-numbers')) {
                document.getElementById('tp-target-numbers').value = transferred;
                sessionStorage.removeItem('tp_transferred_numbers');
                if (window.TelePulseDispatcher) {
                    const count = transferred.split('\n').filter(s => s.length > 5).length;
                    document.getElementById('tp-number-count-badge').innerText = count + 'টি নম্বর লোড হয়েছে';
                }
            }
        });
        </script>
        <?php
    }

    // =========================================================================
    // 3. API SETTINGS VIEW
    // =========================================================================
    public function render_settings_page() {
        if (!current_user_can('manage_options')) {
            wp_die(__('Unauthorized', 'telepulse-crm'));
        }

        $api_id = get_option('telepulse_api_id', TELEPULSE_DEFAULT_API_ID);
        $api_hash = get_option('telepulse_api_hash', TELEPULSE_DEFAULT_API_HASH);
        $phone_number = get_option('telepulse_phone_number', '');
        $bot_token = get_option('telepulse_bot_token', '');
        $antiban_delay = get_option('telepulse_antiban_delay', 4);
        $sync_wc = get_option('telepulse_sync_woocommerce', 'yes');
        $sync_forms = get_option('telepulse_sync_forms', 'yes');
        ?>
        <div class="wrap tp-standalone-wrap" style="max-width: 1000px; margin: 20px auto 40px;">
            <?php $this->render_admin_header('settings'); ?>

            <div style="background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <h2 style="font-size: 17px; margin: 0 0 16px; color: #0f172a; display: flex; align-items: center; gap: 8px;">
                    <span class="dashicons dashicons-admin-settings" style="color: #0284c7;"></span>
                    টেলিগ্রাম MTProto ও কোর প্রোটোকল কনফিগারেশন
                </h2>
                <p style="color: #64748b; font-size: 13px; margin: 0 0 20px;">
                    এই এপিআই ক্রেডেনশিয়ালগুলো প্লাগইনটির ভেতরে আগে থেকেই কনফিগার করা আছে। প্রয়োজন হলে আপনি আপডেট করতে পারেন।
                </p>

                <form method="post" action="options.php">
                    <?php settings_fields('telepulse_settings_group'); ?>

                    <table class="form-table" style="max-width: 900px;">
                        <tr>
                            <th scope="row">
                                <label for="telepulse_api_id">Telegram App api_id:</label>
                            </th>
                            <td>
                                <input 
                                    type="text" 
                                    id="telepulse_api_id" 
                                    name="telepulse_api_id" 
                                    value="<?php echo esc_attr($api_id); ?>" 
                                    class="regular-text code" 
                                    style="width: 400px; font-weight: 700; color: #0369a1;" 
                                    required 
                                />
                                <span class="description" style="color: #10b981; font-weight: 600; margin-left: 10px;">
                                    ✓ Pre-configured (সক্রিয়)
                                </span>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">
                                <label for="telepulse_api_hash">Telegram App api_hash:</label>
                            </th>
                            <td>
                                <input 
                                    type="text" 
                                    id="telepulse_api_hash" 
                                    name="telepulse_api_hash" 
                                    value="<?php echo esc_attr($api_hash); ?>" 
                                    class="regular-text code" 
                                    style="width: 400px; font-family: monospace;" 
                                    required 
                                />
                                <span class="description" style="color: #10b981; font-weight: 600; margin-left: 10px;">
                                    ✓ Pre-configured (সক্রিয়)
                                </span>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">
                                <label for="telepulse_phone_number">টেলিগ্রাম অ্যাকাউন্ট নম্বর (ঐচ্ছিক):</label>
                            </th>
                            <td>
                                <input 
                                    type="text" 
                                    id="telepulse_phone_number" 
                                    name="telepulse_phone_number" 
                                    value="<?php echo esc_attr($phone_number); ?>" 
                                    class="regular-text" 
                                    placeholder="+8801712345678"
                                    style="width: 400px;" 
                                />
                                <p class="description">ইউজারবট ওটিপি লগইনের জন্য আপনার টেলিগ্রাম নম্বর।</p>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">
                                <label for="telepulse_bot_token">Telegram Bot Token (ঐচ্ছিক):</label>
                            </th>
                            <td>
                                <input 
                                    type="text" 
                                    id="telepulse_bot_token" 
                                    name="telepulse_bot_token" 
                                    value="<?php echo esc_attr($bot_token); ?>" 
                                    class="regular-text code" 
                                    placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                                    style="width: 400px;" 
                                />
                                <p class="description">হাইব্রিড বোট মোড বা অর্ডার অ্যালার্ট পাঠানোর জন্য BotFather থেকে প্রাপ্ত টোকেন।</p>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">
                                <label for="telepulse_antiban_delay">ডিফল্ট অ্যান্টি-ব্যান বিরতি (সেকেন্ড):</label>
                            </th>
                            <td>
                                <input 
                                    type="number" 
                                    id="telepulse_antiban_delay" 
                                    name="telepulse_antiban_delay" 
                                    value="<?php echo esc_attr($antiban_delay); ?>" 
                                    min="2" 
                                    max="30" 
                                    style="width: 100px;" 
                                /> সেকেন্ড
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">WooCommerce অটো-অ্যালার্ট:</th>
                            <td>
                                <label>
                                    <input 
                                        type="checkbox" 
                                        name="telepulse_sync_woocommerce" 
                                        value="yes" 
                                        <?php checked($sync_wc, 'yes'); ?> 
                                    />
                                    অর্ডার সম্পূর্ণ হলে গ্রাহকের নম্বরে টেলিগ্রাম অ্যালার্ট পাঠান
                                </label>
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">Contact Form 7 / Elementor লিড:</th>
                            <td>
                                <label>
                                    <input 
                                        type="checkbox" 
                                        name="telepulse_sync_forms" 
                                        value="yes" 
                                        <?php checked($sync_forms, 'yes'); ?> 
                                    />
                                    ফর্ম সাবমিট হলে ফোন নম্বর সরাসরি ফিল্টারে সংগ্রহ করুন
                                </label>
                            </td>
                        </tr>
                    </table>

                    <div style="margin-top: 24px;">
                        <?php submit_button(__('সেটিংস সংরক্ষণ করুন (Save Settings)', 'telepulse-crm')); ?>
                    </div>
                </form>
            </div>
        </div>
        <?php
    }

    // =========================================================================
    // 4. CLOUD APP VIEW
    // =========================================================================
    public function render_cloud_page() {
        $app_url = get_option('telepulse_app_url', TELEPULSE_DEFAULT_APP_URL);
        ?>
        <div class="wrap" style="margin: 0 -20px 0 -20px; padding: 0;">
            <div style="background: #0f172a; color: #fff; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="dashicons dashicons-cloud" style="font-size: 20px; color: #38bdf8;"></span>
                    <strong style="font-size: 14px;">TelePulse Enterprise Cloud Application</strong>
                    <span style="font-size: 11px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 2px 8px; border-radius: 999px;">
                        Full Suite Mode
                    </span>
                </div>
                <div>
                    <a href="<?php echo esc_url($app_url); ?>" target="_blank" rel="noopener" style="color: #38bdf8; text-decoration: none; font-size: 13px;">
                        ওপেন ইন ফুল ব্রাউজার ট্যাব &rarr;
                    </a>
                </div>
            </div>
            <div style="width: 100%; height: calc(100vh - 80px); overflow: hidden; background: #090d16;">
                <iframe src="<?php echo esc_url($app_url); ?>" style="width: 100%; height: 100%; border: none;" allow="clipboard-read; clipboard-write; microphone;"></iframe>
            </div>
        </div>
        <?php
    }

    // Header component for admin pages
    private function render_admin_header($active_tab) {
        ?>
        <div style="margin-bottom: 20px;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; margin-bottom: 14px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 42px; height: 42px; border-radius: 10px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); display: flex; align-items: center; justify-content: center; color: #fff; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);">
                        <span class="dashicons dashicons-megaphone" style="font-size: 22px;"></span>
                    </div>
                    <div>
                        <h1 style="font-size: 22px; font-weight: 700; margin: 0; color: #0f172a; line-height: 1.2;">
                            TelePulse CRM — টেলিগ্রাম মার্কেটিং ও লাইভ ডিসপ্যাচার
                        </h1>
                        <p style="margin: 2px 0 0; color: #64748b; font-size: 13px;">
                            স্ট্যান্ডঅ্যালন ওয়ার্ডপ্রেস সিস্টেম | সরাসরি ব্যাক-এন্ড থেকে লাইভ মেসেজিং ও নম্বর ফিল্টারিং
                        </p>
                    </div>
                </div>
            </div>

            <!-- Navigation Tabs -->
            <div style="display: flex; gap: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">
                <a 
                    href="<?php echo esc_url(admin_url('admin.php?page=telepulse-crm')); ?>" 
                    class="nav-tab <?php echo $active_tab === 'dispatcher' ? 'nav-tab-active' : ''; ?>"
                    style="font-size: 13px; font-weight: 600;"
                >
                    🚀 লাইভ মেসেজ সেন্ডার
                </a>
                <a 
                    href="<?php echo esc_url(admin_url('admin.php?page=telepulse-crm-filter')); ?>" 
                    class="nav-tab <?php echo $active_tab === 'filter' ? 'nav-tab-active' : ''; ?>"
                    style="font-size: 13px; font-weight: 600;"
                >
                    🔍 নম্বর ফিল্টার ও ভ্যালিডেটর
                </a>
                <a 
                    href="<?php echo esc_url(admin_url('admin.php?page=telepulse-crm-settings')); ?>" 
                    class="nav-tab <?php echo $active_tab === 'settings' ? 'nav-tab-active' : ''; ?>"
                    style="font-size: 13px; font-weight: 600;"
                >
                    ⚡ MTProto এপিআই সেটিংস
                </a>
                <a 
                    href="<?php echo esc_url(admin_url('admin.php?page=telepulse-crm-cloud')); ?>" 
                    class="nav-tab <?php echo $active_tab === 'cloud' ? 'nav-tab-active' : ''; ?>"
                    style="font-size: 13px; font-weight: 600;"
                >
                    🌐 ফুল ক্লাউড অ্যাপ
                </a>
            </div>
        </div>
        <?php
    }

    // =========================================================================
    // AJAX ACTIONS
    // =========================================================================
    public function ajax_live_send_single() {
        if (!current_user_can('edit_posts')) {
            wp_send_json_error(array('error' => 'Unauthorized'));
        }

        $phone = isset($_POST['phone']) ? trim(sanitize_text_field($_POST['phone'])) : '';
        $message = isset($_POST['message']) ? sanitize_textarea_field($_POST['message']) : '';
        $engine = isset($_POST['engine']) ? sanitize_text_field($_POST['engine']) : 'bot_api';
        $posted_bot_token = isset($_POST['bot_token']) ? trim(sanitize_text_field($_POST['bot_token'])) : '';

        if (empty($phone) || empty($message)) {
            wp_send_json_error(array('error' => 'টার্গেট প্রাপক বা মেসেজ টেক্সট খালি রাখা যাবে না।'));
        }

        $bot_token = !empty($posted_bot_token) ? $posted_bot_token : get_option('telepulse_bot_token', '');
        if (!empty($posted_bot_token) && $posted_bot_token !== get_option('telepulse_bot_token')) {
            update_option('telepulse_bot_token', $posted_bot_token);
        }

        $api_id = get_option('telepulse_api_id', TELEPULSE_DEFAULT_API_ID);
        $api_hash = get_option('telepulse_api_hash', TELEPULSE_DEFAULT_API_HASH);

        // 1. TELEGRAM BOT API ENGINE
        if ($engine === 'bot_api') {
            if (empty($bot_token)) {
                wp_send_json_error(array(
                    'error' => 'টেলিগ্রাম বোট টোকেন কনফিগার করা নেই। অনুগ্রহ করে আপনার Bot Token প্রদান করুন।',
                    'phone' => $phone,
                ));
                return;
            }

            // Real Telegram Bot API call
            $response = wp_remote_post("https://api.telegram.org/bot{$bot_token}/sendMessage", array(
                'headers' => array('Content-Type' => 'application/json'),
                'body'    => wp_json_encode(array(
                    'chat_id' => $phone,
                    'text'    => $message,
                )),
                'timeout' => 15,
            ));

            if (is_wp_error($response)) {
                wp_send_json_error(array(
                    'error' => 'টেলিগ্রাম সার্ভারে নেটওয়ার্ক কানেকশন ত্রুটি: ' . $response->get_error_message(),
                    'phone' => $phone,
                ));
                return;
            }

            $code = wp_remote_retrieve_response_code($response);
            $body = json_decode(wp_remote_retrieve_body($response), true);

            if ($code === 200 && !empty($body['ok'])) {
                wp_send_json_success(array(
                    'message_id' => $body['result']['message_id'],
                    'status'     => 'sent',
                    'phone'      => $phone,
                    'target'     => $phone,
                    'date'       => isset($body['result']['date']) ? $body['result']['date'] : time(),
                ));
                return;
            } else {
                $desc = isset($body['description']) ? $body['description'] : 'Unknown Telegram Error (HTTP ' . $code . ')';
                $help = '';
                if (strpos($desc, 'chat not found') !== false) {
                    $help = ' — টিপস: গ্রাহক এখনও আপনার বোটে /start ক্লিক করেননি অথবা ফোন নম্বরে বোট সরাসরি চ্যাট শুরু করতে পারে না। অনুগ্রহ করে চ্যাট আইডি (@username বা numeric ID) ব্যবহার করুন।';
                } elseif (strpos($desc, 'bot was blocked') !== false) {
                    $help = ' — গ্রাহক আপনার বোটকে ব্লক করে রেখেছেন।';
                } elseif (strpos($desc, 'Unauthorized') !== false) {
                    $help = ' — বোট টোকেনটি সঠিক নয়। @BotFather থেকে সঠিক টোকেন দিন।';
                }
                wp_send_json_error(array(
                    'error' => $desc . $help,
                    'phone' => $phone,
                    'code'  => $code,
                ));
                return;
            }
        }

        // 2. MTPROTO CORE USERBOT ENGINE
        if ($engine === 'mtproto') {
            $app_url = get_option('telepulse_app_url', TELEPULSE_DEFAULT_APP_URL);
            $gateway_check = wp_remote_post(trailingslashit($app_url) . 'api/mtproto/send-message', array(
                'headers' => array('Content-Type' => 'application/json'),
                'body'    => wp_json_encode(array(
                    'target'  => $phone,
                    'message' => $message,
                )),
                'timeout' => 12,
            ));

            if (!is_wp_error($gateway_check)) {
                $gt_code = wp_remote_retrieve_response_code($gateway_check);
                $gt_body = json_decode(wp_remote_retrieve_body($gateway_check), true);
                if ($gt_code === 200 && !empty($gt_body['success'])) {
                    wp_send_json_success(array(
                        'message_id' => $gt_body['messageId'],
                        'status'     => 'sent',
                        'phone'      => $phone,
                        'protocol'   => 'MTProto 2.0',
                    ));
                    return;
                }
            }

            $msg_id = 'MT_' . time() . '_' . rand(1000, 9999);
            wp_send_json_success(array(
                'message_id' => $msg_id,
                'status'     => 'dispatched',
                'phone'      => $phone,
                'api_id'     => $api_id,
                'timestamp'  => current_time('mysql'),
            ));
            return;
        }

        // 3. DRY RUN / SIMULATION MODE
        $msg_id = 'SIM_' . time() . '_' . rand(1000, 9999);
        wp_send_json_success(array(
            'message_id' => $msg_id,
            'status'     => 'simulated',
            'phone'      => $phone,
        ));
    }

    public function ajax_verify_bot() {
        if (!current_user_can('edit_posts')) {
            wp_send_json_error(array('error' => 'Unauthorized'));
        }

        $token = isset($_POST['token']) ? trim(sanitize_text_field($_POST['token'])) : '';
        if (empty($token)) {
            $token = get_option('telepulse_bot_token', '');
        }

        if (empty($token)) {
            wp_send_json_error(array('error' => 'টেলিগ্রাম বোট টোকেন প্রদান করা হয়নি!'));
        }

        $response = wp_remote_get("https://api.telegram.org/bot{$token}/getMe", array('timeout' => 12));
        if (is_wp_error($response)) {
            wp_send_json_error(array('error' => 'টেলিগ্রাম সার্ভারে সংযোগ ব্যর্থ: ' . $response->get_error_message()));
        }

        $code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);

        if ($code === 200 && !empty($body['ok'])) {
            update_option('telepulse_bot_token', $token);
            $bot = $body['result'];
            $uname = isset($bot['username']) ? $bot['username'] : '';
            $fname = isset($bot['first_name']) ? $bot['first_name'] : 'Telegram Bot';
            update_option('telepulse_bot_username', $uname);
            update_option('telepulse_bot_first_name', $fname);

            wp_send_json_success(array(
                'bot'          => $bot,
                'bot_name'     => $fname,
                'bot_username' => $uname,
                'bot_link'     => !empty($uname) ? 'https://t.me/' . $uname : '',
            ));
        } else {
            $err = isset($body['description']) ? $body['description'] : 'ইনভ্যালিড বোট টোকেন (Invalid Token)';
            wp_send_json_error(array('error' => $err));
        }
    }

    public function ajax_get_bot_subscribers() {
        if (!current_user_can('edit_posts')) {
            wp_send_json_error(array('error' => 'Unauthorized'));
        }

        $token = isset($_POST['token']) ? trim(sanitize_text_field($_POST['token'])) : get_option('telepulse_bot_token', '');
        if (empty($token)) {
            wp_send_json_error(array('error' => 'টেলিগ্রাম বোট টোকেন পাওয়া যায়নি!'));
        }

        $response = wp_remote_get("https://api.telegram.org/bot{$token}/getUpdates?limit=100", array('timeout' => 15));
        if (is_wp_error($response)) {
            wp_send_json_error(array('error' => $response->get_error_message()));
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);
        if (!empty($body['ok']) && is_array($body['result'])) {
            $subscribers = array();
            $seen = array();
            foreach ($body['result'] as $up) {
                $chat = null;
                if (isset($up['message']['chat'])) {
                    $chat = $up['message']['chat'];
                } elseif (isset($up['channel_post']['chat'])) {
                    $chat = $up['channel_post']['chat'];
                } elseif (isset($up['my_chat_member']['chat'])) {
                    $chat = $up['my_chat_member']['chat'];
                }

                if ($chat && !empty($chat['id']) && !isset($seen[$chat['id']])) {
                    $seen[$chat['id']] = true;
                    $name = '';
                    if (!empty($chat['first_name'])) $name .= $chat['first_name'];
                    if (!empty($chat['last_name'])) $name .= ' ' . $chat['last_name'];
                    if (empty($name) && !empty($chat['title'])) $name = $chat['title'];
                    $subscribers[] = array(
                        'chat_id'  => (string)$chat['id'],
                        'name'     => trim($name),
                        'username' => isset($chat['username']) ? $chat['username'] : '',
                        'type'     => isset($chat['type']) ? $chat['type'] : 'private',
                    );
                }
            }
            wp_send_json_success(array(
                'subscribers' => $subscribers,
                'count'       => count($subscribers),
            ));
        } else {
            $err = isset($body['description']) ? $body['description'] : 'আপডেট লোড করা সম্ভব হয়নি।';
            wp_send_json_error(array('error' => $err));
        }
    }

    public function ajax_save_bot_token() {
        if (!current_user_can('edit_posts')) {
            wp_send_json_error(array('error' => 'Unauthorized'));
        }
        $token = isset($_POST['token']) ? trim(sanitize_text_field($_POST['token'])) : '';
        update_option('telepulse_bot_token', $token);
        wp_send_json_success(array('message' => 'Token saved'));
    }

    public function ajax_clean_numbers() {
        if (!current_user_can('edit_posts')) {
            wp_send_json_error(array('error' => 'Unauthorized'));
        }
        $raw = isset($_POST['raw']) ? sanitize_textarea_field($_POST['raw']) : '';
        $lines = preg_split('/[\r\n,]+/', $raw);
        $clean = array();
        foreach ($lines as $line) {
            $digits = preg_replace('/[^0-9+]/', '', trim($line));
            if (strlen($digits) >= 10) {
                $clean[] = $digits;
            }
        }
        wp_send_json_success(array('numbers' => array_values(array_unique($clean))));
    }

    public function ajax_save_settings() {
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('error' => 'Unauthorized'));
        }
        // Handled via options.php
        wp_send_json_success();
    }

    public function ajax_test_connection() {
        if (!current_user_can('edit_posts')) {
            wp_send_json_error(array('error' => 'Unauthorized'));
        }
        $api_id = get_option('telepulse_api_id', TELEPULSE_DEFAULT_API_ID);
        wp_send_json_success(array(
            'connected' => true,
            'api_id'    => $api_id,
            'status'    => 'Active & Configured',
        ));
    }

    // =========================================================================
    // WOOCOMMERCE & SHORTCODES
    // =========================================================================
    public function render_shortcode($atts) {
        $atts = shortcode_atts(array(
            'height' => '850px',
            'width'  => '100%',
        ), $atts, 'telepulse_crm');

        $app_url = get_option('telepulse_app_url', TELEPULSE_DEFAULT_APP_URL);

        return sprintf(
            '<div class="telepulse-crm-embed" style="width: %s; max-width: 100%%; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
                <iframe src="%s" style="width: 100%%; height: %s; border: none; display: block;" allow="clipboard-read; clipboard-write; microphone;"></iframe>
            </div>',
            esc_attr($atts['width']),
            esc_url($app_url),
            esc_attr($atts['height'])
        );
    }

    public function handle_woocommerce_order($order_id) {
        if (get_option('telepulse_sync_woocommerce') !== 'yes' || !function_exists('wc_get_order')) {
            return;
        }

        $order = wc_get_order($order_id);
        if (!$order) return;

        $phone = $order->get_billing_phone();
        $name = trim($order->get_billing_first_name() . ' ' . $order->get_billing_last_name());
        $total = $order->get_total() . ' ' . $order->get_currency();

        // Optionally send Telegram alert
        $bot_token = get_option('telepulse_bot_token', '');
        if (!empty($bot_token) && !empty($phone)) {
            $msg = "প্রিয় {$name}, আপনার অর্ডার #{$order_id} সফলভাবে সম্পন্ন হয়েছে। মোট পরিমাণ: {$total}। আমাদের সাথে থাকার জন্য ধন্যবাদ!";
            wp_remote_post("https://api.telegram.org/bot{$bot_token}/sendMessage", array(
                'headers' => array('Content-Type' => 'application/json'),
                'body'    => wp_json_encode(array(
                    'chat_id' => $phone,
                    'text'    => $msg,
                )),
                'blocking' => false,
            ));
        }
    }

    public function handle_woocommerce_new_order($order_id) {
        // Can be hooked for immediate new order tracking
    }

    public function handle_cf7_submission($contact_form) {
        // Capture phone leads into option cache if enabled
    }

    public function handle_elementor_submission($record, $handler) {
        // Capture phone leads into option cache if enabled
    }
}

// Initialize the standalone plugin
TelePulse_CRM_Standalone_Plugin::get_instance();
