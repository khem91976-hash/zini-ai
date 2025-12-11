import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Key, ShieldCheck, 
  RefreshCw, Palette, Type, AlertTriangle, Eye
} from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../utils/api';
import { User } from '../types';
import { useBranding } from '../contexts/BrandingContext';

const Admin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  
  // Demo Mode: Mock API Keys to prevent exposure
  const [apiKeys] = useState<string[]>(['sk-gemini-demo-key-xxxxxxxxxxxx']);
  
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Branding Inputs (Read Only)
  const { appName: currentAppName, primaryColor: currentPrimary, secondaryColor: currentSecondary } = useBranding();

  useEffect(() => {
    fetchUsers();
    const socket: any = io(); 
    socket.on('onlineUsers', (count: number) => setOnlineCount(count));
    return () => { socket.disconnect(); };
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto bg-background text-text-main">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div>
           <h2 className="text-3xl font-black text-text-main">Dashboard</h2>
           <p className="text-text-secondary">System Overview & Management</p>
        </div>
        <div className="flex items-center gap-3">
             <div className="bg-surface border border-border px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
                <div className="relative">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-ping absolute"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full relative"></div>
                </div>
                <span className="text-text-main font-bold font-mono">{onlineCount} Online</span>
            </div>
            <button onClick={fetchUsers} className="p-2 bg-surface border border-border rounded-xl hover:bg-background text-text-secondary hover:text-primary transition">
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
        </div>
      </div>

      {/* READ ONLY BANNER */}
      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-xl mb-8 flex items-center gap-3 shadow-sm">
        <AlertTriangle size={24} className="shrink-0" />
        <div>
            <div className="font-bold">Demo Mode Active</div>
            <div className="text-xs opacity-80">
                This admin panel is in Read-Only Demo Mode. Sensitive data (API Keys) is hidden, and write actions are disabled.
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Branding & White Label Editor (Read Only) */}
          <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                      <Palette className="text-secondary" />
                      <div>
                          <h3 className="font-bold text-lg">White Label Branding</h3>
                          <p className="text-xs text-text-secondary">View current app configuration</p>
                      </div>
                  </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                      <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">App Name</label>
                      <div className="flex items-center bg-background border border-border rounded-xl px-3 opacity-70">
                          <Type size={16} className="text-text-secondary"/>
                          <input 
                            type="text" 
                            value={currentAppName}
                            readOnly
                            disabled
                            className="flex-1 bg-transparent border-none outline-none py-3 px-2 text-text-main font-bold cursor-not-allowed"
                          />
                      </div>
                  </div>
                  <div>
                      <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Primary Color</label>
                      <div className="flex items-center gap-2 bg-background border border-border rounded-xl p-1.5 opacity-70">
                          <div 
                            className="h-10 w-12 rounded border border-border"
                            style={{ backgroundColor: currentPrimary }}
                          ></div>
                          <span className="text-xs font-mono text-text-secondary">{currentPrimary}</span>
                      </div>
                  </div>
                  <div>
                      <label className="text-xs font-bold text-text-secondary uppercase mb-1 block">Secondary Color</label>
                      <div className="flex items-center gap-2 bg-background border border-border rounded-xl p-1.5 opacity-70">
                          <div 
                            className="h-10 w-12 rounded border border-border"
                            style={{ backgroundColor: currentSecondary }}
                          ></div>
                          <span className="text-xs font-mono text-text-secondary">{currentSecondary}</span>
                      </div>
                  </div>
              </div>
          </div>

          {/* API Key Panel (View Only - Mocked) */}
          <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
              <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                      <Key className="text-secondary" />
                      <div>
                        <h3 className="font-bold text-lg">AI Configuration</h3>
                        <p className="text-xs text-text-secondary">Gemini API Keys</p>
                      </div>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 bg-green-500/10 text-green-600 cursor-default">
                      <ShieldCheck size={12}/> PROTECTED
                  </div>
              </div>

              <div className="space-y-4 animate-fade-in-up">
                  <div className="text-sm text-text-secondary bg-primary/5 p-3 rounded-xl border border-primary/10 flex gap-2">
                    <Eye size={16} className="shrink-0 text-primary mt-0.5" />
                    Keys are hidden for security in demo environment.
                  </div>

                  {/* Key List */}
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                      {apiKeys.map((k, i) => (
                          <div key={i} className="flex items-center justify-between bg-background border border-border p-3 rounded-xl opacity-75">
                              <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center text-xs font-bold shrink-0">
                                    {i + 1}
                                  </div>
                                  <div className="font-mono text-xs text-text-secondary truncate">
                                      {k}
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>

          {/* Admin Security */}
          <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="text-primary" />
                  <h3 className="font-bold text-lg">Admin Security</h3>
              </div>
              <div className="bg-background border border-border rounded-xl p-4 text-center text-text-secondary text-sm">
                  Password updates and key management are disabled in Demo Mode.
              </div>
          </div>
      </div>

      {/* User Management (Read Only) */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Users className="text-text-secondary" size={20}/> User Management
          </h3>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full sm:w-64 bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:border-primary outline-none text-text-main"
            />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-text-secondary uppercase text-xs">
              <tr>
                <th className="p-4 font-bold">User Details</th>
                <th className="p-4 font-bold">Plan</th>
                <th className="p-4 font-bold">Credits</th>
                <th className="p-4 font-bold text-right opacity-50">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(u => (
                <tr key={u._id || u.id} className="hover:bg-background/50 transition">
                  <td className="p-4">
                    <div className="font-bold text-text-main flex items-center gap-2">
                      {u.name}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'}`}>
                        {u.role}
                      </span>
                    </div>
                    <div className="text-text-secondary text-xs">{u.email}</div>
                  </td>
                  <td className="p-4">
                     <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider
                        ${u.plan === 'elite' ? 'bg-yellow-100 text-yellow-700' : 
                          u.plan === 'pro' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}
                     `}>
                        {u.plan || 'Free'}
                     </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-primary">{u.credits}</td>
                  <td className="p-4 text-right text-xs text-text-secondary italic">
                    Read Only
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-border">
            {filtered.map(u => (
                <div key={u._id || u.id} className="p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="font-bold text-text-main">{u.name}</div>
                            <div className="text-text-secondary text-xs">{u.email}</div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.plan === 'elite' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'}`}>
                            {u.plan || 'Free'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center bg-background p-3 rounded-lg border border-border">
                        <span className="text-xs text-text-secondary uppercase font-bold">Credits</span>
                        <span className="font-mono font-bold text-primary">{u.credits}</span>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Admin;