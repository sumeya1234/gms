import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      login: "Login",
      dashboard: "Dashboard",
      garages: "Garages",
      users: "Users"
    }
  },
  am: {
    translation: {
      login: "ግቡ",
      dashboard: "ዳሽቦርድ",
      garages: "ጋራዦች",
      users: "ተጠቃሚዎች"
    }
  },
  om: {
    translation: {
      login: "Seeni",
      dashboard: "Daashboordii",
      garages: "Garaajota",
      users: "Fayadamtoota"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
