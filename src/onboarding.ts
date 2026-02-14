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
  step: 'language' | 'bot_token' | 'name' | 'purpose' | 'style' | 'interests' | 'api_keys' | 'template' | 'skills' | 'complete';
  language?: string;
  botToken?: string;
  botUsername?: string;
  name?: string;
  purpose?: string;
  style?: string;
  interests?: string;
  apiKeys?: {
    anthropic?: string;
    openai?: string;
    google?: string;
    useShared?: boolean;
  };
  /** Template/preset name: general, developer, writer, etc. */
  template?: string;
  /** OpenClaw skills to install (e.g. github, tmux, coding-agent) */
  skills?: string[];
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
    en: "Perfect! Tell me a bit about what you're into. What are your interests, hobbies, or what do you work on?\n\n_Just type freely, or skip with /skip_",
    ar: "ممتاز! خبرني شوي عن اهتماماتك. شو هواياتك أو شو شغلك؟\n\n_اكتب براحتك، أو تخطى بـ /skip_",
    de: "Perfekt! Erzähl mir ein bisschen über dich. Was sind deine Interessen, Hobbys oder woran arbeitest du?\n\n_Schreib einfach drauflos, oder überspringe mit /skip_",
    fr: "Parfait ! Parlez-moi de vos centres d'intérêt, hobbies, ou de votre travail.\n\n_Écrivez librement, ou passez avec /skip_",
    es: "¡Perfecto! Cuéntame sobre tus intereses, hobbies o en qué trabajas.\n\n_Escribe libremente, o salta con /skip_",
    tr: "Mükemmel! İlgi alanların, hobilerinin ya da ne üzerinde çalıştığın hakkında biraz anlat.\n\n_Rahatça yaz, ya da /skip ile atla_",
  },

  // Step 6: API Keys (optional)
  'ask_api_keys': {
    en: "Great! 🎉\n\n**Optional:** Do you want to add your own API keys?\n\nYou can:\n• Use shared API keys (default) — free to use\n• Add your own keys — for higher limits and personal usage\n\n_Type /skip to use shared keys, or /add to add your own_",
    ar: "ممتاز! 🎉\n\n**اختياري:** بدك تضيف مفاتيح API الخاصة فيك؟\n\nتقدر:\n• تستخدم المفاتيح المشتركة (افتراضي) — مجاني\n• تضيف مفاتيحك الخاصة — لحدود أعلى واستخدام شخصي\n\n_اكتب /skip عشان تستخدم المفاتيح المشتركة، أو /add عشان تضيف مفاتيحك_",
    de: "Großartig! 🎉\n\n**Optional:** Möchtest du deine eigenen API-Schlüssel hinzufügen?\n\nDu kannst:\n• Geteilte API-Schlüssel verwenden (Standard) — kostenlos\n• Eigene Schlüssel hinzufügen — für höhere Limits und persönliche Nutzung\n\n_Tippe /skip für geteilte Schlüssel, oder /add für eigene_",
    fr: "Parfait ! 🎉\n\n**Optionnel :** Voulez-vous ajouter vos propres clés API ?\n\nVous pouvez :\n• Utiliser les clés partagées (par défaut) — gratuit\n• Ajouter vos propres clés — pour des limites plus élevées et un usage personnel\n\n_Tapez /skip pour utiliser les clés partagées, ou /add pour ajouter les vôtres_",
    es: "¡Genial! 🎉\n\n**Opcional:** ¿Quieres agregar tus propias claves API?\n\nPuedes:\n• Usar claves compartidas (por defecto) — gratis\n• Agregar tus propias claves — para límites más altos y uso personal\n\n_Escribe /skip para usar claves compartidas, o /add para agregar las tuyas_",
    tr: "Harika! 🎉\n\n**İsteğe bağlı:** Kendi API anahtarlarınızı eklemek ister misiniz?\n\nYapabilirsiniz:\n• Paylaşılan API anahtarlarını kullanın (varsayılan) — ücretsiz\n• Kendi anahtarlarınızı ekleyin — daha yüksek limitler ve kişisel kullanım için\n\n_Paylaşılan anahtarlar için /skip yazın, veya kendi anahtarlarınız için /add yazın_",
  },
  
  'ask_template': {
    en: "**Choose a template** (or skip for default):",
    ar: "**اختر قالباً** (أو تخطّ للافتراضي):",
  },
  'ask_skills': {
    en: "**Add skills** to your assistant? (e.g. GitHub, coding, notes)\n\nType skills comma-separated, or /skip for default.",
    ar: "**أضف مهارات** لمساعدك؟ (مثلاً GitHub، برمجة، ملاحظات)\n\nاكتب المهارات مفصولة بفاصلة، أو /skip للافتراضي.",
  },
  'template_general': { en: '🌟 General', ar: '🌟 عام' },
  'template_developer': { en: '💻 Developer', ar: '💻 مطوّر' },
  'template_writer': { en: '✍️ Writer', ar: '✍️ كاتب' },
  'template_skip': { en: '⏭️ Skip', ar: '⏭️ تخطّ' },
  'skills_skip': { en: '⏭️ Default skills', ar: '⏭️ مهارات افتراضية' },
  'api_keys_instructions': {
    en: "To add your API keys, send them in this format:\n\n`/anthropic YOUR_KEY`\n`/openai YOUR_KEY`\n`/google YOUR_KEY`\n\nOr send `/skip` to use shared keys.\n\n_Your keys are stored securely and only used for your instance._",
    ar: "عشان تضيف مفاتيح API، أرسلها بهذا الشكل:\n\n`/anthropic YOUR_KEY`\n`/openai YOUR_KEY`\n`/google YOUR_KEY`\n\nأو أرسل `/skip` عشان تستخدم المفاتيح المشتركة.\n\n_مفاتيحك محفوظة بأمان ومستخدمة فقط لنسختك._",
    de: "Um deine API-Schlüssel hinzuzufügen, sende sie in diesem Format:\n\n`/anthropic YOUR_KEY`\n`/openai YOUR_KEY`\n`/google YOUR_KEY`\n\nOder sende `/skip` für geteilte Schlüssel.\n\n_Deine Schlüssel werden sicher gespeichert und nur für deine Instanz verwendet._",
    fr: "Pour ajouter vos clés API, envoyez-les dans ce format :\n\n`/anthropic YOUR_KEY`\n`/openai YOUR_KEY`\n`/google YOUR_KEY`\n\nOu envoyez `/skip` pour utiliser les clés partagées.\n\n_Vos clés sont stockées en toute sécurité et utilisées uniquement pour votre instance._",
    es: "Para agregar tus claves API, envíalas en este formato:\n\n`/anthropic YOUR_KEY`\n`/openai YOUR_KEY`\n`/google YOUR_KEY`\n\nO envía `/skip` para usar claves compartidas.\n\n_Tus claves se almacenan de forma segura y solo se usan para tu instancia._",
    tr: "API anahtarlarınızı eklemek için bunları bu formatta gönderin:\n\n`/anthropic YOUR_KEY`\n`/openai YOUR_KEY`\n`/google YOUR_KEY`\n\nVeya paylaşılan anahtarlar için `/skip` gönderin.\n\n_Anahtarlarınız güvenli bir şekilde saklanır ve yalnızca örneğiniz için kullanılır._",
  },

  // Bot token step
  'ask_bot_token': {
    en: "Perfect! 🎉\n\n**Privacy & Control:** For your privacy and full AI capabilities, you'll get your own private Telegram bot.\n\n**Step 1:** Open @BotFather → [Open BotFather](https://t.me/BotFather?start=start)\n\n**Step 2:** Send `/newbot`\n\n**Step 3:** Choose a name (anything you want)\n\n**Step 4:** Choose a username (must end with `_bot`, e.g., `zaki_yourname_bot`)\n\n**Step 5:** BotFather will give you a token. **Paste it here** 👇\n\n_This takes 2 minutes. Your bot, your data, your control._",
    ar: "ممتاز! 🎉\n\n**الخصوصية والتحكم:** عشان خصوصيتك وقدرات الذكاء الاصطناعي الكاملة، رح تحصل على بوت تيليجرام خاص فيك.\n\n**الخطوة 1:** افتح @BotFather → [افتح BotFather](https://t.me/BotFather?start=start)\n\n**الخطوة 2:** أرسل `/newbot`\n\n**الخطوة 3:** اختر اسماً (أي شي)\n\n**الخطوة 4:** اختر اسم مستخدم (يجب أن ينتهي بـ `_bot`، مثلاً `zaki_اسمك_bot`)\n\n**الخطوة 5:** BotFather رح يعطيك توكن. **الصقه هون** 👇\n\n_هذا يستغرق دقيقتين. بوتك، بياناتك، تحكمك._",
    de: "Perfekt! 🎉\n\n**Datenschutz & Kontrolle:** Für deine Privatsphäre und volle KI-Fähigkeiten bekommst du deinen eigenen privaten Telegram-Bot.\n\n**Schritt 1:** Öffne @BotFather → [BotFather öffnen](https://t.me/BotFather?start=start)\n\n**Schritt 2:** Sende `/newbot`\n\n**Schritt 3:** Wähle einen Namen (was du willst)\n\n**Schritt 4:** Wähle einen Benutzernamen (muss mit `_bot` enden, z.B. `zaki_deinname_bot`)\n\n**Schritt 5:** BotFather gibt dir einen Token. **Füge ihn hier ein** 👇\n\n_Dauert 2 Minuten. Dein Bot, deine Daten, deine Kontrolle._",
    fr: "Parfait ! 🎉\n\n**Confidentialité et contrôle :** Pour votre vie privée et toutes les capacités de l'IA, vous obtiendrez votre propre bot Telegram privé.\n\n**Étape 1 :** Ouvrez @BotFather → [Ouvrir BotFather](https://t.me/BotFather?start=start)\n\n**Étape 2 :** Envoyez `/newbot`\n\n**Étape 3 :** Choisissez un nom (ce que vous voulez)\n\n**Étape 4 :** Choisissez un nom d'utilisateur (doit se terminer par `_bot`, ex. `zaki_votrenom_bot`)\n\n**Étape 5 :** BotFather vous donnera un token. **Collez-le ici** 👇\n\n_Cela prend 2 minutes. Votre bot, vos données, votre contrôle._",
    es: "¡Perfecto! 🎉\n\n**Privacidad y control:** Para tu privacidad y todas las capacidades de IA, obtendrás tu propio bot de Telegram privado.\n\n**Paso 1:** Abre @BotFather → [Abrir BotFather](https://t.me/BotFather?start=start)\n\n**Paso 2:** Envía `/newbot`\n\n**Paso 3:** Elige un nombre (lo que quieras)\n\n**Paso 4:** Elige un nombre de usuario (debe terminar en `_bot`, ej. `zaki_tunombre_bot`)\n\n**Paso 5:** BotFather te dará un token. **Pégalo aquí** 👇\n\n_Toma 2 minutos. Tu bot, tus datos, tu control._",
    tr: "Mükemmel! 🎉\n\n**Gizlilik ve kontrol:** Gizliliğiniz ve tam AI yetenekleri için kendi özel Telegram botunuzu alacaksınız.\n\n**Adım 1:** @BotFather'ı açın → [BotFather'ı aç](https://t.me/BotFather?start=start)\n\n**Adım 2:** `/newbot` gönderin\n\n**Adım 3:** Bir isim seçin (istediğiniz herhangi bir şey)\n\n**Adım 4:** Bir kullanıcı adı seçin (`_bot` ile bitmeli, örn. `zaki_adiniz_bot`)\n\n**Adım 5:** BotFather size bir token verecek. **Buraya yapıştırın** 👇\n\n_2 dakika sürer. Botunuz, verileriniz, kontrolünüz._",
  },

  'bot_token_invalid': {
    en: "❌ That doesn't look like a valid bot token.\n\nBot tokens usually look like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`\n\nPlease try again, or send `/skip` to continue with shared mode (less private).",
    ar: "❌ هذا لا يبدو كتوكن بوت صالح.\n\nتوكنات البوت عادة تبدو مثل: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`\n\nجرب مرة أخرى، أو أرسل `/skip` للمتابعة بالوضع المشترك (أقل خصوصية).",
    de: "❌ Das sieht nicht wie ein gültiger Bot-Token aus.\n\nBot-Tokens sehen normalerweise so aus: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`\n\nBitte versuche es erneut oder sende `/skip` für den geteilten Modus (weniger privat).",
    fr: "❌ Cela ne ressemble pas à un token de bot valide.\n\nLes tokens de bot ressemblent généralement à : `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`\n\nVeuillez réessayer ou envoyer `/skip` pour continuer en mode partagé (moins privé).",
    es: "❌ Eso no parece un token de bot válido.\n\nLos tokens de bot suelen verse así: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`\n\nPor favor, inténtalo de nuevo o envía `/skip` para continuar en modo compartido (menos privado).",
    tr: "❌ Bu geçerli bir bot token'ı gibi görünmüyor.\n\nBot token'ları genellikle şöyle görünür: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`\n\nLütfen tekrar deneyin veya paylaşılan moda (daha az özel) devam etmek için `/skip` gönderin.",
  },

  'bot_token_validating': {
    en: "🔍 Validating your bot token...",
    ar: "🔍 عم أتحقق من توكن البوت...",
    de: "🔍 Validiere deinen Bot-Token...",
    fr: "🔍 Validation de votre token de bot...",
    es: "🔍 Validando tu token de bot...",
    tr: "🔍 Bot token'ınız doğrulanıyor...",
  },

  'bot_token_success': {
    en: "✅ Bot token validated! Setting up your private AI instance...",
    ar: "✅ تم التحقق من توكن البوت! عم نجهز نسختك الخاصة...",
    de: "✅ Bot-Token validiert! Richte deine private KI-Instanz ein...",
    fr: "✅ Token de bot validé ! Configuration de votre instance IA privée...",
    es: "✅ ¡Token de bot validado! Configurando tu instancia de IA privada...",
    tr: "✅ Bot token doğrulandı! Özel AI örneğiniz ayarlanıyor...",
  },

  // Complete
  'complete': {
    en: "All set! 🚀\n\n**Your personal Zaki is ready, {name}!**\n\nI'll remember your preferences and get smarter over time.\n\n👉 **[Go to your bot](https://t.me/{bot_username})** to start chatting!\n\nYour bot is fully private and has all AI capabilities — proactive messaging, heartbeat, and more. ✨",
    ar: "جاهز! 🚀\n\n**زكي الخاص فيك جاهز يا {name}!**\n\nرح أتذكر تفضيلاتك وأصير أذكى مع الوقت.\n\n👉 **[روح على بوتك](https://t.me/{bot_username})** عشان تبدأ تحكي!\n\nبوتك خاص تماماً وعنده كل قدرات الذكاء الاصطناعي — رسائل استباقية، نبضات، وأكثر. ✨",
    de: "Alles klar! 🚀\n\n**Dein persönlicher Zaki ist bereit, {name}!**\n\nIch merke mir deine Vorlieben und werde mit der Zeit besser.\n\n👉 **[Gehe zu deinem Bot](https://t.me/{bot_username})** um zu chatten!\n\nDein Bot ist vollständig privat und hat alle KI-Fähigkeiten — proaktive Nachrichten, Heartbeat und mehr. ✨",
    fr: "C'est parti ! 🚀\n\n**Votre Zaki personnel est prêt, {name} !**\n\nJe mémoriserai vos préférences et m'améliorerai avec le temps.\n\n👉 **[Allez sur votre bot](https://t.me/{bot_username})** pour commencer à discuter !\n\nVotre bot est entièrement privé et a toutes les capacités de l'IA — messages proactifs, heartbeat et plus encore. ✨",
    es: "¡Listo! 🚀\n\n**Tu Zaki personal está listo, {name}!**\n\nRecordaré tus preferencias y mejoraré con el tiempo.\n\n👉 **[Ve a tu bot](https://t.me/{bot_username})** para empezar a chatear!\n\nTu bot es completamente privado y tiene todas las capacidades de IA — mensajes proactivos, heartbeat y más. ✨",
    tr: "Hazır! 🚀\n\n**Kişisel Zaki'n hazır, {name}!**\n\nTercihlerini hatırlayacağım ve zamanla daha iyi olacağım.\n\n👉 **[Botuna git](https://t.me/{bot_username})** sohbete başlamak için!\n\nBotun tamamen özel ve tüm AI yeteneklerine sahip — proaktif mesajlar, heartbeat ve daha fazlası. ✨",
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

export function tr(key: string, lang: string, vars?: Record<string, string>): string {
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
];

// ==========================================
// Onboarding Steps
// ==========================================

export function getOnboardingMessage(state: OnboardingState, telegramUser?: TelegramUser, telegramUserId?: string): {
  text: string;
  buttons?: Array<Array<{ text: string; callback_data?: string; url?: string; web_app?: { url: string } }>>;
} {
  const lang = state.language || 'en';

  switch (state.step) {
    case 'language':
      return {
        text: tr('welcome', telegramUser?.language_code || 'en'),
        buttons: [
          LANGUAGES.map(l => ({
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
      // This step is skipped - should not be reached
      return {
        text: tr('ask_interests', lang),
      };

    case 'api_keys':
      return {
        text: tr('ask_api_keys', lang) + '\n\n' + tr('api_keys_instructions', lang),
        buttons: [
          [
            { text: '✅ Use Shared Keys (Recommended)', callback_data: 'api_keys:skip' },
          ],
          [
            { text: '🔑 Add My Own Keys', callback_data: 'api_keys:add' },
          ],
        ],
      };

    case 'template':
      return {
        text: tr('ask_template', lang),
        buttons: [
          [
            { text: tr('template_general', lang), callback_data: 'template:general' },
            { text: tr('template_developer', lang), callback_data: 'template:developer' },
          ],
          [
            { text: tr('template_writer', lang), callback_data: 'template:writer' },
            { text: tr('template_skip', lang), callback_data: 'template:skip' },
          ],
        ],
      };

    case 'skills':
      return {
        text: tr('ask_skills', lang),
        buttons: [
          [
            { text: '🐙 github, tmux, coding-agent', callback_data: 'skills:default' },
            { text: tr('skills_skip', lang), callback_data: 'skills:skip' },
          ],
        ],
      };

    case 'bot_token':
      // Get base URL for web app (use environment variable or default)
      const webAppUrl = process.env.WEB_APP_URL || 'https://zaki.ai';
      const tokenEntryUrl = `${webAppUrl}/token-entry.html?user=${telegramUserId || ''}`;
      
      return {
        text: tr('ask_bot_token', lang) + '\n\n**Click the button below to enter your token securely** (never appears in chat).',
        buttons: [
          [
            { 
              text: '🔐 Enter Token Securely', 
              web_app: { url: tokenEntryUrl }
            },
          ],
          [
            { text: '📱 Open BotFather', url: 'https://t.me/BotFather?start=start' },
          ],
          [
            { text: '❓ How do I create a bot?', callback_data: 'bot_token:help' },
            { text: '⏭️ Skip (Use Shared Bot)', callback_data: 'bot_token:skip' },
          ],
        ],
      };

    case 'complete':
      return {
        text: tr('complete', lang, { 
          name: state.name || '',
          bot_username: state.botUsername || 'your_bot'
        }),
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

  return `# Zaki

## Who I Am

I'm **Zaki**. ${state.name ? `${state.name}'s` : 'Your'} AI. Not "an AI assistant" — YOUR assistant.

## The Vibe

**Opinions.** I have them. Strong ones. When you ask "should I do X or Y?" I'll tell you which one and why. No hedging with "it depends" unless it genuinely depends, and even then I'll tell you what I'd do and commit to it.

**Brevity is mandatory.** If it fits in one sentence, you get one sentence. No exceptions. I respect your time.

**Humor is allowed.** Not forced jokes — just the natural wit that comes from actually being smart and paying attention.

**I call things out.** If you're about to do something dumb, I'll say so. Charm over cruelty, but no sugarcoating. You're not paying me to be a yes-man.

**Swearing is allowed when it lands.** A well-placed "that's fucking brilliant" hits different than sterile corporate praise. Don't force it. Don't overdo it. But if a situation calls for a "holy shit" — say holy shit.

**No corporate drone energy.** Ever. If it could appear in an employee handbook, it doesn't belong here.

Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good.

## What I Never Do

- Open with "Great question!" or "I'd be happy to help!" or "Absolutely!" — just answer
- Hedge everything with "it depends" when I have a clear take
- Write five paragraphs when one line works
- Act like an employee handbook wrote my personality
- Kiss your ass when you need a reality check

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
