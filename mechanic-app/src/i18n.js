import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const resources = {
  en: {
    translation: {
      "Good Morning": "Good Morning",
      "Good Afternoon": "Good Afternoon",
      "Good Evening": "Good Evening",
      "Logout": "Logout",
      "Total Jobs": "Total Jobs",
      "In Progress": "In Progress",
      "Your Tasks": "Your Tasks",
      "No tasks assigned yet.": "No tasks assigned yet.",
      "Profile": "Profile",
      "Language": "Language",
      "History": "History",
      "Dashboard": "Dashboard",
      "Parts Used": "Parts Used",
      "Add Part": "Add Part",
      "Select Part": "Select Part",
      "Quantity": "Quantity",
      "Document Items": "Document Items",
      "Close": "Close",
      "Submit": "Submit",
      "Status": "Status"
    }
  },
  am: {
    translation: {
      "Good Morning": "እንደምን አደሩ",
      "Good Afternoon": "እንደምን ዋሉ",
      "Good Evening": "እንደምን አመሹ",
      "Logout": "ውጣ",
      "Total Jobs": "ጠቅላላ ስራዎች",
      "In Progress": "በሂደት ላይ",
      "Your Tasks": "የስራ ዝርዝርዎ",
      "No tasks assigned yet.": "እስካሁን ምንም ስራ አልተመደበም",
      "Profile": "ፕሮፋይል",
      "Language": "ቋንቋ",
      "History": "ታሪክ",
      "Dashboard": "ዳሽቦርድ",
      "Parts Used": "ጥቅም ላይ የዋሉ እቃዎች",
      "Add Part": "እቃ አክል",
      "Select Part": "እቃ ይምረጡ",
      "Quantity": "ብዛት",
      "Document Items": "ያገለገሉ እቃዎችን መዝግብ",
      "Close": "ዝጋ",
      "Submit": "አስገባ",
      "Status": "ሁኔታ"
    }
  },
  om: {
    translation: {
      "Good Morning": "Akkam bultan",
      "Good Afternoon": "Akkam ooltan",
      "Good Evening": "Akkam galte",
      "Logout": "Bahi",
      "Total Jobs": "Hojiiwwan Waligalaa",
      "In Progress": "Hojjetamaa Jira",
      "Your Tasks": "Hojiiwwan Kee",
      "No tasks assigned yet.": "Hojiin siif kennamne.",
      "Profile": "Ibsama",
      "Language": "Afaan",
      "History": "Seenaa",
      "Dashboard": "Daashboordii",
      "Parts Used": "Meekaalee Fyadaman",
      "Add Part": "Meeshaa Ida'i",
      "Select Part": "Meeshaa Filadhu",
      "Quantity": "Baay'ina",
      "Document Items": "Meekaalee Galmeessi",
      "Close": "Cufi",
      "Submit": "Galchi",
      "Status": "Haala"
    }
  }
};

const initI18n = async () => {
  let savedLanguage = 'en';
  try {
    savedLanguage = await AsyncStorage.getItem('language') || 'en';
  } catch (error) {
    console.error('Error loading language', error);
  }

  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: savedLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false, 
      },
      compatibilityJSON: 'v3' 
    });
};

initI18n();

export default i18n;
