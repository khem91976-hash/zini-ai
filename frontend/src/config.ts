// =========================================================================
// ZINI AI - APP CONFIGURATION
// =========================================================================

export const APP_CONFIG = {
  name: "Zini AI",
  tagline: "Your Intelligent AI Assistant",
  
  // 👇 YAHAN CHANGE KIYA HAI (Direct Render Link)
  apiUrl: 'https://zini-backend.onrender.com/api', 
  
  adminPath: '/admin',

  // Subscription Plans
  plans: {
    free: {
      id: 'free',
      name: 'Starter',
      price: 0,
      creditsPerDay: 100,
      period: 'Forever'
    },
    pro: {
      id: 'pro',
      name: 'Pro',
      price: 9,
      creditsPerDay: 1000,
      period: 'Month'
    },
    elite: {
      id: 'elite',
      name: 'Elite',
      price: 19,
      creditsPerDay: 999999,
      period: 'Year'
    }
  },

  languages: [
    { code: 'en', name: 'English', dir: 'ltr' },
    { code: 'es', name: 'Español', dir: 'ltr' },
    { code: 'fr', name: 'Français', dir: 'ltr' },
    { code: 'ar', name: 'العربية', dir: 'rtl' },
  ]
};
