
import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { Mail, Lock, ArrowRight, Loader2, Sparkles, Check } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (user: any) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isExiting, setIsExiting] = useState(false); // State for exit animation
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = (e: React.FormEvent) => {
      e.preventDefault();
      if (!email || !password) return;
      
      setIsLoading(true);
      
      // Simulate API call and login process
      setTimeout(() => {
          setIsSuccess(true); // Show success checkmark
          setIsLoading(false);
          
          // Trigger exit animation after showing success briefly
          setTimeout(() => {
            setIsExiting(true);
            
            // Unmount/Login callback after animation completes
            setTimeout(() => {
                const user = {
                    name: email.split('@')[0], 
                    specialization: 'General',
                    isPro: true
                };
                localStorage.setItem('lawyer_user', JSON.stringify(user));
                onLogin(user);
            }, 800); // Match this to CSS animation duration
          }, 600);
      }, 1500);
  };

  return (
    <div className={`fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-6 touch-none transition-all duration-700 ${isExiting ? 'animate-scale-out opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {/* Background Ambient */}
        <div className="absolute top-[-20%] left-[-20%] w-[120vw] h-[120vw] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[120vw] h-[120vw] bg-zinc-800/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-[340px] relative z-10 flex flex-col items-center">
            
            {/* Logo Area */}
            <div className="text-center mb-10">
                <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-white/10 to-transparent rounded-[2rem] border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_60px_rgba(255,255,255,0.05)] animate-slide-up">
                    <Sparkles size={32} className="text-white opacity-90" strokeWidth={1.5} />
                </div>
                <h1 className="text-3xl font-medium text-white tracking-tight mb-2 animate-slide-up delay-100">LexTools</h1>
                <p className="text-white/40 text-[13px] animate-slide-up delay-200">Your workspace, reimagined.</p>
            </div>

            {/* Auth Form */}
            <div className="w-full animate-slide-up delay-300">
                <GlassCard className="p-1 w-full bg-[#151515]/60 backdrop-blur-3xl border-white/5" variant="heavy">
                    <form onSubmit={handleAuth} className="p-6 space-y-5">
                        
                        <div className="space-y-4">
                            <div className="bg-white/5 rounded-2xl border border-white/5 flex items-center px-4 transition-colors focus-within:border-white/20 focus-within:bg-white/10 h-14">
                                <Mail size={18} className="text-white/30" />
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email"
                                    className="w-full bg-transparent border-none outline-none text-white text-[15px] h-full ml-3 placeholder-white/20"
                                    required
                                />
                            </div>

                            <div className="bg-white/5 rounded-2xl border border-white/5 flex items-center px-4 transition-colors focus-within:border-white/20 focus-within:bg-white/10 h-14">
                                <Lock size={18} className="text-white/30" />
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    className="w-full bg-transparent border-none outline-none text-white text-[15px] h-full ml-3 placeholder-white/20"
                                    required
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={isLoading || !email || !password || isSuccess}
                            className={`w-full h-14 rounded-2xl font-semibold text-[15px] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.1)] disabled:opacity-80 disabled:scale-100 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] 
                                ${isSuccess ? 'bg-emerald-500 text-white' : 'bg-white text-black'}`}
                        >
                            {isLoading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : isSuccess ? (
                                <Check size={24} className="animate-scale-in" />
                            ) : (
                                <>
                                    <span>{isLogin ? 'Войти' : 'Создать аккаунт'}</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </GlassCard>
            </div>
            
            <div className="mt-8 flex gap-6 text-[13px] text-white/30 font-medium animate-fade-in delay-500">
                <button onClick={() => setIsLogin(true)} className={`${isLogin ? 'text-white' : 'hover:text-white/60'} transition-colors`}>Вход</button>
                <button onClick={() => setIsLogin(false)} className={`${!isLogin ? 'text-white' : 'hover:text-white/60'} transition-colors`}>Регистрация</button>
            </div>
        </div>
    </div>
  );
};
