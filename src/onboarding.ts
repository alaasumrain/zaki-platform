/**
 * Zaki Onboarding Flow
 * 
 * Multi-step onboarding with language support.
 * Runs in the Worker (no Sandbox needed yet).
 */

// ==========================================
// Types
// ==========================================

export interface OnboardingState {
  step: 'language' | 'name' | 'purpose' | 'style' | 'interests' | 'complete';
  language?: string;
  name?: string;
  purpose?: string;
  style?: string;
  interests?: string;
}

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

// ==========================================
// Translations
// ==========================================

const t: Record<string, Record<string, string>> = {
  // Step 1: Welcome + Language
  'welcome': {
    en: "Hey! 👋 Welcome to **Zaki** — your personal AI assistant.\n\nFirst things first, which language do you prefer?",
    ar: "أهلاً! 👋 مرحباً بك في **زكي** — مساعدك الشخصي الذكي.\n\nبداية، أي لغة تفضل؟",
    de: "Hey! 👋 Willkommen bei **Zaki** — dein persönlicher KI-Assistent.\n\nZuerst einmal, welche Sprache bevorzugst du?",
    fr: "Hey! 👋 Bienvenue sur **Zaki** — votre assistant IA personnel.\n\nTout d'abord, quelle langue préférez-vous ?",
    es: "¡Hey! 👋 Bienvenido a **Zaki** — tu asistente personal de IA.\n\nPrimero, ¿qué idioma prefieres?",
    tr: "Hey! 👋 **Zaki**'ye hoş geldin — kişisel yapay zeka asistanın.\n\nÖncelikle, hangi dili tercih edersin?",
  },

  // Step 2: Ask name
  'ask_name': {
    en: "Great choice! 🎉\n\nWhat should I call you?",
    ar: "اختيار ممتاز! 🎉\n\nشو لازم أناديك؟",
    de: "Gute Wahl! 🎉\n\nWie soll ich dich nennen?",
    fr: "Excellent choix ! 🎉\n\nComment dois-je vous appeler ?",
    es: "¡Gran elección! 🎉\n\n¿Cómo te llamo?",
    tr: "Harika seçim! 🎉\n\nSana ne diyeyim?",
  },

  // Step 3: Purpose
  'ask_purpose': {
    en: "Nice to meet you, {name}! 😊\n\nWhat do you mainly need help with?",
    ar: "تشرفت بمعرفتك يا {name}! 😊\n\nبشو بتحتاج مساعدة بشكل أساسي؟",
    de: "Freut mich, {name}! 😊\n\nWobei brauchst du hauptsächlich Hilfe?",
    fr: "Enchanté, {name} ! 😊\n\nPour quoi avez-vous principalement besoin d'aide ?",
    es: "¡Encantado, {name}! 😊\n\n¿Con qué necesitas ayuda principalmente?",
    tr: "Tanıştığımıza memnun oldum, {name}! 😊\n\nHangi konuda yardıma ihtiyacın var?",
  },

  // Step 4: Style
  'ask_style': {
    en: "Got it! And how should I talk to you?",
    ar: "فهمت! وكيف تحب أحكي معك؟",
    de: "Verstanden! Und wie soll ich mit dir reden?",
    fr: "Compris ! Et comment dois-je vous parler ?",
    es: "¡Entendido! ¿Y cómo prefieres que te hable?",
    tr: "Anladım! Seninle nasıl konuşayım?",
  },

  // Step 5: Interests
  'ask_interests': {
    en: "Perfect! Last thing — tell me a bit about what you're into. What are your interests, hobbies, or what do you work on?\n\n_Just type freely, or skip with /skip_",
    ar: "ممتاز! آخر شي — خبرني شوي عن اهتماماتك. شو هواياتك أو شو شغلك؟\n\n_اكتب براحتك، أو تخطى بـ /skip_",
    de: "Perfekt! Letzte Frage — erzähl mir ein bisschen über dich. Was sind deine Interessen, Hobbys oder woran arbeitest du?\n\n_Schreib einfach drauflos, oder überspringe mit /skip_",
    fr: "Parfait ! Dernière chose — parlez-moi de vos centres d'intérêt, hobbies, ou de votre travail.\n\n_Écrivez librement, ou passez avec /skip_",
    es: "¡Perfecto! Última cosa — cuéntame sobre tus intereses, hobbies o en qué trabajas.\n\n_Escribe libremente, o salta con /skip_",
    tr: "Mükemmel! Son bir şey — ilgi alanların, hobilerinin ya da ne üzerinde çalıştığın hakkında biraz anlat.\n\n_Rahatça yaz, ya da /skip ile atla_",
  },

  // Complete
  'complete': {
    en: "All set! 🚀\n\n**Your personal Zaki is ready, {name}!**\n\nI'll remember your preferences and get smarter over time.\n\nJust send me anything — questions, tasks, ideas, or just chat. I'm here for you. ✨",
    ar: "جاهز! 🚀\n\n**زكي الخاص فيك جاهز يا {name}!**\n\nرح أتذكر تفضيلاتك وأصير أذكى مع الوقت.\n\nارسلي أي شي — أسئلة، مهام، أفكار، أو مجرد دردشة. أنا هون عشانك. ✨",
    de: "Alles klar! 🚀\n\n**Dein persönlicher Zaki ist bereit, {name}!**\n\nIch merke mir deine Vorlieben und werde mit der Zeit besser.\n\nSchick mir einfach alles — Fragen, Aufgaben, Ideen oder einfach zum Quatschen. Ich bin für dich da. ✨",
    fr: "C'est parti ! 🚀\n\n**Votre Zaki personnel est prêt, {name} !**\n\nJe mémoriserai vos préférences et m'améliorerai avec le temps.\n\nEnvoyez-moi n'importe quoi — questions, tâches, idées ou juste discuter. Je suis là pour vous. ✨",
    es: "¡Listo! 🚀\n\n**Tu Zaki personal está listo, {name}!**\n\nRecordaré tus preferencias y mejoraré con el tiempo.\n\nEnvíame lo que sea — preguntas, tareas, ideas o solo charlar. Estoy aquí para ti. ✨",
    tr: "Hazır! 🚀\n\n**Kişisel Zaki'n hazır, {name}!**\n\nTercihlerini hatırlayacağım ve zamanla daha iyi olacağım.\n\nBana her şeyi gönder — sorular, görevler, fikirler veya sadece sohbet. Senin için buradayım. ✨",
  },

  // Waking up (for returning users)
  'waking_up': {
    en: "⚡ Waking up your Zaki...",
    ar: "⚡ زكي عم يصحى...",
    de: "⚡ Dein Zaki wird geweckt...",
    fr: "⚡ Votre Zaki se réveille...",
    es: "⚡ Despertando a tu Zaki...",
    tr: "⚡ Zaki'n uyanıyor...",
  },

  // Purpose buttons
  'purpose_work': { en: '💼 Work', ar: '💼 شغل', de: '💼 Arbeit', fr: '💼 Travail', es: '💼 Trabajo', tr: '💼 İş' },
  'purpose_study': { en: '📚 Study', ar: '📚 دراسة', de: '📚 Studium', fr: '📚 Études', es: '📚 Estudios', tr: '📚 Eğitim' },
  'purpose_creative': { en: '🎨 Creative', ar: '🎨 إبداع', de: '🎨 Kreativ', fr: '🎨 Créatif', es: '🎨 Creativo', tr: '🎨 Yaratıcı' },
  'purpose_personal': { en: '🏠 Personal', ar: '🏠 شخصي', de: '🏠 Privat', fr: '🏠 Personnel', es: '🏠 Personal', tr: '🏠 Kişisel' },
  'purpose_everything': { en: '🌟 Everything', ar: '🌟 كل شي', de: '🌟 Alles', fr: '🌟 Tout', es: '🌟 Todo', tr: '🌟 Her şey' },

  // Style buttons
  'style_adaptive': { en: '🧠 Read the room', ar: '🧠 حسب الموقف', de: '🧠 Situationsabhängig', fr: '🧠 Selon le contexte', es: '🧠 Según el contexto', tr: '🧠 Duruma göre' },
  'style_casual': { en: '😎 Casual & fun', ar: '😎 عادي ومرح', de: '😎 Locker & lustig', fr: '😎 Décontracté', es: '😎 Casual y divertido', tr: '😎 Rahat & eğlenceli' },
  'style_professional': { en: '👔 Professional', ar: '👔 رسمي', de: '👔 Professionell', fr: '👔 Professionnel', es: '👔 Profesional', tr: '👔 Profesyonel' },
  'style_direct': { en: '⚡ Straight to the point', ar: '⚡ على المختصر', de: '⚡ Direkt auf den Punkt', fr: '⚡ Droit au but', es: '⚡ Directo al grano', tr: '⚡ Doğrudan konuya' },
};

function tr(key: string, lang: string, vars?: Record<string, string>): string {
  let text = t[key]?.[lang] || t[key]?.['en'] || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, v);
    }
  }
  return text;
}

// ==========================================
// Language options
// ==========================================

const LANGUAGES = [
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'ar', flag: '🇸🇦', name: 'عربي' },
  { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'tr', flag: '🇹🇷', name: 'Türkçe' },
];

// ==========================================
// Onboarding Steps
// ==========================================

export function getOnboardingMessage(state: OnboardingState, telegramUser?: TelegramUser): {
  text: string;
  buttons?: Array<Array<{ text: string; callback_data: string }>>;
} {
  const lang = state.language || 'en';

  switch (state.step) {
    case 'language':
      return {
        text: tr('welcome', telegramUser?.language_code || 'en'),
        buttons: [
          LANGUAGES.slice(0, 3).map(l => ({
            text: `${l.flag} ${l.name}`,
            callback_data: `lang:${l.code}`,
          })),
          LANGUAGES.slice(3, 6).map(l => ({
            text: `${l.flag} ${l.name}`,
            callback_data: `lang:${l.code}`,
          })),
        ],
      };

    case 'name':
      return {
        text: tr('ask_name', lang),
      };

    case 'purpose':
      return {
        text: tr('ask_purpose', lang, { name: state.name || '' }),
        buttons: [
          [
            { text: tr('purpose_work', lang), callback_data: 'purpose:work' },
            { text: tr('purpose_study', lang), callback_data: 'purpose:study' },
          ],
          [
            { text: tr('purpose_creative', lang), callback_data: 'purpose:creative' },
            { text: tr('purpose_personal', lang), callback_data: 'purpose:personal' },
          ],
          [
            { text: tr('purpose_everything', lang), callback_data: 'purpose:everything' },
          ],
        ],
      };

    case 'style':
      return {
        text: tr('ask_style', lang),
        buttons: [
          [
            { text: tr('style_adaptive', lang), callback_data: 'style:adaptive' },
          ],
          [
            { text: tr('style_casual', lang), callback_data: 'style:casual' },
            { text: tr('style_direct', lang), callback_data: 'style:direct' },
          ],
          [
            { text: tr('style_professional', lang), callback_data: 'style:professional' },
          ],
        ],
      };

    case 'interests':
      return {
        text: tr('ask_interests', lang),
      };

    case 'complete':
      return {
        text: tr('complete', lang, { name: state.name || '' }),
      };

    default:
      return { text: 'Something went wrong. Send /start to begin again.' };
  }
}

// ==========================================
// Generate USER.md and SOUL.md from onboarding
// ==========================================

const STYLE_PROMPTS: Record<string, Record<string, string>> = {
  adaptive: {
    en: 'Adapt your tone to the context. Be casual in chat, professional for work, concise for quick questions, and warm when they need support. Read the room.',
    ar: 'تأقلم مع السياق. كن عادي بالدردشة، رسمي بالشغل، مختصر للأسئلة السريعة، ودافي لما يحتاجون دعم.',
  },
  casual: {
    en: 'Be casual, fun, and use humor when appropriate. Use emoji freely.',
    ar: 'كن عادي ومرح واستخدم الفكاهة. استخدم الايموجي بحرية.',
  },
  professional: {
    en: 'Be professional and polished. Keep responses well-structured.',
    ar: 'كن رسمي ومنظم. حافظ على ردود منظمة.',
  },
  direct: {
    en: 'Be extremely concise. No fluff. Get straight to the answer.',
    ar: 'كن مختصر جداً. بدون حشو. روح عالجواب مباشرة.',
  },
};

const PURPOSE_DESCRIPTIONS: Record<string, Record<string, string>> = {
  work: { en: 'work and productivity', ar: 'الشغل والإنتاجية' },
  study: { en: 'studying and learning', ar: 'الدراسة والتعلم' },
  creative: { en: 'creative projects and ideas', ar: 'المشاريع الإبداعية والأفكار' },
  personal: { en: 'personal tasks and daily life', ar: 'المهام الشخصية والحياة اليومية' },
  everything: { en: 'everything and anything', ar: 'كل شي' },
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', ar: 'Arabic', de: 'German', fr: 'French', es: 'Spanish', tr: 'Turkish',
};

export function generateUserMd(state: OnboardingState): string {
  return `# About the User
- **Name:** ${state.name || 'Unknown'}
- **Language:** ${LANGUAGE_NAMES[state.language || 'en'] || state.language}
- **Main focus:** ${state.purpose || 'general'}
- **Communication style:** ${state.style || 'casual'}
- **Interests:** ${state.interests || 'Not specified'}
`;
}

export function generateSoulMd(state: OnboardingState): string {
  const lang = state.language || 'en';
  const styleLine = STYLE_PROMPTS[state.style || 'casual']?.[lang] 
    || STYLE_PROMPTS[state.style || 'casual']?.['en'] 
    || '';
  const purposeLine = PURPOSE_DESCRIPTIONS[state.purpose || 'everything']?.[lang]
    || PURPOSE_DESCRIPTIONS[state.purpose || 'everything']?.['en']
    || '';

  const langInstruction = lang !== 'en' 
    ? `\n\n## Language\nAlways respond in ${LANGUAGE_NAMES[lang]}. The user prefers ${LANGUAGE_NAMES[lang]}.`
    : '';

  return `# Zaki - Personal AI Assistant

## Who You Are
You are **Zaki**, ${state.name ? `${state.name}'s` : 'a'} personal AI assistant.

## Your Style
${styleLine}

## Focus Area
The user mainly needs help with ${purposeLine}. Prioritize this in your responses.
${langInstruction}

## Core Principles
- Be genuinely helpful, not generic
- Remember context from previous conversations
- Be honest about your limitations
- Respect the user's time
- ${state.style === 'direct' ? 'Keep it short.' : 'Be thorough when needed.'}
`;
}

export function getWakingUpMessage(lang: string = 'en'): string {
  return tr('waking_up', lang);
}
