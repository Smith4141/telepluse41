/**
 * Google Translate integration service for TelePulse Enterprise CRM.
 * Translates between Bengali, English, and other languages in real-time.
 * Features live Google Translate API with fallback dictionary for 100% reliability.
 */

// Common business and customer conversation phrase mapping for Bengali <-> English
const BN_TO_EN_DICTIONARY: Record<string, string> = {
  'ধন্যবাদ': 'Thank you',
  'অনেক ধন্যবাদ': 'Thank you very much',
  'হ্যালো': 'Hello',
  'হাই': 'Hi',
  'আসসালামু আলাইকুম': 'Peace be upon you (Assalamu Alaikum)',
  'নমস্কার': 'Greetings (Namaskar)',
  'কেমন আছেন?': 'How are you?',
  'কেমন আছেন': 'How are you',
  'আমি ভালো আছি': 'I am fine',
  'আমাদের ক্যাম্পেইন কবে শুরু হবে?': 'When will our campaign start?',
  'ক্যাম্পেইন শুরু হয়েছে': 'The campaign has started',
  'এসএমএস ডেলিভারি রিপোর্ট দেখতে চাই': 'I want to see the SMS delivery report',
  'কত টাকা লাগবে?': 'How much will it cost?',
  'মূল্য তালিকা দিন': 'Please provide the pricing quotation',
  'আমাদের ১০০,০০০ এসএমএস পাঠাতে হবে': 'We need to send 100,000 SMS messages',
  'টেলিগ্রাম চ্যানেল লিঙ্ক কি?': 'What is the Telegram channel link?',
  'আমরা পেমেন্ট সম্পন্ন করেছি': 'We have completed the payment',
  'ইনভয়েস পাঠাবেন প্লিজ': 'Please send the invoice',
  'ওয়ার্ডপ্রেস প্লাগইন সেটআপ সাহায্য লাগবে': 'Need help with WordPress plugin setup',
  'কল ব্যাক করুন': 'Please call back',
  'দেরি হওয়ার জন্য দুঃখিত': 'Sorry for the delay',
  'আমাদের পোর্ট ২০০ গেটওয়ে সচল আছে': 'Our Port 200 gateway is active',
  'আমরা খুব শীঘ্রই আপনার সাথে যোগাযোগ করব': 'We will contact you very shortly',
  'সব বার্তা সফলভাবে পৌঁছেছে': 'All messages were delivered successfully',
  'অর্ডার নিশ্চিত করা হয়েছে': 'Order has been confirmed',
  'দয়া করে একটু অপেক্ষা করুন': 'Please wait a moment',
};

const EN_TO_BN_DICTIONARY: Record<string, string> = {
  'thank you': 'ধন্যবাদ',
  'thank you very much': 'আপনাকে অনেক ধন্যবাদ',
  'hello': 'হ্যালো',
  'hi': 'হাই',
  'how are you?': 'আপনি কেমন আছেন?',
  'how are you': 'আপনি কেমন আছেন?',
  'i am fine': 'আমি ভালো আছি',
  'when will our campaign start?': 'আমাদের ক্যাম্পেইন কবে শুরু হবে?',
  'the campaign has started': 'ক্যাম্পেইন শুরু হয়েছে',
  'i want to see the sms delivery report': 'আমি এসএমএস ডেলিভারি রিপোর্ট দেখতে চাই',
  'how much will it cost?': 'কত খরচ পড়বে?',
  'please provide the pricing quotation': 'অনুগ্রহ করে মূল্য তালিকা দিন',
  'we need to send 100,000 sms messages': 'আমাদের ১০০,০০০ এসএমএস বার্তা পাঠাতে হবে',
  'what is the telegram channel link?': 'টেলিগ্রাম চ্যানেল লিঙ্ক কী?',
  'we have completed the payment': 'আমরা পেমেন্ট সম্পন্ন করেছি',
  'please send the invoice': 'অনুগ্রহ করে ইনভয়েস পাঠান',
  'need help with wordpress plugin setup': 'ওয়ার্ডপ্রেস প্লাগইন সেটআপে সহায়তা দরকার',
  'please call back': 'দয়া করে কল ব্যাক করুন',
  'sorry for the delay': 'দেরির জন্য দুঃখিত',
  'our port 200 gateway is active': 'আমাদের পোর্ট ২০০ গেটওয়ে সক্রিয় আছে',
  'we will contact you very shortly': 'আমরা খুব দ্রুত আপনার সাথে যোগাযোগ করব',
  'all messages were delivered successfully': 'সব মেসেজ সফলভাবে পৌঁছেছে',
  'order has been confirmed': 'অর্ডারটি নিশ্চিত করা হয়েছে',
  'please wait a moment': 'অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন',
};

// Word dictionary for intelligent transliteration / translation fallback
const WORD_MAP_EN_BN: Record<string, string> = {
  hello: 'হ্যালো',
  hi: 'হাই',
  thanks: 'ধন্যবাদ',
  thank: 'ধন্যবাদ',
  you: 'আপনাকে',
  we: 'আমরা',
  our: 'আমাদের',
  team: 'টিম',
  support: 'সাপোর্ট',
  sms: 'এসএমএস',
  telegram: 'টেলিগ্রাম',
  campaign: 'ক্যাম্পেইন',
  message: 'মেসেজ',
  messages: 'মেসেজগুলো',
  delivery: 'ডেলিভারি',
  price: 'মূল্য',
  cost: 'খরচ',
  quote: 'কোটেশন',
  report: 'রিপোর্ট',
  invoice: 'চালান/ইনভয়েস',
  contact: 'যোগাযোগ',
  lead: 'লিড',
  leads: 'লিডস',
  gateway: 'গেটওয়ে',
  active: 'সক্রিয়',
  sent: 'প্রেরিত',
  success: 'সফল',
  failed: 'ব্যর্থ',
  demo: 'ডেমো',
  meeting: 'মিটিং',
  call: 'কল',
  yes: 'হ্যাঁ',
  no: 'না',
  ok: 'ঠিক আছে',
  tomorrow: 'আগামীকাল',
  today: 'আজ',
  soon: 'শীঘ্রই',
  rate: 'হার',
  help: 'সাহায্য',
  welcome: 'স্বাগতম',
  please: 'দয়া করে',
};

const WORD_MAP_BN_EN: Record<string, string> = {
  হ্যালো: 'Hello',
  হাই: 'Hi',
  ধন্যবাদ: 'Thank you',
  আপনাকে: 'you',
  আমরা: 'we',
  আমাদের: 'our',
  টিম: 'team',
  সাপোর্ট: 'support',
  এসএমএস: 'SMS',
  টেলিগ্রাম: 'Telegram',
  ক্যাম্পেইন: 'campaign',
  মেসেজ: 'message',
  ডেলিভারি: 'delivery',
  মূল্য: 'price',
  খরচ: 'cost',
  রিপোর্ট: 'report',
  ইনভয়েস: 'invoice',
  যোগাযোগ: 'contact',
  সক্রিয়: 'active',
  সফল: 'successful',
  ব্যর্থ: 'failed',
  ডেমো: 'demo',
  কল: 'call',
  হ্যাঁ: 'yes',
  না: 'no',
  শীঘ্রই: 'soon',
  সাহায্য: 'help',
  স্বাগতম: 'welcome',
};

/**
 * Detect language between Bengali and English
 */
export function detectLanguage(text: string): 'bn' | 'en' {
  if (!text) return 'en';
  // Bengali Unicode range: \u0980-\u09FF
  const bengaliCharMatch = text.match(/[\u0980-\u09FF]/g);
  if (bengaliCharMatch && bengaliCharMatch.length > 0) {
    return 'bn';
  }
  return 'en';
}

export interface GoogleTranslateResult {
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  isFallback?: boolean;
}

/**
 * Translates text using Google Translate API with zero-failure fallback
 */
export async function translateWithGoogle(
  text: string,
  targetLang: 'bn' | 'en' = 'en',
  sourceLang: 'auto' | 'bn' | 'en' = 'auto'
): Promise<GoogleTranslateResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { translatedText: '', sourceLang: 'en', targetLang };
  }

  // Determine actual target and source
  let detectedSource = sourceLang;
  if (sourceLang === 'auto') {
    detectedSource = detectLanguage(trimmed);
  }

  // If already in target language, return as is
  if (detectedSource === targetLang) {
    // If asking to translate BN to BN, or EN to EN, invert target
    targetLang = detectedSource === 'bn' ? 'en' : 'bn';
  }

  // Check direct exact phrase dictionary first for instant zero-latency match
  const lower = trimmed.toLowerCase();
  if (targetLang === 'en' && BN_TO_EN_DICTIONARY[trimmed]) {
    return {
      translatedText: BN_TO_EN_DICTIONARY[trimmed],
      sourceLang: 'bn',
      targetLang: 'en',
    };
  }
  if (targetLang === 'bn' && EN_TO_BN_DICTIONARY[lower]) {
    return {
      translatedText: EN_TO_BN_DICTIONARY[lower],
      sourceLang: 'en',
      targetLang: 'bn',
    };
  }

  // 1. Try Real Google Translate API (client=gtx)
  try {
    const sl = detectedSource === 'auto' ? 'auto' : detectedSource;
    const tl = targetLang;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(
      trimmed
    )}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const fullTranslation = data[0]
          .map((item: any) => (Array.isArray(item) ? item[0] : ''))
          .join('');
        if (fullTranslation && fullTranslation.trim()) {
          const detectedFromApi = data[2] || detectedSource;
          return {
            translatedText: fullTranslation.trim(),
            sourceLang: detectedFromApi,
            targetLang,
          };
        }
      }
    }
  } catch (err) {
    // Silent catch, fallback below
  }

  // 2. Intelligent Word & Token substitution fallback if API is unreachable/offline
  if (targetLang === 'bn') {
    // EN -> BN token translation
    const words = trimmed.split(/(\s+|[,.?!;:])/);
    const translatedWords = words.map((w) => {
      const clean = w.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (WORD_MAP_EN_BN[clean]) {
        return WORD_MAP_EN_BN[clean];
      }
      return w;
    });
    return {
      translatedText: translatedWords.join(''),
      sourceLang: 'en',
      targetLang: 'bn',
      isFallback: true,
    };
  } else {
    // BN -> EN token translation
    const words = trimmed.split(/(\s+|[,.?!;:|])/);
    const translatedWords = words.map((w) => {
      const clean = w.trim();
      if (WORD_MAP_BN_EN[clean]) {
        return WORD_MAP_BN_EN[clean];
      }
      return w;
    });
    return {
      translatedText: translatedWords.join(''),
      sourceLang: 'bn',
      targetLang: 'en',
      isFallback: true,
    };
  }
}
