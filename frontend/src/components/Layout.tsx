import React from 'react';
import { MessageSquare, LayoutDashboard, LogOut, Menu, X, Image as ImageIcon, Sun, Moon, CreditCard, Globe } from 'lucide-react';
import { APP_CONFIG } from '../config';
import { User, UserRole } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useBranding } from '../contexts/BrandingContext';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  currentPath: string;
  navigate: (path: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, isDarkMode, toggleTheme, currentPath, navigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const { t, language, setLanguage, dir } = useLanguage();
  const { appName } = useBranding();

  // Close sidebar on route change (Mobile)
  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [currentPath]);

  const cycleLanguage = () => {
    const langs = APP_CONFIG.languages;
    const currentIndex = langs.findIndex(l => l.code === language);
    const nextIndex = (currentIndex + 1) % langs.length;
    setLanguage(langs[nextIndex].code);
  };

  const NavLink = ({ to, children, className }: any) => {
    const isActive = currentPath === to;
    const appliedClass = typeof className === 'function' ? className({ isActive }) : className;
    return (
        <a 
            href={`#${to}`} 
            onClick={(e) => { e.preventDefault(); navigate(to); }}
            className={appliedClass}
        >
            {children}
        </a>
    );
  };

  return (
    <div className="flex h-screen bg-background text-text-main overflow-hidden font-sans transition-colors duration-300" dir={dir}>
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 ${dir === 'rtl' ? 'right-0' : 'left-0'} z-50 w-72 bg-surface border-r border-l border-border 
        transform transition-transform duration-300 shadow-2xl lg:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : (dir === 'rtl' ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0')}
      `}>
        <div className="flex flex-col h-full">
          {/* Brand */}
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white font-black text-lg shadow-lg">
                 {appName.charAt(0)}
               </div>
               <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate max-w-[150px]">
                {appName}
              </h1>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-text-secondary hover:text-text-main transition"><X size={24} /></button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 px-2 opacity-50">Menu</div>
            
            <NavLink to="/chat" className={({isActive}: any) => `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-text-secondary hover:bg-background hover:text-text-main'}`}>
              <MessageSquare size={20} /> {t('chat')}
            </NavLink>
            
            <NavLink to="/image" className={({isActive}: any) => `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium ${isActive ? 'bg-secondary text-white shadow-lg shadow-secondary/25' : 'text-text-secondary hover:bg-background hover:text-text-main'}`}>
              <ImageIcon size={20} /> {t('image')}
            </NavLink>
            
            <NavLink to="/pricing" className={({isActive}: any) => `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium ${isActive ? 'bg-green-600 text-white shadow-lg shadow-green-600/25' : 'text-text-secondary hover:bg-background hover:text-text-main'}`}>
              <CreditCard size={20} /> {t('pricing')}
            </NavLink>

            {user.role === UserRole.ADMIN && (
              <NavLink to={APP_CONFIG.adminPath} className={({isActive}: any) => `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium ${isActive ? 'bg-slate-700 text-white shadow-lg' : 'text-text-secondary hover:bg-background hover:text-text-main'}`}>
                <LayoutDashboard size={20} /> {t('admin')}
              </NavLink>
            )}

            <div className="pt-4 mt-4 border-t border-border space-y-2">
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 px-2 opacity-50">{t('settings')}</div>
              
              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-text-secondary hover:bg-background hover:text-text-main transition font-medium"
              >
                <div className="flex items-center gap-3">
                  {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                  <span>{isDarkMode ? t('night') : t('day')}</span>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${isDarkMode ? 'bg-primary' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${isDarkMode ? (dir === 'rtl' ? 'right-6' : 'left-6') : (dir === 'rtl' ? 'right-1' : 'left-1')}`}></div>
                </div>
              </button>

              {/* Language Toggle */}
              <button 
                onClick={cycleLanguage}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:bg-background hover:text-text-main transition font-medium"
              >
                  <Globe size={20} /> 
                  <span>{APP_CONFIG.languages.find(l => l.code === language)?.name}</span>
              </button>
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 bg-background border-t border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md border-2 border-surface shrink-0">
                {user.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-text-main truncate">{user.name}</div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-white bg-primary px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">{user.plan || 'Free'}</span>
                    <span className="text-xs text-text-secondary font-mono">{user.credits} CR</span>
                </div>
              </div>
            </div>
            <button onClick={onLogout} className="w-full py-2.5 text-sm font-semibold text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition flex items-center justify-center gap-2">
              <LogOut size={18} /> {t('signout')}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <main className="flex-1 flex flex-col h-full relative min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-surface/80 backdrop-blur-md border-b border-border flex items-center px-4 justify-between z-30 sticky top-0">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-text-secondary hover:text-text-main"><Menu size={24} /></button>
          <span className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{appName}</span>
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">{user.name[0]}</div>
        </header>
        
        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;