import React, { useState } from 'react';
import api from '../utils/api';
import { Loader2, ArrowRight, Github, Chrome, KeyRound, Copy, Check } from 'lucide-react';
import { APP_CONFIG } from '../config';
import { useBranding } from '../contexts/BrandingContext';

interface AuthProps {
  onLogin: (user: any) => void;
  navigate: (path: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, navigate }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { appName } = useBranding();
  const [copied, setCopied] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const { data } = await api.post(endpoint, formData);
      localStorage.setItem('zini_token', data.token);
      onLogin(data.user);
      if (data.user.role === 'admin') navigate(APP_CONFIG.adminPath);
      else navigate('/chat');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setFormData(prev => ({ ...prev, [field]: text }));
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background text-text-main p-4">
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[100px]"></div>
      </div>
      
      <div className="w-full max-w-md bg-surface/70 backdrop-blur-xl border border-border p-8 rounded-3xl shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-tight">
            {appName}
          </h1>
          <p className="text-text-secondary font-medium">{APP_CONFIG.tagline}</p>
        </div>

        {/* 👇 DEMO ADMIN BOX (Ye Hamesha Dikhega) 👇 */}
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3 text-yellow-600 dark:text-yellow-400 font-bold text-sm uppercase tracking-wide">
              <KeyRound size={16} /> 
              <span>Demo Admin Access</span>
            </div>
            
            <div className="space-y-2">
              {/* User Row */}
              <div className="flex items-center justify-between bg-background/60 p-2 rounded-lg border border-border/50">
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-secondary uppercase font-bold">Username</span>
                  <span className="text-sm font-mono text-text-main font-semibold">admin</span>
                </div>
                <button 
                  onClick={() => copyToClipboard('admin', 'email')}
                  className="p-1.5 hover:bg-primary/10 rounded-md text-text-secondary hover:text-primary transition"
                >
                  {copied === 'email' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>

              {/* Password Row */}
              <div className="flex items-center justify-between bg-background/60 p-2 rounded-lg border border-border/50">
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-secondary uppercase font-bold">Password</span>
                  <span className="text-sm font-mono text-text-main font-semibold">zinikhem</span>
                </div>
                <button 
                  onClick={() => copyToClipboard('zinikhem', 'password')}
                  className="p-1.5 hover:bg-primary/10 rounded-md text-text-secondary hover:text-primary transition"
                >
                  {copied === 'password' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
        </div>
        {/* 👆 DEMO BOX END 👆 */}

        {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm mb-6 text-center">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary ml-1 uppercase">Full Name</label>
                <input type="text" placeholder="John Doe" className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
          )}
          <div className="space-y-1">
             <label className="text-xs font-bold text-text-secondary ml-1 uppercase">Email / Username</label>
             <input type="text" placeholder="admin" className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary"
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary ml-1 uppercase">Password</label>
            <input type="password" placeholder="••••••••" className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary"
                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
          </div>
          
          <button disabled={loading} className="w-full bg-gradient-to-r from-primary to-secondary py-3 rounded-xl font-bold text-white shadow-lg mt-4 flex justify-center items-center">
            {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:text-secondary font-bold text-sm">
                {isLogin ? "New user? Create Account" : "Existing user? Sign In"}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
