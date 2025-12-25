
import React, { useEffect, useState } from 'react';
import { GlassCard } from './GlassCard';
import { ChevronDown, Info, Zap, Shield, Layout } from 'lucide-react';
import { ViewState } from '../types';

interface InfoSheetProps {
  view: ViewState;
  isOpen: boolean;
  onClose: () => void;
}

export const InfoSheet: React.FC<InfoSheetProps> = ({ view, isOpen, onClose }) => {
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) setShouldRender(true);
    else setTimeout(() => setShouldRender(false), 500);
  }, [isOpen]);

  if (!shouldRender) return null;

  const getContent = () => {
      switch(view) {
          case ViewState.TASKS: return {
              title: "Центр Задач",
              items: [
                  { icon: Zap, text: "AI-Сортировка: Нажмите волшебную палочку для авто-категоризации." },
                  { icon: Layout, text: "Режимы: Переключайтесь между задачами и AI-заметками." },
                  { icon: Shield, text: "Фокус: Нажмите на мишень для режима глубокой работы." }
              ]
          };
          case ViewState.CALENDAR: return {
              title: "Умный Календарь",
              items: [
                  { icon: Zap, text: "Авто-Синхронизация: Задачи со временем появляются здесь." },
                  { icon: Layout, text: "Планировщик: ИИ может составить расписание дня." },
                  { icon: Shield, text: "Судебный режим: Особая подсветка для заседаний." }
              ]
          };
          case ViewState.SCANNER: return {
              title: "AI Сканер",
              items: [
                  { icon: Zap, text: "OCR: Распознает иски, договоры и визитки." },
                  { icon: Layout, text: "Авто-Ввод: Создает задачи или события из фото." }
              ]
          };
          default: return { title: "LexTools", items: [] };
      }
  };

  const content = getContent();

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-start pointer-events-none transition-all duration-500 ${isOpen ? 'bg-black/40 backdrop-blur-sm' : 'bg-transparent delay-200'}`}>
        
        <div 
            className={`w-full max-w-[360px] bg-[#1c1c1e] border-b border-x border-white/10 rounded-b-[2.5rem] shadow-[0_20px_80px_rgba(0,0,0,0.8)] pt-safe pb-8 px-6 pointer-events-auto transition-transform duration-500 ease-ios-spring ${isOpen ? 'translate-y-0' : '-translate-y-full'}`}
        >
             <div className="flex justify-center mb-6">
                 <div className="w-12 h-1 bg-white/20 rounded-full"></div>
             </div>

             <div className="flex items-center gap-3 mb-6 animate-fade-in">
                 <div className="w-10 h-10 rounded-full bg-accent-20 flex items-center justify-center text-accent">
                     <Info size={20} />
                 </div>
                 <div>
                     <h2 className="text-white text-xl font-semibold">{content.title}</h2>
                     <p className="text-white/40 text-xs font-medium uppercase tracking-wide">Информация о разделе</p>
                 </div>
             </div>

             <div className="space-y-4">
                 {content.items.map((item, idx) => (
                     <div key={idx} className="flex gap-4 items-start animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
                         <item.icon size={18} className="text-white/50 mt-1 shrink-0" />
                         <p className="text-white/80 text-[15px] font-light leading-relaxed">{item.text}</p>
                     </div>
                 ))}
             </div>

             <button 
                onClick={onClose}
                className="w-full py-4 mt-8 rounded-2xl bg-white/5 text-white font-medium active:bg-white/10 transition-colors flex items-center justify-center gap-2"
             >
                 <ChevronDown size={18} />
                 Понятно
             </button>
        </div>
    </div>
  );
};
