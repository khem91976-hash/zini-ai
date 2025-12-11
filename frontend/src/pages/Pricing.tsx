
import React from 'react';
import { Check, Zap, Crown, Shield } from 'lucide-react';
import { User } from '../types';
import { APP_CONFIG } from '../config';
import api from '../utils/api';

interface PricingProps {
  user: User;
  refreshUser: () => void;
}

const Pricing: React.FC<PricingProps> = ({ user, refreshUser }) => {
  
  const handleUpgrade = async (planId: string) => {
    // In a real app, this would redirect to Stripe/PayPal.
    // For this SaaS demo, we simulate a successful upgrade.
    if (confirm(`Confirm upgrade to ${planId.toUpperCase()} plan?`)) {
      try {
        await api.post('/auth/upgrade', { plan: planId });
        refreshUser();
        alert("Upgrade Successful! Enjoy your new limits.");
      } catch (e) {
        alert("Upgrade failed.");
      }
    }
  };

  const PlanCard = ({ planKey, icon: Icon, color }: { planKey: string, icon: any, color: string }) => {
    const plan = APP_CONFIG.plans[planKey as keyof typeof APP_CONFIG.plans];
    const isCurrent = user.plan === plan.id;

    return (
      <div className={`relative bg-surface border ${isCurrent ? 'border-primary ring-2 ring-primary/20' : 'border-border'} rounded-2xl p-8 flex flex-col transition hover:shadow-xl hover:-translate-y-1`}>
        {isCurrent && (
          <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
            CURRENT PLAN
          </div>
        )}
        
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white mb-6 shadow-lg`}>
          <Icon size={24} />
        </div>

        <h3 className="text-xl font-bold text-text-main mb-2">{plan.name}</h3>
        <div className="flex items-baseline gap-1 mb-6">
          <span className="text-4xl font-black text-text-main">${plan.price}</span>
          <span className="text-text-secondary">/{plan.period.toLowerCase()}</span>
        </div>

        <div className="space-y-4 mb-8 flex-1">
          <div className="flex items-center gap-3 text-sm text-text-secondary">
             <Check size={16} className="text-green-500" />
             <span className="font-bold text-text-main">{plan.creditsPerDay} Credits</span> / Day
          </div>
          <div className="flex items-center gap-3 text-sm text-text-secondary">
             <Check size={16} className="text-green-500" />
             Access to GPT-4o Class AI
          </div>
          {plan.id !== 'free' && (
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <Check size={16} className="text-green-500" />
              Priority Support
            </div>
          )}
          {plan.id === 'elite' && (
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <Check size={16} className="text-green-500" />
              Early Access Features
            </div>
          )}
        </div>

        <button 
          onClick={() => !isCurrent && handleUpgrade(plan.id)}
          disabled={isCurrent}
          className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2
            ${isCurrent 
              ? 'bg-surface border border-border text-text-secondary opacity-50 cursor-default' 
              : 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25'}
          `}
        >
          {isCurrent ? 'Active Plan' : `Upgrade to ${plan.name}`}
        </button>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
          Upgrade Your Intelligence
        </h2>
        <p className="text-text-secondary max-w-lg mx-auto">
          Choose a plan that fits your needs. All plans include access to our cutting-edge AI models.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <PlanCard planKey="free" icon={Zap} color="bg-slate-500" />
        <PlanCard planKey="pro" icon={Shield} color="bg-blue-500" />
        <PlanCard planKey="elite" icon={Crown} color="bg-gradient-to-br from-yellow-400 to-orange-500" />
      </div>

      <div className="mt-12 text-center text-xs text-text-secondary">
        <p>Payments are secured by Stripe. Cancel anytime.</p>
        <p>Pro plans auto-renew monthly. Elite plans auto-renew yearly.</p>
      </div>
    </div>
  );
};

export default Pricing;
