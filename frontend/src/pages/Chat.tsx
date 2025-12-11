import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, User as UserIcon, Bot, Sparkles, Paperclip, 
  Image as ImageIcon, FileText, Download, 
  Trash2, History, PlusCircle, Code, PenTool, X,
  PanelLeft, PanelLeftClose
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../utils/api';
import { User, Message, ChatSession } from '../types';
import CodeBlock from '../components/CodeBlock';
import { exportZiniChat } from '../utils/chatHelpers';

interface ChatProps {
  user: User;
  refreshUser: () => void;
}

const PROMPT_TEMPLATES = [
  { icon: <Code size={18} />, label: "Fix Code", prompt: "Review this code and fix any bugs:" },
  { icon: <PenTool size={18} />, label: "Write Email", prompt: "Write a professional email about:" },
  { icon: <Sparkles size={18} />, label: "Creative", prompt: "Write a creative story about:" },
  { icon: <FileText size={18} />, label: "Summarize", prompt: "Summarize this topic:" },
];

const Chat: React.FC<ChatProps> = ({ user, refreshUser }) => {
  const [ziniInput, setZiniInput] = useState('');
  const [ziniMessages, setZiniMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(window.innerWidth >= 1024);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // TODO: Implement Zini Realtime Streaming Response

  useEffect(() => {
    loadHistory();
    const handleResize = () => {
        if (window.innerWidth >= 1024) setShowHistory(true);
        else setShowHistory(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ziniMessages, isLoading]);

  const loadHistory = async () => {
    try {
      const res = await api.get('/ai/history');
      setSessions(res.data);
    } catch (err) {}
  };

  const loadSession = async (id: string) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/ai/history/${id}`);
      setZiniMessages(res.data.messages);
      setCurrentSessionId(id);
      if (window.innerWidth < 1024) setShowHistory(false); 
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;
    await api.delete(`/ai/history/${id}`);
    if (currentSessionId === id) {
      setZiniMessages([]);
      setCurrentSessionId(null);
    }
    loadHistory();
  };

  const handleNewChat = () => {
    setZiniMessages([]);
    setCurrentSessionId(null);
    setZiniInput('');
    clearFile();
    if (window.innerWidth < 1024) setShowHistory(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setImagePreview(null);
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const dispatchZiniMessage = async (textOverride?: string) => {
    const textToSend = textOverride || ziniInput;
    if ((!textToSend.trim() && !file) || isLoading) return;
    if (user.credits < 1) return alert("Insufficient credits.");

    const newMessage: Message = { role: 'user', content: textToSend, type: 'text' };
    setZiniMessages(prev => [...prev, newMessage]);
    setZiniInput('');
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', textToSend);
      if (currentSessionId) formData.append('sessionId', currentSessionId);
      
      const historyContext = ziniMessages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      formData.append('history', JSON.stringify(historyContext));

      if (file) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result as string;
                await submitToBackend(textToSend, base64, null);
            };
        } else {
            formData.append('file', file);
            await submitToBackend(textToSend, null, file);
        }
      } else {
        await submitToBackend(textToSend, null, null);
      }
    } catch (err: any) {
      setZiniMessages(prev => [...prev, { role: 'model', content: "Error: " + (err.response?.data?.error || "Failed to process"), type: 'text' }]);
      setIsLoading(false);
    }
  };

  const submitToBackend = async (msg: string, imageBase64: string | null, pdfFile: File | null) => {
      const formData = new FormData();
      formData.append('message', msg);
      if (currentSessionId) formData.append('sessionId', currentSessionId);
      if (imageBase64) formData.append('imageBase64', imageBase64);
      if (pdfFile) formData.append('file', pdfFile);

      const historyContext = ziniMessages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      formData.append('history', JSON.stringify(historyContext));

      const res = await api.post('/ai/analyze', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });

      setZiniMessages(prev => [...prev, { role: 'model', content: res.data.reply, type: 'text' }]);
      if (!currentSessionId && res.data.sessionId) {
          setCurrentSessionId(res.data.sessionId);
          loadHistory();
      }
      refreshUser();
      clearFile();
      setIsLoading(false);
  };

  return (
    <div className="flex h-full relative overflow-hidden bg-background">
      
      {/* History Sidebar */}
      <div className={`
        absolute lg:static inset-y-0 left-0 z-30 bg-surface border-r border-border 
        transform transition-all duration-300 flex flex-col w-64 shadow-2xl lg:shadow-none
        ${showHistory ? 'translate-x-0' : '-translate-x-full lg:w-0 lg:border-none lg:overflow-hidden'}
      `}>
        <div className="p-4 border-b border-border flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider text-text-secondary"><History size={16}/> Chats</h3>
            <button onClick={() => setShowHistory(false)} className="lg:hidden text-text-secondary"><X size={18}/></button>
        </div>
        
        <div className="p-3">
             <button onClick={handleNewChat} className="w-full flex items-center gap-2 justify-center bg-primary/10 text-primary hover:bg-primary/20 py-2.5 rounded-lg text-sm font-bold transition">
                <PlusCircle size={16} /> New Chat
             </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
            {sessions.map(s => (
                <div 
                    key={s._id}
                    onClick={() => loadSession(s._id)}
                    className={`p-3 rounded-lg cursor-pointer text-sm group flex justify-between items-center transition border
                      ${currentSessionId === s._id 
                        ? 'bg-background border-primary/30 text-primary shadow-sm' 
                        : 'border-transparent text-text-secondary hover:bg-background hover:text-text-main'}
                    `}
                >
                    <span className="truncate flex-1 font-medium">{s.title}</span>
                    <button 
                      onClick={(e) => deleteSession(e, s._id)} 
                      className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-red-500 p-1 rounded transition"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
        </div>
      </div>
      
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setShowHistory(false)}/>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative w-full min-w-0 bg-background text-text-main">
        
        {/* Chat Toolbar */}
        <div className="h-16 border-b border-border flex items-center justify-between px-4 bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-3 overflow-hidden">
                <button 
                    onClick={() => setShowHistory(!showHistory)}
                    className="p-2 hover:bg-surface rounded-lg text-text-secondary hover:text-text-main transition"
                >
                    {showHistory ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
                </button>
                <div className="flex flex-col overflow-hidden">
                  <span className="font-bold text-sm truncate">
                      {currentSessionId ? sessions.find(s => s._id === currentSessionId)?.title : 'New Chat'}
                  </span>
                  {currentSessionId && <span className="text-[10px] text-text-secondary uppercase">Active</span>}
                </div>
            </div>
            
            <div className="flex gap-1">
                <button onClick={() => exportZiniChat(ziniMessages, 'txt')} title="Download Text" className="p-2 text-text-secondary hover:text-text-main hover:bg-surface rounded-lg transition"><FileText size={18}/></button>
                <button onClick={() => exportZiniChat(ziniMessages, 'pdf')} title="Download PDF" className="p-2 text-text-secondary hover:text-text-main hover:bg-surface rounded-lg transition"><Download size={18}/></button>
            </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {ziniMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-text-secondary animate-fade-in-up">
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-primary/10">
                        <Sparkles size={40} className="text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-text-main mb-2">Hello, {user.name.split(' ')[0]}</h2>
                    <p className="mb-8 text-center max-w-md px-4 text-sm">I can assist with coding, writing, analysis, and images.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl px-4">
                        {PROMPT_TEMPLATES.map((t, i) => (
                            <button 
                                key={i}
                                onClick={() => setZiniInput(t.prompt)}
                                className="flex items-center gap-3 p-4 bg-surface border border-border rounded-xl hover:border-primary/50 hover:shadow-lg transition text-left group"
                            >
                                <div className="p-2 bg-background rounded-lg text-text-secondary group-hover:text-primary transition">{t.icon}</div>
                                <div>
                                    <div className="font-bold text-sm text-text-main">{t.label}</div>
                                    <div className="text-xs text-text-secondary">{t.prompt}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {ziniMessages.map((msg, i) => (
                <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-surface border border-border text-primary'}`}>
                        {msg.role === 'user' ? <UserIcon size={18} /> : <Bot size={18} />}
                    </div>
                    
                    <div className={`
                        max-w-[85%] md:max-w-2xl rounded-2xl p-4 shadow-sm text-sm md:text-base leading-relaxed break-words
                        ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-surface border border-border text-text-main rounded-tl-none'}
                    `}>
                        {msg.type === 'image' && <div className="text-xs opacity-80 mb-2 italic flex items-center gap-1 border-b border-white/20 pb-2"><ImageIcon size={12}/> Image Analyzed</div>}
                        
                        <div className={`prose prose-sm max-w-none break-words ${msg.role === 'user' ? 'prose-invert' : 'dark:prose-invert prose-slate'}`}>
                            <ReactMarkdown
                                components={{
                                    code({node, inline, className, children, ...props}: any) {
                                        const match = /language-(\w+)/.exec(className || '')
                                        return !inline && match ? (
                                            <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
                                        ) : (
                                            <code className={`px-1 py-0.5 rounded font-mono text-xs ${msg.role === 'user' ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-800'}`} {...props}>
                                                {children}
                                            </code>
                                        )
                                    }
                                }}
                            >
                                {msg.content}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex gap-4">
                    <div className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center animate-pulse"><Sparkles size={18} className="text-secondary" /></div>
                    <div className="bg-surface border border-border px-4 py-3 rounded-2xl rounded-tl-none text-text-secondary text-sm flex items-center gap-2 shadow-sm">
                        <span className="w-2 h-2 bg-secondary rounded-full animate-bounce"></span>
                        Thinking...
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-surface/80 backdrop-blur-md border-t border-border">
            {file && (
                <div className="flex items-center gap-3 mb-3 p-2 bg-background rounded-xl w-fit border border-border shadow-sm animate-fade-in-up">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="h-10 w-10 object-cover rounded-lg border border-border" />
                    ) : (
                      <div className="h-10 w-10 bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center"><FileText size={20} /></div>
                    )}
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-text-main max-w-[150px] truncate">{file.name}</span>
                        <span className="text-[10px] text-text-secondary uppercase">Attached</span>
                    </div>
                    <button onClick={clearFile} className="ml-1 p-1 hover:bg-surface rounded-full text-text-secondary hover:text-red-500 transition"><X size={16}/></button>
                </div>
            )}
            
            <div className="flex items-end gap-2 bg-background p-2 rounded-2xl border border-border focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition shadow-inner">
                <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-3 rounded-xl transition mb-[1px] ${file ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-surface hover:text-primary'}`}
                    title="Upload"
                >
                    <Paperclip size={20} />
                </button>

                <textarea
                    value={ziniInput}
                    onChange={(e) => setZiniInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            dispatchZiniMessage();
                        }
                    }}
                    placeholder={file ? "Ask questions about this file..." : "Type a message..."}
                    disabled={isLoading}
                    rows={1}
                    className="flex-1 bg-transparent border-none outline-none text-text-main placeholder-text-secondary py-3 px-2 min-h-[44px] max-h-32 resize-none"
                    style={{ height: 'auto', minHeight: '44px' }}
                />
                
                <button 
                    onClick={() => dispatchZiniMessage()}
                    disabled={(!ziniInput.trim() && !file) || isLoading}
                    className="p-3 bg-primary rounded-xl text-white hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition shadow-md mb-[1px]"
                >
                    <Send size={18} />
                </button>
            </div>
            <div className="text-center mt-2 text-[10px] text-text-secondary uppercase tracking-widest opacity-60">
                AI can make mistakes. Check important info.
            </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;