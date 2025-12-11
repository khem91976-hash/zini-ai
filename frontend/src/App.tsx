import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Chat from './pages/Chat';
import ImageGen from './pages/ImageGen';
import Admin from './pages/Admin';
import Pricing from './pages/Pricing';
import api from './utils/api';
import { User, UserRole } from './types';
import { Loader2 } from 'lucide-react';
import { APP_CONFIG } from './config';
import { LanguageProvider } from './contexts/LanguageContext';
import { BrandingProvider } from './contexts/BrandingContext';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState(window.location.hash.slice(1) || '/');
  
  // Theme Management
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('zini_theme') === 'dark';
  });

  useEffect(() => {
    const handleHashChange = () => setCurrentPath(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('zini_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('zini_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  useEffect(() => {
    const token = localStorage.getItem('zini_token');
    if (token) {
      api.get('/auth/me')
         .then(res => setUser(res.data))
         .catch(() => localStorage.removeItem('zini_token'))
         .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (u: User) => setUser(u);
  const handleLogout = () => {
    localStorage.removeItem('zini_token');
    setUser(null);
    navigate('/auth');
  };
  
  const refreshUser = () => {
     api.get('/auth/me').then(res => setUser(res.data));
  };

  useEffect(() => {
    if (!loading) {
      if (!user && currentPath !== '/auth') navigate('/auth');
      if (user && currentPath === '/auth') navigate('/chat');
    }
  }, [user, loading, currentPath]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-background text-primary"><Loader2 className="animate-spin" size={40} /></div>;

  if (!user) {
     return <Auth onLogin={handleLogin} navigate={navigate} />;
  }

  const renderContent = () => {
    if (currentPath === APP_CONFIG.adminPath && user.role === UserRole.ADMIN) {
        return <Admin />;
    }
    switch (currentPath) {
        case '/image':
            return <ImageGen user={user} refreshUser={refreshUser}/>;
        case '/pricing':
            return <Pricing user={user} refreshUser={refreshUser}/>;
        case '/chat':
        case '/':
        default:
            return <Chat user={user} refreshUser={refreshUser}/>;
    }
  };

  return (
    <Layout user={user} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} currentPath={currentPath} navigate={navigate}>
        {renderContent()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <BrandingProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </BrandingProvider>
  );
}

export default App;