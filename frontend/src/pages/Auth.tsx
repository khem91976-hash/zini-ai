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
  
  // Copy state for animation
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

      if (data.user.role === 'admin') {
        navigate(APP_CONFIG.adminPath);
      } else {
        navigate('/chat');
      }
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const socialLoginMock = (provider: string) => {
      alert(`${provider} Login is configured. In production, this redirects to OAuth provider.`);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    // Auto-fill form
    setFormData(prev => ({ ...prev, [field]: text }));
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background text-text-main transition-colors duration-300 p-4">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[100px]"></div>
      </div>
      
      <div className="w-full max-w-md bg-surface/70 backdrop-blur-xl border border-border p-8 rounded-3xl shadow-2xl relative z-10 animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-primary to-secondary rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-primary/30">
            {appName.charAt(0)}
          </div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-tight mb-2">
            {appName}
          </h1>
          <p className="text-text-secondary font-medium">{APP_CONFIG.tagline}</p>
        </div>

        {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm mb-6 text-center font-medium">
                {error}
            </div>
        )}

        {/* Social Login Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
            <button 
                onClick={() => socialLoginMock('Google')}
                className="flex items-center justify-center gap-2 py-3 bg-surface border border-border rounded-xl hover:bg-background transition text-sm font-bold text-text-main"
            >
                <Chrome size={18} /> Google
            </button>
            <button 
                onClick={() => socialLoginMock('GitHub')}
                className="flex items-center justify-center gap-2 py-3 bg-surface border border-border rounded-xl hover:bg-background transition text-sm font-bold text-text-main"
            >
                <Github size={18} /> GitHub
            </button>
        </div>

        <div className="relative mb-6 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
            <div className="relative bg-surface/50 inline-block px-4 text-xs font-bold text-text-secondary uppercase">Or with email</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary ml-1 uppercase">Full Name</label>
                <input 
                type="text" 
                placeholder="John Doe" 
                className="w-full bg-background border border-border rounded-xl px-4 py-3.5 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-text-main placeholder-text-secondary/50"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
                />
            </div>
          )}
          <div className="space-y-1">
             <label className="text-xs font-bold text-text-secondary ml-1 uppercase">Email / Username</label>
             <input 
                type="text" 
                placeholder="admin" 
                className="w-full bg-background border border-border rounded-xl px-4 py-3.5 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-text-main placeholder-text-secondary/50"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary ml-1 uppercase">Password</label>
            <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full bg-background border border-border rounded-xl px-4 py-3.5 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition text-text-main placeholder-text-secondary/50"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                required
            />
          </div>
          
          <button 
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-secondary py-4 rounded-xl font-bold text-white shadow-xl hover:shadow-primary/25 hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2 mt-6"
          >
            {loading ? <Loader2 className="animate-spin" /> : (
                <>
                    {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} />
                </>
            )}
          </button>
        </form>

        {/* 👇 DEMO ADMIN ACCESS BOX (Updated) 👇 */}
        {isLogin && (
          <div className="mt-6 p-4 bg-surface/50 border border-primary/20 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-secondary"></div>
            <div className="flex items-center gap-2 mb-3 text-primary font-bold text-sm uppercase tracking-wide">
              <KeyRound size={16} /> 
              <span>Demo Admin Access</span>
            </div>
            
            <div className="space-y-2">
              {/* User/Email Row - Updated to show 'admin' */}
              <div className="flex items-center justify-between bg-background/50 p-2 rounded-lg border border-border/50">
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-secondary uppercase font-bold">User / Email</span>
                  <span className="text-sm font-mono text-text-main font-semibold">admin</span>
                </div>
                <button 
                  onClick={() => copyToClipboard('admin', 'email')}
                  className="p-1.5 hover:bg-primary/10 rounded-md text-text-secondary hover:text-primary transition"
                  title="Copy User"
                >
                  {copied === 'email' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>

              {/* Password Row - Remains 'zinikhem' */}
              <div className="flex items-center justify-between bg-background/50 p-2 rounded-lg border border-border/50">
                <div className="flex flex-col">
                  <span className="text-[10px] text-text-secondary uppercase font-bold">Password</span>
                  <span className="text-sm font-mono text-text-main font-semibold">zinikhem</span>
                </div>
                <button 
                  onClick={() => copyToClipboard('zinikhem', 'password')}
                  className="p-1.5 hover:bg-primary/10 rounded-md text-text-secondary hover:text-primary transition"
                  title="Copy Password"
                >
                  {copied === 'password' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
            <p className="text-[10px] text-text-secondary mt-2 text-center">
              Click copy icon to auto-fill credentials
            </p>
          </div>
        )}

        <div className="mt-8 text-center">
            <p className="text-text-secondary text-sm">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button onClick={() => setIsLogin(!isLogin)} className="ml-1 text-primary hover:text-secondary font-bold transition">
                    {isLogin ? "Sign Up" : "Sign In"}
                </button>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
