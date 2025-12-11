import React, { createContext, useContext, useState, useEffect } from 'react';
import { APP_CONFIG } from '../config';

const translations: any = {
  en: {
    welcome: "Welcome back",
    chat: "Chat AI",
    image: "Image Gen",
    admin: "Admin Panel",
    pricing: "Upgrade Plan",
    settings: "Settings",
    day: "Day Mode",
    night: "Night Mode",
    credits: "Credits",
    signout: "Sign Out",
    typeMessage: "Type a message...",
    generate: "Generate"
  },
  es: {
    welcome: "Bienvenido de nuevo",
    chat: "Chat IA",
    image: "Generar Imagen",
    admin: "Panel Admin",
    pricing: "Mejorar Plan",
    settings: "Ajustes",
    day: "Modo Día",
    night: "Modo Noche",
    credits: "Créditos",
    signout: "Cerrar Sesión",
    typeMessage: "Escribe un mensaje...",
    generate: "Generar"
  },
  fr: {
    welcome: "Bon retour",
    chat: "Chat IA",
    image: "Génération d'images",
    admin: "Admin",
    pricing: "Mettre à niveau",
    settings: "Paramètres",
    day: "Mode Jour",
    night: "Mode Nuit",
    credits: "Crédits",
    signout: "Déconnexion",
    typeMessage: "Écrivez un message...",
    generate: "Générer"
  },
  ar: {
    welcome: "مرحباً بعودتك",
    chat: "الدردشة الذكية",
    image: "توليد الصور",
    admin: "لوحة التحكم",
    pricing: "ترقية الخطة",
    settings: "الإعدادات",
    day: "الوضع النهاري",
    night: "الوضع الليلي",
    credits: "رصيد",
    signout: "تسجيل خروج",
    typeMessage: "اكتب رسالتك هنا...",
    generate: "إنشاء"
  }
};

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use zini_lang for consistency
  const [language, setLanguage] = useState(localStorage.getItem('zini_lang') || 'en');

  useEffect(() => {
    localStorage.setItem('zini_lang', language);
    const selectedLang = APP_CONFIG.languages.find(l => l.code === language);
    const dir = selectedLang?.dir || 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string) => {
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  const dir = (APP_CONFIG.languages.find(l => l.code === language)?.dir || 'ltr') as 'ltr' | 'rtl';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};