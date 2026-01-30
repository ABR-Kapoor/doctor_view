// Simple translation cache to store translations
const translationCache = new Map<string, Map<string, string>>();

// Basic translations for common UI elements
const staticTranslations: Record<string, Record<string, string>> = {
  // Navigation
  'Dashboard': {
    es: 'Panel de control',
    hi: 'डैशबोर्ड',
    fr: 'Tableau de bord',
    de: 'Armaturenbrett',
    zh: '仪表板',
    ar: 'لوحة القيادة',
    pt: 'Painel',
    ja: 'ダッシュボード',
    bn: 'ড্যাশবোর্ড',
    te: 'డాష్‌బోర్డ్',
    mr: 'डॅशबोर्ड',
    ta: 'டாஷ்போர்டு',
    gu: 'ડેશબોર્ડ',
  },
  'Sign In': {
    es: 'Iniciar sesión',
    hi: 'साइन इन करें',
    fr: 'Se connecter',
    de: 'Anmelden',
    zh: '登录',
    ar: 'تسجيل الدخول',
    pt: 'Entrar',
    ja: 'サインイン',
    bn: 'সাইন ইন',
    te: 'సైన్ ఇన్',
    mr: 'साइन इन',
    ta: 'உள்நுழைய',
    gu: 'સાઇન ઇન',
  },
  'Find Your Suitable': {
    es: 'Encuentra tu Adecuado',
    hi: 'अपने उपयुक्त खोजें',
    fr: 'Trouvez votre Approprié',
    de: 'Finden Sie Ihren Passenden',
    zh: '找到您合适的',
    ar: 'ابحث عن المناسب',
    pt: 'Encontre seu Adequado',
    ja: 'あなたに適したものを見つける',
    bn: 'আপনার উপযুক্ত খুঁজুন',
    te: 'మీకు అనుకూలమైనది కనుగొనండి',
    mr: 'तुमचे योग्य शोधा',
    ta: 'உங்களுக்கு ஏற்றதைக் கண்டறியவும்',
    gu: 'તમારા યોગ્ય શોધો',
  },
  'Expert Doctor': {
    es: 'Doctor Experto',
    hi: 'विशेषज्ञ डॉक्टर',
    fr: 'Médecin Expert',
    de: 'Facharzt',
    zh: '专家医生',
    ar: 'طبيب خبير',
    pt: 'Médico Especialista',
    ja: '専門医',
    bn: 'বিশেষজ্ঞ ডাক্তার',
    te: 'నిపుణుడు వైద్యుడు',
    mr: 'तज्ञ डॉक्टर',
    ta: 'நிபுணர் மருத்துவர்',
    gu: 'નિષ્ણાત ડૉક્ટર',
  },
  'AI-Powered Doctor Discovery': {
    es: 'Descubrimiento de Médicos con IA',
    hi: 'एआई-संचालित डॉक्टर खोज',
    fr: 'Découverte de Médecins par IA',
    de: 'KI-gestützte Arztsuche',
    zh: 'AI驱动的医生发现',
    ar: 'اكتشاف الأطباء بالذكاء الاصطناعي',
    pt: 'Descoberta de Médicos com IA',
    ja: 'AI搭載医師検索',
    bn: 'AI-চালিত ডাক্তার আবিষ্কার',
    te: 'AI-ఆధారిత వైద్యుల కనుగొనడం',
    mr: 'AI-चालित डॉक्टर शोध',
    ta: 'AI-இயங்கும் மருத்துவர் கண்டுபிடிப்பு',
    gu: 'AI-સંચાલિત ડૉક્ટર શોધ',
  },
  'Describe your symptoms and let AI recommend the best verified practitioners': {
    es: 'Describe tus síntomas y deja que la IA recomiende los mejores profesionales verificados',
    hi: 'अपने लक्षणों का वर्णन करें और एआई को सर्वश्रेष्ठ सत्यापित चिकित्सकों की सिफारिश करने दें',
    fr: 'Décrivez vos symptômes et laissez l\'IA recommander les meilleurs praticiens vérifiés',
    de: 'Beschreiben Sie Ihre Symptome und lassen Sie KI die besten verifizierten Praktiker empfehlen',
    zh: '描述您的症状，让AI推荐最佳认证医生',
    ar: 'صف أعراضك ودع الذكاء الاصطناعي يوصي بأفضل الممارسين المعتمدين',
    pt: 'Descreva seus sintomas e deixe a IA recomendar os melhores profissionais verificados',
    ja: '症状を説明し、AIに最高の認証された医師を推薦させてください',
    bn: 'আপনার লক্ষণগুলি বর্ণনা করুন এবং AI কে সেরা যাচাইকৃত অনুশীলনকারীদের সুপারিশ করতে দিন',
    te: 'మీ లక్షణాలను వివరించండి మరియు AI ఉత్తమ ధృవీకరించబడిన అభ్యాసకులను సిఫార్సు చేయనివ్వండి',
    mr: 'तुमची लक्षणे वर्णन करा आणि AI ला सर्वोत्तम सत्यापित व्यावसायिकांची शिफारस करू द्या',
    ta: 'உங்கள் அறிகுறிகளை விவரிக்கவும் மற்றும் AI சிறந்த சரிபார்க்கப்பட்ட பயிற்சியாளர்களை பரிந்துரைக்க அனுமதிக்கவும்',
    gu: 'તમારા લક્ષણોનું વર્ણન કરો અને AI ને શ્રેષ્ઠ ચકાસાયેલ પ્રેક્ટિશનર્સની ભલામણ કરવા દો',
  },
  'AI-Powered Matching': {
    es: 'Coincidencia con IA',
    hi: 'एआई-संचालित मिलान',
    fr: 'Correspondance par IA',
    de: 'KI-gestütztes Matching',
    zh: 'AI匹配',
    ar: 'مطابقة بالذكاء الاصطناعي',
    pt: 'Correspondência com IA',
    ja: 'AIマッチング',
    bn: 'AI-চালিত ম্যাচিং',
    te: 'AI-ఆధారిత సరిపోలిక',
    mr: 'AI-चालित जुळणी',
    ta: 'AI-இயங்கும் பொருத்தம்',
    gu: 'AI-સંચાલિત મેચિંગ',
  },
  'Our AI analyzes your symptoms to find the perfect specialist': {
    es: 'Nuestra IA analiza tus síntomas para encontrar al especialista perfecto',
    hi: 'हमारा एआई आपके लक्षणों का विश्लेषण करके सही विशेषज्ञ ढूंढता है',
    fr: 'Notre IA analyse vos symptômes pour trouver le spécialiste parfait',
    de: 'Unsere KI analysiert Ihre Symptome, um den perfekten Spezialisten zu finden',
    zh: '我们的AI分析您的症状以找到完美的专家',
    ar: 'يحلل الذكاء الاصطناعي لدينا أعراضك للعثور على الأخصائي المثالي',
    pt: 'Nossa IA analisa seus sintomas para encontrar o especialista perfeito',
    ja: '私たちのAIはあなたの症状を分析して完璧な専門家を見つけます',
    bn: 'আমাদের AI আপনার লক্ষণগুলি বিশ্লেষণ করে নিখুঁত বিশেষজ্ঞ খুঁজে পায়',
    te: 'మా AI మీ లక్షణాలను విశ్లేషించి పరిపూర్ణ నిపుణుడిని కనుగొంటుంది',
    mr: 'आमचा AI तुमच्या लक्षणांचे विश्लेषण करून परिपूर्ण तज्ञ शोधतो',
    ta: 'எங்கள் AI உங்கள் அறிகுறிகளை பகுப்பாய்வு செய்து சரியான நிபுணரைக் கண்டறியும்',
    gu: 'અમારી AI તમારા લક્ષણોનું વિશ્લેષણ કરીને સંપૂર્ણ નિષ્ણાત શોધે છે',
  },
  'Verified Practitioners': {
    es: 'Profesionales Verificados',
    hi: 'सत्यापित चिकित्सक',
    fr: 'Praticiens Vérifiés',
    de: 'Verifizierte Praktiker',
    zh: '认证医生',
    ar: 'ممارسون معتمدون',
    pt: 'Profissionais Verificados',
    ja: '認証された医師',
    bn: 'যাচাইকৃত অনুশীলনকারী',
    te: 'ధృవీకరించబడిన అభ్యాసకులు',
    mr: 'सत्यापित व्यावसायिक',
    ta: 'சரிபார்க்கப்பட்ட பயிற்சியாளர்கள்',
    gu: 'ચકાસાયેલ પ્રેક્ટિશનર્સ',
  },
  'All doctors are certified Ayurvedic professionals': {
    es: 'Todos los médicos son profesionales ayurvédicos certificados',
    hi: 'सभी डॉक्टर प्रमाणित आयुर्वेदिक पेशेवर हैं',
    fr: 'Tous les médecins sont des professionnels ayurvédiques certifiés',
    de: 'Alle Ärzte sind zertifizierte ayurvedische Fachleute',
    zh: '所有医生都是认证的阿育吠陀专业人士',
    ar: 'جميع الأطباء محترفون أيورفيديون معتمدون',
    pt: 'Todos os médicos são profissionais ayurvédicos certificados',
    ja: 'すべての医師は認定されたアーユルヴェーダの専門家です',
    bn: 'সমস্ত ডাক্তার প্রত্যয়িত আয়ুর্বেদিক পেশাদার',
    te: 'అన్ని వైద్యులు ధృవీకరించబడిన ఆయుర్వేద నిపుణులు',
    mr: 'सर्व डॉक्टर प्रमाणित आयुर्वेदिक व्यावसायिक आहेत',
    ta: 'அனைத்து மருத்துவர்களும் சான்றளிக்கப்பட்ட ஆயுர்வேத நிபுணர்கள்',
    gu: 'બધા ડૉક્ટરો પ્રમાણિત આયુર્વેદિક વ્યાવસાયિકો છે',
  },
  'Personalized Care': {
    es: 'Atención Personalizada',
    hi: 'व्यक्तिगत देखभाल',
    fr: 'Soins Personnalisés',
    de: 'Personalisierte Pflege',
    zh: '个性化护理',
    ar: 'رعاية شخصية',
    pt: 'Cuidado Personalizado',
    ja: 'パーソナライズドケア',
    bn: 'ব্যক্তিগত যত্ন',
    te: 'వ్యక్తిగత సంరక్షణ',
    mr: 'वैयक्तिक काळजी',
    ta: 'தனிப்பயனாக்கப்பட்ட பராமரிப்பு',
    gu: 'વ્યક્તિગત સંભાળ',
  },
  'Get tailored treatment plans based on your unique needs': {
    es: 'Obtenga planes de tratamiento personalizados según sus necesidades únicas',
    hi: 'अपनी अनूठी आवश्यकताओं के आधार पर अनुकूलित उपचार योजनाएं प्राप्त करें',
    fr: 'Obtenez des plans de traitement personnalisés en fonction de vos besoins uniques',
    de: 'Erhalten Sie maßgeschneiderte Behandlungspläne basierend auf Ihren individuellen Bedürfnissen',
    zh: '根据您的独特需求获得量身定制的治疗计划',
    ar: 'احصل على خطط علاج مخصصة بناءً على احتياجاتك الفريدة',
    pt: 'Obtenha planos de tratamento personalizados com base em suas necessidades únicas',
    ja: 'あなたのユニークなニーズに基づいてカスタマイズされた治療計画を取得',
    bn: 'আপনার অনন্য চাহিদার উপর ভিত্তি করে কাস্টমাইজড চিকিত্সা পরিকল্পনা পান',
    te: 'మీ ప్రత్యేక అవసరాల ఆధారంగా అనుకూలీకరించిన చికిత్స ప్రణాళికలను పొందండి',
    mr: 'तुमच्या अद्वितीय गरजांवर आधारित सानुकूलित उपचार योजना मिळवा',
    ta: 'உங்கள் தனித்துவமான தேவைகளின் அடிப்படையில் தனிப்பயனாக்கப்பட்ட சிகிச்சை திட்டங்களைப் பெறுங்கள்',
    gu: 'તમારી અનન્ય જરૂરિયાતોના આધારે અનુરૂપ સારવાર યોજનાઓ મેળવો',
  },
};

export function getStaticTranslation(text: string, locale: string): string | null {
  if (locale === 'en' || !text) return null;
  
  const translations = staticTranslations[text];
  if (translations && translations[locale]) {
    return translations[locale];
  }
  
  return null;
}

export function getCachedTranslation(text: string, locale: string): string | null {
  const localeCache = translationCache.get(locale);
  if (localeCache) {
    return localeCache.get(text) || null;
  }
  return null;
}

export function setCachedTranslation(text: string, locale: string, translation: string): void {
  let localeCache = translationCache.get(locale);
  if (!localeCache) {
    localeCache = new Map();
    translationCache.set(locale, localeCache);
  }
  localeCache.set(text, translation);
}
