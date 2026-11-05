<?php
/**
 * TelePulse CRM Uninstall
 */

if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

delete_option('telepulse_api_id');
delete_option('telepulse_api_hash');
delete_option('telepulse_phone_number');
delete_option('telepulse_bot_token');
delete_option('telepulse_antiban_delay');
delete_option('telepulse_default_country');
delete_option('telepulse_sync_woocommerce');
delete_option('telepulse_sync_forms');
delete_option('telepulse_app_url');
delete_transient('telepulse_crm_activation_notice');
