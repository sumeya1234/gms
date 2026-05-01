import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const resources = {
  en: {
    translation: {
      "Welcome": "Welcome",
      "Login": "Login",
      "Email": "Email Address",
      "Password": "Password",
      "Register": "Register",
      "Home": "Home",
      "History": "History",
      "Vehicles": "Vehicles",
      "Completed": "Completed",
      "Profile": "Profile",
      "Add Work": "Add New work",
      "Good Day": "Good Day!",
      "Lets start our work": "Let's start our work",
      "Ongoing Service Jobs": "Ongoing Service Jobs",
      "See all": "See all →",
      "Search": "Search",
      "Logout": "Logout",
      "Find service, repair, or garage...": "Find service, repair, or garage...",
      "Emergency Assistance": "Emergency Assistance",
      "All": "All",
      "Towing": "Towing",
      "Diagnostics": "Diagnostics",
      "Tires": "Tires",
      "Oil Change": "Oil Change",
      "Repair": "Repair",
      "Battery": "Battery",
      "Electrical": "Electrical",
      "Preferences": "Preferences",
      "Account Details": "Account Details",
      "Full Name": "Full Name",
      "Phone": "Phone",
      "Help & Support": "Help & Support",
      "Edit": "Edit",
      "Save": "Save",
      "My Garage": "My Garage",
      "Add Vehicle": "Add Vehicle",
      "Service Request": "Service Request",
      "Service Feedback": "Service Feedback",
      "Rate Service": "Rate Service"
    }
  },
  am: {
    translation: {
      "Welcome": "እንኳን ደህና መጡ",
      "Login": "ግባ",
      "Email": "ኢሜይል",
      "Password": "የይለፍ ቃል",
      "Register": "ይመዝገቡ",
      "Home": "ዋና ገጽ",
      "History": "ታሪክ",
      "Vehicles": "ተሽከርካሪዎች",
      "Completed": "የተጠናቀቁ",
      "Profile": "መገለጫ",
      "Add Work": "አዲስ ስራ ያክሉ",
      "Good Day": "መልካም ቀን!",
      "Lets start our work": "ስራችንን እንጀምር",
      "Ongoing Service Jobs": "እየተሰሩ ያሉ አገልግሎቶች",
      "See all": "ሁሉንም ይመልከቱ →",
      "Search": "ፈልግ",
      "Logout": "ውጣ",
      "Find service, repair, or garage...": "አገልግሎት፣ ጥገና ወይም ጋራዥ ያግኙ...",
      "Emergency Assistance": "የድንገተኛ እርዳታ",
      "All": "ሁሉም",
      "Towing": "መጎተት",
      "Diagnostics": "ምርመራ",
      "Tires": "ጎማዎች",
      "Oil Change": "የዘይት ቅያሪ",
      "Repair": "ጥገና",
      "Battery": "ባትሪ",
      "Electrical": "የኤሌክትሪክ",
      "Preferences": "ምርጫዎች",
      "Account Details": "የመለያ ዝርዝሮች",
      "Full Name": "ሙሉ ስም",
      "Phone": "ስልክ",
      "Help & Support": "እርዳታ እና ድጋፍ",
      "Edit": "አስተካክል",
      "Save": "አስቀምጥ",
      "My Garage": "የእኔ ጋራዥ",
      "Add Vehicle": "ተሽከርካሪ ያክሉ",
      "Service Request": "የአገልግሎት ጥያቄ",
      "Service Feedback": "የአገልግሎት ግብረመልስ",
      "Rate Service": "አገልግሎት ይገምግሙ"
    }
  },
  om: {
    translation: {
      "Welcome": "Baga nagaan dhuftan",
      "Login": "Seeni",
      "Email": "Imeelii",
      "Password": "Icciitii",
      "Register": "Galmaa'i",
      "Home": "Galo",
      "History": "Seenaa",
      "Vehicles": "Konkolaattota",
      "Completed": "Kan xumurame",
      "Profile": "Ibsama",
      "Add Work": "Hojii haaraa dabali",
      "Good Day": "Guyyaa Gaarii!",
      "Lets start our work": "Hojii keenya haa eegallu",
      "Ongoing Service Jobs": "Hojiiwwan tajaajilaa itti fufan",
      "See all": "Hunda ilaali →",
      "Search": "Barbaadi",
      "Logout": "Bahi",
      "Find service, repair, or garage...": "Tajaajila, suphaa ykn gaaraajii barbaadi...",
      "Emergency Assistance": "Gargaarsa Hatattamaa",
      "All": "Hunda",
      "Towing": "Harkisuu",
      "Diagnostics": "Qorannoo Yaalaa",
      "Tires": "Gomaa",
      "Oil Change": "Zayitii Jijjiiruu",
      "Repair": "Suphaa",
      "Battery": "Baatirii",
      "Electrical": "Elektirikii",
      "Preferences": "Filannoowwan",
      "Account Details": "Tarree Herregaa",
      "Full Name": "Maqaa Guutuu",
      "Phone": "Bilbila",
      "Help & Support": "Gargaarsa & Deeggarsa",
      "Edit": "Sirreessi",
      "Save": "Olkaa'i",
      "My Garage": "Gaaraajii Koo",
      "Add Vehicle": "Konkolaataa Dabali",
      "Service Request": "Gaaffii Tajaajilaa",
      "Service Feedback": "Yaada Tajaajilaa",
      "Rate Service": "Tajaajila Madaali"
    }
  }
};

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    const savedDataJSON = await AsyncStorage.getItem('user-language');
    const lng = savedDataJSON ? savedDataJSON : 'en';
    callback(lng);
  },
  init: () => {},
  cacheUserLanguage: async (lng) => {
    await AsyncStorage.setItem('user-language', lng);
  }
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, 
    },
    compatibilityJSON: 'v3',
  });

export default i18n;
