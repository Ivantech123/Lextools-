
import React from 'react';
import { ListTodo, CalendarDays, Sparkles, ScanLine, Settings, Sparkles as LogoIcon, Github } from 'lucide-react';
import { ViewState } from '../types';
import { AudioService } from '../services/audioService';

interface DesktopSidebarProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  onOpenSettings: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ currentView, onViewChange, onOpenSettings }) => {
  const navItems = [
    { id: ViewState.TASKS, icon: ListTodo, label: 'Задачи' },
    { id: ViewState.CALENDAR, icon: CalendarDays, label: 'Календарь' },
    { id: ViewState.SCANNER, icon: ScanLine, label: 'Скан' },
    { id: ViewState.ASSISTANT, icon: Sparkles, label: 'AI Ассистент' },
  ];

  return (
    <div className="h-full w-64 bg-[#151515]/80 backdrop-blur-xl border-r border-white/5 flex flex-col py-8 px-4 z-50 shrink-0">
      
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 mb-10">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <LogoIcon size={16} className="text-white" />
        </div>
        <div>
            <span className="text-xl font-semibold text-white tracking-tight block leading-none">LexTools</span>
            <span className="text-[9px] text-white/40 uppercase tracking-widest font-medium">Open Source</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { onViewChange(item.id); AudioService.play('click'); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white/80'}`}
            >
              <item.icon size={20} className={`transition-colors ${isActive ? 'text-accent' : 'text-current'}`} />
              <span className="text-sm font-medium">{item.label}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(var(--accent-color),0.8)]" />}
            </button>
          );
        })}
      </div>

      {/* User / Settings */}
      <div className="mt-auto pt-6 border-t border-white/5">
        <button 
            onClick={() => { onOpenSettings(); AudioService.play('click'); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/40 hover:bg-white/5 hover:text-white transition-all"
        >
            <Settings size={20} />
            <span className="text-sm font-medium">Настройки</span>
        </button>
        
        <div className="mt-4 px-4">
             <div className="text-[10px] text-white/20 font-mono flex items-center gap-1">
                <Github size={10} /> Open Source Project
             </div>
             <div className="text-[9px] text-white/10 mt-1 leading-tight">
                Not a commercial product.<br/>Documentation & App Free.
             </div>
        </div>
      </div>
    </div>
  );
};
