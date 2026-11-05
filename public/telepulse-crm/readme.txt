=== TelePulse CRM - Standalone Telegram Marketing & Live Dispatcher ===
Contributors: telepulse
Tags: telegram, crm, bulk sms, woocommerce, contact management, live chat, mtproto
Requires at least: 5.4
Tested up to: 6.7
Stable tag: 2.1.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Standalone Telegram Marketing, Bulk Dispatcher & Phone Number Filter for WordPress. Pre-configured with Telegram Core MTProto (App API ID: 37979808, API Hash: 8ed857b64a55e9aa61468ab6b2fa6240) for immediate live messaging on localhost and live servers with zero external setup.

== Description ==

TelePulse CRM একটি স্বতন্ত্র কম্পিউটার প্রোগ্রামের মতোই কাজ করে। এটি প্লাগইনটির ভেতরেই আগে থেকে কনফিগার করা থাকে। কোনো প্রকার এক্সটার্নাল এপিআই কনফিগার করার প্রয়োজন ছাড়াই প্লাগইনটি ইনস্টল করার সাথে সাথে আপনি ফিল্টার করা নম্বরগুলোতে সরাসরি ব্যাক-এন্ড থেকে লাইভ মেসেজ পাঠাতে পারবেন।

= মূল বৈশিষ্ট্যসমূহ (Key Features) =
* **প্রি-কনফিগার করা টেলিগ্রাম কোর এপিআই:** App api_id: `37979808` এবং App api_hash: `8ed857b64a55e9aa61468ab6b2fa6240` আগে থেকেই প্লাগইন কোডে সক্রিয় করা।
* **লাইভ মেসেজ সেন্ডার (Live Dispatcher):** ফিল্টার করা নম্বরগুলোতে রিয়েল-টাইম প্রোগ্রেস বার এবং লাইভ টার্মিনাল এক্সিকিউশন লগ সহ মেসেজ ব্রডকাস্ট করুন।
* **অ্যান্টি-ব্যান প্রটেকশন (Anti-Ban Protection):** প্রতিটি মেসেজের মাঝে ২ থেকে ১৫ সেকেন্ডের বিরতি দিয়ে অ্যাকাউন্ট সম্পূর্ণ নিরাপদ রাখুন।
* **নম্বর ফিল্টারিং ও ক্লিনার (Number Validator):** র যেকোনো ফরম্যাটের নম্বর ক্লিন করুন, ডুপ্লিকেট বাদ দিন, এবং এক ক্লিকে লাইভ সেন্ডারে ট্রান্সফার করুন।
* **WooCommerce ও ফর্ম অটোমেশন:** WooCommerce অর্ডার সম্পন্ন হলে স্বয়ংক্রিয়ভাবে গ্রাহকের টেলিগ্রামে মেসেজ পাঠানো।
* **১০০% স্ট্যান্ডঅ্যালন:** লোকালহোস্ট (Localhost / XAMPP / LocalWP) বা যেকোনো লাইভ ওয়ার্ডপ্রেস সার্ভারে কোনো বাহ্যিক নোডজেএস ডিপেনডেন্সি ছাড়াই সরাসরি চলে।

== Installation ==

1. WordPress এডমিন প্যানেলে যান: `Plugins > Add New > Upload Plugin`
2. `telepulse-crm.zip` ফাইলটি নির্বাচন করুন এবং `Install Now` এ ক্লিক করুন।
3. `Activate Plugin` এ ক্লিক করুন।
4. এডমিন সাইডবার থেকে `TelePulse CRM` মেনুতে ক্লিক করুন।
5. আপনার টার্গেট নম্বর ও মেসেজ দিয়ে এক ক্লিকেই লাইভ ব্রডকাস্ট শুরু করুন!

= টেলিগ্রাম বোট (Bot Token) দিয়ে মেসেজ পাঠাবো কীভাবে? =
টেলিগ্রামে @BotFather এ গিয়ে /newbot কমান্ড দিয়ে আপনার বোট তৈরি করুন এবং টোকেনটি প্লাগইনের 'Telegram Bot Token' বক্সে দিন। এরপর 'বোট ভেরিফাই' বাটনে ক্লিক করুন। আপনার বোট লিংকটি (t.me/your_bot) গ্রাহকদের সাথে শেয়ার করুন। গ্রাহক একবার Start দিলেই 'গ্রাহক সিঙ্ক করুন' বাটনে ক্লিক করে তাদের Chat ID নিয়ে শতভাগ নিশ্চিত লাইভ মেসেজ পাঠান।

= আমাকে কি কোনো API কনফিগার করতে হবে? =
না! প্লাগইনটির ভেতরেই আপনার দেওয়া App api_id: 37979808 এবং api_hash: 8ed857b64a55e9aa61468ab6b2fa6240 আগে থেকেই কনফিগার করা রয়েছে। এছাড়াও আপনি Bot Token দিয়ে সরাসরি মেসেজ পাঠাতে পারবেন।

= এটি কি লোকালহোস্টে কাজ করবে? =
হ্যাঁ, এটি যেকোনো লোকালহোস্ট (XAMPP, WAMP, LocalWP) কিংবা লাইভ হোস্টিংয়ে পুরোপুরি কাজ করে।
