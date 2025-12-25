import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Mic, ChevronRight, Terminal, Zap, Calendar, User } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { ChatMessage, ViewState } from '../types';
import { GeminiService } from '../services/geminiService';
import { AudioService } from '../services/audioService';
import { InfoSheet } from './InfoSheet';

export const AssistantView: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (isFocused) {
        setTimeout(() => scrollToBottom('auto'), 300);
    }
  }, [isFocused]);

  // Pull down logic
  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
      if (containerRef.current?.scrollTop === 0) {
          touchStartY.current = e.touches[0].clientY;
      }
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
      if (containerRef.current?.scrollTop === 0) {
          const diff = e.changedTouches[0].clientY - touchStartY.current;
          if (diff > 120) {
              setShowInfoSheet(true);
              AudioService.play('open');
          }
      }
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;
    
    AudioService.play('click');

    // Add User Message
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Prepare history
    const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
    }));

    // Gather Context
    const tasks = JSON.parse(localStorage.getItem('glassai_tasks') || '[]');
    const events = JSON.parse(localStorage.getItem('glassai_events') || '[]');
    const appContext = { tasks, events };
    
    // API Call with Context
    const responseText = await GeminiService.chatWithContext(userMsg.text, history, appContext);

    // Add AI Message
    const modelMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: Date.now() };
    setMessages(prev => [...prev, modelMsg]);
    setIsLoading(false);
    AudioService.play('notification');
  };

  const suggestions = [
    { icon: Calendar, text: "Что у меня сегодня?", color: "text-blue-300", bg: "bg-blue-400/10" },
    { icon: Zap, text: "Разбей задачу: Иск о банкротстве", color: "text-amber-300", bg: "bg-amber-400/10" },
    { icon: Terminal, text: "Напомни сроки подачи апелляции", color: "text-emerald-300", bg: "bg-emerald-400/10" },
  ];

  return (
    <div className="h-full flex flex-col relative w-full overflow-hidden items-center">
      
      <InfoSheet 
        view={ViewState.ASSISTANT} 
        isOpen={showInfoSheet} 
        onClose={() => setShowInfoSheet(false)} 
      />

      {/* Header - Fixed & Blurred */}
      <header className="absolute top-0 left-0 right-0 z-20 pt-safe lg:pt-6 px-6 pb-2 transition-all duration-300 flex justify-center pointer-events-none">
        <div className={`flex items-center gap-3 p-2 rounded-2xl transition-all duration-500 pointer-events-auto ${messages.length > 0 ? 'bg-[#000]/40 backdrop-blur-xl border border-white/5 shadow-lg' : 'bg-transparent'}`}>
            <div className={`transition-all duration-700 rounded-full flex items-center justify-center ${messages.length > 0 ? 'w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-600' : 'w-0 h-0 overflow-hidden opacity-0'}`}>
                <Sparkles size={14} className="text-white" />
            </div>
            <div className={`${messages.length > 0 ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500 flex flex-col`}>
                <span className="text-sm font-medium text-white leading-none">Gemini</span>
                <span className="text-[10px] text-white/40 leading-none mt-0.5">AI Assistant</span>
            </div>
        </div>
      </header>

      {/* Main Chat Area - Scrollable */}
      <div 
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex-1 w-full overflow-y-auto no-scrollbar px-4 pt-24 pb-4 touch-pan-y"
      >
        <div className="max-w-4xl mx-auto w-full">
            {/* Pull Indicator Hint */}
            {messages.length === 0 && (
                <div className="absolute top-0 left-0 right-0 h-1 flex justify-center opacity-20 z-0 lg:hidden">
                    <div className="w-8 h-1 bg-white rounded-full mt-2"></div>
                </div>
            )}
            
            {/* Empty State / Hero */}
            {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center pb-20 animate-slide-up">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-indigo-500/10 blur-[60px] rounded-full"></div>
                        <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-[#1c1c1e] to-[#000] border border-white/10 flex items-center justify-center shadow-2xl relative z-10">
                            <Sparkles size={36} className="text-white/80" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-light text-white text-center mb-2 tracking-tight">Чем могу<br/><span className="text-white/30 font-normal">помочь?</span></h2>
                    
                    <div className="mt-10 grid gap-3 w-full max-w-[320px]">
                        {suggestions.map((s, i) => (
                            <button 
                                key={i}
                                onClick={() => handleSend(s.text)}
                                className="flex items-center gap-3 p-4 rounded-[1.5rem] bg-[#1c1c1e]/60 border border-white/5 active:scale-[0.98] active:bg-white/10 transition-all group backdrop-blur-md shadow-sm"
                            >
                                <div className={`p-2 rounded-full ${s.bg} ${s.color}`}>
                                    <s.icon size={16} />
                                </div>
                                <span className="text-white/70 text-[14px] font-normal group-hover:text-white transition-colors text-left flex-1 leading-snug">{s.text}</span>
                                <ChevronRight size={14} className="ml-auto text-white/10" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="space-y-4 min-h-min">
                {messages.map((msg) => (
                <div 
                    key={msg.id} 
                    className={`flex w-full animate-slide-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    <div className={`max-w-[88%] lg:max-w-[70%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    {msg.role === 'model' && (
                        <div className="w-8 h-8 rounded-full bg-[#1c1c1e] flex items-center justify-center shrink-0 border border-white/10 self-end mb-1 shadow-lg">
                            <Sparkles size={14} className="text-indigo-400" />
                        </div>
                    )}
                    
                    <div 
                        className={`relative px-5 py-3.5 rounded-[1.6rem] backdrop-blur-xl border transition-all duration-300 shadow-sm
                            ${msg.role === 'user' 
                                ? 'bg-[rgba(var(--accent-color),0.15)] border-white/10 text-white rounded-br-sm' 
                                : 'bg-[#1c1c1e]/80 border-white/5 text-gray-200 rounded-bl-sm'}`}
                    >
                        <p className="text-[16px] leading-relaxed whitespace-pre-wrap font-light tracking-wide">{msg.text}</p>
                    </div>
                    </div>
                </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start animate-fade-in pl-11">
                        <div className="bg-[#1c1c1e]/60 border border-white/5 rounded-[1.5rem] rounded-tl-sm px-4 py-3 flex items-center gap-1.5 backdrop-blur-md">
                            <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} className="h-4" /> 
            </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="shrink-0 z-30 w-full pb-[calc(env(safe-area-inset-bottom)+90px)] lg:pb-10 px-4 relative flex justify-center">
         {/* Gradient Mask for content behind */}
         <div className="absolute -top-32 left-0 right-0 bottom-0 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none -z-10" />
         
         <div className="relative pt-2 w-full max-w-4xl">
            <GlassCard className={`relative p-1.5 pl-5 pr-1.5 flex items-center gap-2 rounded-[2.2rem] bg-[#1c1c1e]/80 backdrop-blur-2xl border-white/10 transition-all duration-300 shadow-2xl ${isFocused ? 'bg-[#252528] border-white/20' : ''}`}>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Спросить AI..."
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/30 text-[16px] h-[48px] min-w-0 font-light"
                />
                
                <button 
                    onClick={() => handleSend()}
                    disabled={!input.trim()}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500 ease-ios-spring ${input.trim() ? 'bg-white text-black scale-100 rotate-0 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-white/5 text-white/30 scale-90 rotate-0'}`}
                >
                    {input.trim() ? <Send size={20} className="ml-0.5" /> : <Mic size={22} />}
                </button>
            </GlassCard>
         </div>
      </div>
    </div>
  );
};