import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: { translation: { login: 'Login', dashboard: 'Dashboard' } },
  am: { translation: { login: 'ግባ', dashboard: 'ዳሽቦርድ' } },
  om: { translation: { login: 'Seeni', dashboard: 'Daashboordii' } },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en', // Default language
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
