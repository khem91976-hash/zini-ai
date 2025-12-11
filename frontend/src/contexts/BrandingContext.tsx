import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { APP_CONFIG } from '../config';

interface BrandingContextType {
  appName: string;
  primaryColor: string;
  secondaryColor: string;
  refreshBranding: () => void;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appName, setAppName] = useState(APP_CONFIG.name);
  const [primaryColor, setPrimaryColor] = useState('#4f46e5'); // Default Indigo
  const [secondaryColor, setSecondaryColor] = useState('#9333ea'); // Default Purple

  const fetchBranding = async () => {
    try {
      const res = await api.get('/settings/branding');
      if (res.data.app_name) setAppName(res.data.app_name);
      if (res.data.app_primary_color) setPrimaryColor(res.data.app_primary_color);
      if (res.data.app_secondary_color) setSecondaryColor(res.data.app_secondary_color);
    } catch (e) {
      console.warn("Using default branding (API not reachable or not set)");
    }
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  useEffect(() => {
    // Apply Colors to CSS Variables dynamically
    const root = document.documentElement;
    root.style.setProperty('--primary', primaryColor);
    root.style.setProperty('--secondary', secondaryColor);
    
    // Update Title
    document.title = appName;
  }, [appName, primaryColor, secondaryColor]);

  return (
    <BrandingContext.Provider value={{ appName, primaryColor, secondaryColor, refreshBranding: fetchBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) throw new Error('useBranding must be used within a BrandingProvider');
  return context;
};