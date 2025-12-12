import React, { useState, useEffect } from 'react';
import { Sparkles, Download, ImageIcon, Share2 } from 'lucide-react';
import api from '../utils/api';
import { User } from '../types';

interface ImageGenProps {
  user: User;
  refreshUser: () => void;
}

const ImageGen: React.FC<ImageGenProps> = ({ user, refreshUser }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  // Loading & Progress State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  // Fake Progress Timer (0% se 90% tak)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading && progress < 90) {
      interval = setInterval(() => {
        setProgress((prev) => {
          // 90% par rok denge jab tak asli image load na ho jaye
          if (prev >= 90) return 90;
          return prev + Math.floor(Math.random() * 5) + 1; // Random speed increment
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isLoading, progress]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (user.credits < 5) { 
        alert("Insufficient credits (5 required)"); 
        return; 
    }

    setIsLoading(true);
    setGeneratedImage(null);
    setProgress(0); // Start progress from 0

    try {
      // 1. Backend se Link maango (Ye turant aa jayega)
      const res = await api.post('/ai/image', { prompt });
      const imageUrl = res.data.imageUrl;

      // 2. Browser mein Image Pre-load karo (White Screen Fix) 🪄
      const img = new Image();
      img.src = imageUrl;

      img.onload = () => {
        // Jab image puri download ho jaye
        setProgress(100);
        
        // Thoda sa delay taaki user 100% dekh sake
        setTimeout(() => {
            setGeneratedImage(imageUrl);
            setIsLoading(false);
            refreshUser(); // Credits update
        }, 500);
      };

      img.onerror = () => {
        console.error("Image load failed");
        alert("Failed to load image from server.");
        setIsLoading(false);
      };

    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.error || "Generation failed";
      alert(errorMsg);
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center max-w-5xl mx-auto space-y-8 p-6 bg-background text-text-main overflow-y-auto">
      
      {/* Header Section */}
      <div className="text-center space-y-2 animate-fade-in-up">
        <h2 className="text-4xl font-black bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">AI Art Studio</h2>
        <p className="text-text-secondary font-medium">Transform your imagination into reality. (5 Credits)</p>
      </div>

      {/* Input Section */}
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
          {isLoading ? (
            <span className="flex items-center gap-2">Generating...</span>
          ) : (
            <>
                <Sparkles size={20} />
                <span className="hidden sm:inline">Generate</span>
            </>
          )} 
        </button>
      </div>

      {/* Main Display Box */}
      <div className="w-full max-w-lg aspect-square bg-surface border-2 border-dashed border-border rounded-3xl flex items-center justify-center relative overflow-hidden group shadow-inner transition-all hover:border-secondary/30">
        
        {isLoading ? (
          <div className="text-center space-y-4 w-full px-12">
             {/* Circular Progress Indicator */}
             <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="absolute inset-0 border-4 border-surface rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-secondary rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-secondary">
                    {progress}%
                </div>
             </div>
             
             {/* Linear Progress Bar */}
             <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div 
                    className="bg-gradient-to-r from-pink-500 to-purple-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${progress}%` }}
                ></div>
             </div>

            {/* Dynamic Loading Text */}
            <p className="text-text-secondary font-medium animate-pulse">
                {progress < 30 && "Initializing AI..."}
                {progress >= 30 && progress < 70 && "Painting pixels..."}
                {progress >= 70 && progress < 90 && "Adding final details..."}
                {progress >= 90 && "Finalizing masterpiece..."}
            </p>
          </div>
        ) : generatedImage ? (
          <>
            <img src={generatedImage} alt="Generated" className="w-full h-full object-cover animate-fade-in-up" />
            
            {/* Overlay Buttons */}
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
