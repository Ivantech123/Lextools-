
import React, { useState } from 'react';
import { ChevronRight, Check, Scale, FileText, Briefcase, X, ScanLine, Zap, ShieldCheck, Code } from 'lucide-react';

export const OnboardingGuide: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const steps = [
    {
      icon: Scale,
      title: "LexTools",
      subtitle: "Legal OS.26",
      desc: "Управляйте судебными делами, сроками и документами в едином защищенном интерфейсе. Максимальная ясность.",
      image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=1000&auto=format&fit=crop"
    },
    {
      icon: ScanLine,
      title: "AI Сканер Дел",
      subtitle: "Оцифровка Документов",
      desc: "Наведите камеру на иск или договор. ИИ распознает номер дела, даты заседаний и автоматически внесет их в календарь.",
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1000&auto=format&fit=crop"
    },
    {
      icon: ShieldCheck,
      title: "Судебный Фокус",
      subtitle: "Контроль Сроков",
      desc: "Умный календарь отслеживает процессуальные сроки и напоминает о заседаниях. Ваша практика под полным контролем.",
      image: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=1000&auto=format&fit=crop"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 500);
  };

  return (
    <div className={`fixed inset-0 z-[9999] bg-black flex flex-col transition-opacity duration-700 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
        
        {/* Background Images Layer */}
        {steps.map((s, i) => (
            <div 
                key={i}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === step ? 'opacity-100' : 'opacity-0'}`}
            >
                <img src={s.image} className="w-full h-full object-cover opacity-60 scale-105" alt="" />
                {/* Heavy Gradient for Text Readability - Updated for better contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                <div className="absolute inset-0 bg-black/30" /> 
            </div>
        ))}

        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 pt-safe mt-4 flex justify-between items-center z-20 px-6">
            <div className="flex items-center gap-1.5 opacity-60">
                <Code size={12} className="text-white" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Open Source</span>
            </div>
            <button 
                onClick={handleClose} 
                className="bg-white/10 backdrop-blur-md text-white/90 px-4 py-2 rounded-full text-xs font-medium active:bg-white/20 transition-all border border-white/5 hover:bg-white/15"
            >
                Пропустить
            </button>
        </div>

        {/* Bottom Content Area */}
        <div className="mt-auto relative z-10 px-6 pb-12 w-full max-w-md mx-auto flex flex-col h-[60%] justify-end">
             <div className="transition-all duration-500 transform translate-y-0 opacity-100 flex-1 flex flex-col justify-center" key={step}>
                {/* Icon Blob */}
                <div className="mb-6 relative inline-block">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse"></div>
                    <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center relative shadow-[0_0_30px_rgba(255,255,255,0.15)]">
                         {React.createElement(steps[step].icon, { size: 30, className: "text-white" })}
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <h3 className="text-indigo-300 text-xs font-bold uppercase tracking-[0.25em] animate-slide-up" style={{animationDelay: '100ms'}}>
                        {steps[step].subtitle}
                    </h3>
                    <h1 className="text-4xl md:text-5xl font-thin text-white leading-[0.95] tracking-tight animate-slide-up drop-shadow-lg" style={{animationDelay: '200ms'}}>
                        {steps[step].title}
                    </h1>
                </div>

                <p className="text-gray-200 text-[17px] font-normal leading-relaxed mb-8 animate-slide-up max-w-[90%]" style={{animationDelay: '300ms', textShadow: '0 2px 10px rgba(0,0,0,0.5)'}}>
                    {steps[step].desc}
                </p>
                
                {step === 0 && (
                    <p className="text-white/30 text-[10px] uppercase tracking-wide animate-fade-in delay-500">
                        Не является коммерческим продуктом. <br/>Документация и код бесплатны.
                    </p>
                )}
             </div>

             {/* Footer Navigation */}
             <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/10">
                 <div className="flex gap-2.5">
                     {steps.map((_, i) => (
                         <div 
                            key={i} 
                            className={`h-1 rounded-full transition-all duration-500 ease-ios-spring ${i === step ? 'w-8 bg-white shadow-[0_0_10px_white]' : 'w-1.5 bg-white/30'}`} 
                         />
                     ))}
                 </div>

                 <button 
                    onClick={handleNext}
                    className="group flex items-center gap-4 pl-6 pr-2 py-2 bg-white text-black rounded-full font-bold text-lg hover:pr-3 transition-all active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.2)]"
                 >
                    <span className="text-sm font-bold tracking-wide">{step === steps.length - 1 ? 'НАЧАТЬ' : 'ДАЛЕЕ'}</span>
                    <div className="w-11 h-11 rounded-full bg-black text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                        {step === steps.length - 1 ? <Check size={20} /> : <ChevronRight size={22} />}
                    </div>
                 </button>
             </div>
        </div>
    </div>
  );
};
