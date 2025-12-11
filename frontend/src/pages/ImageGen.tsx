
import React, { useState } from 'react';
import { Sparkles, Download, Loader2, ImageIcon, Share2 } from 'lucide-react';
import api from '../utils/api';
import { User } from '../types';

interface ImageGenProps {
  user: User;
  refreshUser: () => void;
}

const ImageGen: React.FC<ImageGenProps> = ({ user, refreshUser }) => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (user.credits < 5) { alert("Insufficient credits (5 required)"); return; }

    setIsLoading(true);
    setGeneratedImage(null);

    try {
      const res = await api.post('/ai/image', { prompt });
      setGeneratedImage(res.data.imageUrl);
      refreshUser();
    } catch (error: any) {
      alert(error.response?.data?.error || "Generation failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center max-w-5xl mx-auto space-y-8 p-6 bg-background text-text-main overflow-y-auto">
      <div className="text-center space-y-2 animate-fade-in-up">
        <h2 className="text-4xl font-black bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">AI Art Studio</h2>
        <p className="text-text-secondary font-medium">Transform your imagination into reality. (5 Credits)</p>
      </div>

      <div className="w-full max-w-2xl flex flex-col sm:flex-row gap-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
         <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A futuristic city in the clouds, neon style..."
          className="flex-1 bg-surface border border-border rounded-xl px-5 h-14 outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition shadow-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
        />
        <button
          onClick={handleGenerate}
          disabled={isLoading || !prompt}
          className="h-14 px-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />} 
          <span className="hidden sm:inline">Generate</span>
        </button>
      </div>

      <div className="w-full max-w-lg aspect-square bg-surface border-2 border-dashed border-border rounded-3xl flex items-center justify-center relative overflow-hidden group shadow-inner transition-all hover:border-secondary/30">
        {isLoading ? (
          <div className="text-center space-y-4">
             <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 border-4 border-surface rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-secondary rounded-full animate-spin"></div>
             </div>
            <p className="text-text-secondary font-medium animate-pulse">Creating your masterpiece...</p>
          </div>
        ) : generatedImage ? (
          <>
            <img src={generatedImage} alt="Generated" className="w-full h-full object-cover animate-fade-in-up" />
            
            {/* Overlay Actions */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                <button 
                    onClick={() => window.open(generatedImage, '_blank')} 
                    className="p-4 bg-white text-black rounded-full hover:scale-110 transition shadow-xl"
                    title="Download"
                >
                    <Download size={24} />
                </button>
                <button className="p-4 bg-white text-black rounded-full hover:scale-110 transition shadow-xl" title="Share">
                    <Share2 size={24} />
                </button>
            </div>
          </>
        ) : (
          <div className="text-center text-text-secondary/40">
            <ImageIcon size={80} className="mx-auto mb-4" />
            <p className="font-medium text-lg">Your canvas is empty.</p>
            <p className="text-sm">Enter a prompt above to start.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGen;
