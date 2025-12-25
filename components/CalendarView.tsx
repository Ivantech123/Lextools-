import React, { useState, memo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, MoreHorizontal, RefreshCw, ChevronDown, ChevronUp, Plus, Clock, MapPin, CloudSun, X, ArrowRight, Save, Trash2, AlignLeft, Check, Gavel, AlertTriangle, Briefcase, CheckSquare } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { CalendarEvent, Task, ViewState } from '../types';
import { GeminiService } from '../services/geminiService';
import { AudioService } from '../services/audioService';
import { InfoSheet } from './InfoSheet';

const DayItem = memo(({ day, n, isSelected }: { day: string, n: number, isSelected: boolean }) => (
  <div 
    className={`snap-center flex-shrink-0 flex flex-col items-center justify-center w-[4.2rem] h-[4.8rem] rounded-[1.25rem] transition-all duration-300 border gpu-layer
      ${isSelected 
        ? 'bg-white/10 border-white/20 scale-105 shadow-[0_0_20px_rgba(255,255,255,0.05)]' 
        : 'bg-transparent border-transparent text-white/40 active:bg-white/5'}`}
  >
    <span className={`text-[10px] font-semibold uppercase mb-1 tracking-wider ${isSelected ? 'text-white' : ''}`}>{day}</span>
    <span className={`text-xl font-light ${isSelected ? 'text-white' : ''}`}>{n}</span>
  </div>
));

export const CalendarView: React.FC = () => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentTime, setCurrentTime] = useState('');
  
  // Stored Events
  const [storedEvents, setStoredEvents] = useState<CalendarEvent[]>(() => {
      const saved = localStorage.getItem('glassai_events');
      return saved ? JSON.parse(saved) : [];
  });

  // Display Events (Stored + Tasks with Deadlines)
  const [displayEvents, setDisplayEvents] = useState<CalendarEvent[]>([]);

  const [isPlanning, setIsPlanning] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<CalendarEvent>>({});
  const [showInfoSheet, setShowInfoSheet] = useState(false);

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem('glassai_events', JSON.stringify(storedEvents));
  }, [storedEvents]);

  // Combined Data Logic
  const refreshData = () => {
      // 1. Get Events
      const events = JSON.parse(localStorage.getItem('glassai_events') || '[]');
      
      // 2. Get Tasks with Times
      const tasks: Task[] = JSON.parse(localStorage.getItem('glassai_tasks') || '[]');
      const timeTasks = tasks.filter(t => !t.completed && (t.dueTime || t.dueDate)).map(t => ({
          id: `task-${t.id}`,
          title: t.title,
          time: t.dueTime || '09:00',
          type: 'deadline' as const,
          description: 'Задача из списка дел',
          isTask: true,
          caseRef: t.id // Store real task id here
      }));

      // 3. Merge and Sort
      const combined = [...events, ...timeTasks].sort((a, b) => a.time.localeCompare(b.time));
      setDisplayEvents(combined);
      setStoredEvents(events); // Keep original events source valid
  };

  useEffect(() => {
      refreshData();
      const handleUpdate = () => refreshData();
      window.addEventListener('data-updated', handleUpdate); // Listen to global updates
      return () => window.removeEventListener('data-updated', handleUpdate);
  }, []);

  useEffect(() => {
    const updateTime = () => {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedEvent) {
        setEditForm(selectedEvent);
    }
  }, [selectedEvent]);

   // Manual touch handling for pull-to-reveal info
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
      if (containerRef.current?.scrollTop === 0) {
          touchStartY.current = e.touches[0].clientY;
      }
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
      if (containerRef.current?.scrollTop === 0) {
          const diff = e.changedTouches[0].clientY - touchStartY.current;
          if (diff > 120) { // Dragged down significantly
              setShowInfoSheet(true);
              AudioService.play('open');
          }
      }
  };


  const handleAIPlanning = async () => {
    setIsPlanning(true);
    AudioService.play('click');
    const tasks = JSON.parse(localStorage.getItem('glassai_tasks') || '[]').filter((t: any) => !t.completed).map((t: any) => t.title);
    const context = "Я юрист. Спланируй эти задачи с учетом возможных судебных заседаний.";
    
    const response = await GeminiService.generateSchedule(tasks.length ? tasks : ["Изучение дела", "Встреча с клиентом"], context);
    
    if (response && response.schedule) {
      const newEvents: CalendarEvent[] = response.schedule.map((item, idx) => ({
        id: `ai-${Date.now()}-${idx}`,
        title: item.activity,
        time: item.time,
        type: item.type === 'work' ? 'court' : 'other', 
        description: "Создано LexTools AI"
      }));
      setStoredEvents(prev => [...prev, ...newEvents]);
      AudioService.play('success');
      setTimeout(refreshData, 100);
    }
    setIsPlanning(false);
  };

  const handleCreateEvent = () => {
      AudioService.play('click');
      const newEvent: CalendarEvent = {
          id: Date.now().toString(),
          title: '',
          time: currentTime,
          type: 'court',
          description: '',
          location: ''
      };
      setSelectedEvent(newEvent);
      setEditForm(newEvent);
      setIsEditing(true);
  };

  const handleSaveEvent = () => {
      if (!selectedEvent || !editForm.title) return;
      AudioService.play('success');
      
      setStoredEvents(prev => {
          const exists = prev.find(e => e.id === selectedEvent.id);
          if (exists) {
              return prev.map(ev => ev.id === selectedEvent.id ? { ...ev, ...editForm } as CalendarEvent : ev);
          } else {
              return [...prev, { ...selectedEvent, ...editForm } as CalendarEvent];
          }
      });
      
      setTimeout(refreshData, 100);
      setSelectedEvent(null);
      setIsEditing(false);
  };

  const handleDeleteEvent = () => {
      if (!selectedEvent) return;
      AudioService.play('delete');
      if (selectedEvent.isTask) {
          // If it's a task, we should technically complete it or remove date, 
          // but for now let's just alert user they should edit task
          alert("Это задача. Отредактируйте её в списке задач.");
      } else {
          setStoredEvents(prev => prev.filter(ev => ev.id !== selectedEvent.id));
          setTimeout(refreshData, 100);
      }
      setSelectedEvent(null);
  };

  const getTypeStyles = (type: string, isTask?: boolean) => {
    if (isTask) return {
        border: 'border-emerald-400',
        dot: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]',
        bg: 'bg-emerald-400/10',
        text: 'text-emerald-300',
        bar: 'bg-emerald-500',
        icon: CheckSquare
    };

    switch(type) {
      case 'court': return { 
          border: 'border-red-500', 
          dot: 'bg-red-600 shadow-[0_0_12px_rgba(239,68,68,0.8)]', 
          bg: 'bg-red-500/10', 
          text: 'text-red-300',
          bar: 'bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]',
          icon: Gavel
      };
      case 'meeting': return { 
          border: 'border-blue-400', 
          dot: 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]', 
          bg: 'bg-blue-400/10', 
          text: 'text-blue-300',
          bar: 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]',
          icon: Briefcase
      };
      case 'deadline': return { 
          border: 'border-orange-400', 
          dot: 'bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.8)]', 
          bg: 'bg-orange-400/10', 
          text: 'text-orange-300',
          bar: 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]',
          icon: AlertTriangle
      };
      default: return { 
          border: 'border-white/40', 
          dot: 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]', 
          bg: 'bg-white/10', 
          text: 'text-white/80',
          bar: 'bg-white/40',
          icon: Clock
      };
    }
  };

  const weekDays = [
    { d: 'Пн', n: 10 }, { d: 'Вт', n: 11 }, { d: 'Ср', n: 12 }, 
    { d: 'Чт', n: 13 }, { d: 'Пт', n: 14 }, { d: 'Сб', n: 15 }, { d: 'Вс', n: 16 }
  ];

  return (
    <div className="h-full flex flex-col relative overflow-hidden items-center">
      
      <InfoSheet 
        view={ViewState.CALENDAR} 
        isOpen={showInfoSheet} 
        onClose={() => setShowInfoSheet(false)} 
      />

      {/* Scrollable Content */}
      <div 
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex-1 w-full flex flex-col px-5 pb-32 overflow-y-auto no-scrollbar touch-pan-y overscroll-contain"
      >
        <div className="max-w-5xl mx-auto w-full relative h-full">
            {/* Pull Indicator Hint */}
            <div className="absolute top-0 left-0 right-0 h-1 flex justify-center opacity-20 z-0 lg:hidden">
                <div className="w-8 h-1 bg-white rounded-full mt-2"></div>
            </div>

            <header className="mt-2 pt-safe lg:pt-8 mb-4 flex justify-between items-center animate-slide-up gpu-layer relative z-10">
                <div onClick={() => { setViewMode(viewMode === 'week' ? 'month' : 'week'); AudioService.play('click'); }} className="cursor-pointer active:opacity-70 transition-opacity">
                    <div className="flex items-center gap-2">
                        <h1 className="text-4xl font-extralight text-white tracking-tight leading-none">Сентябрь</h1>
                        {viewMode === 'week' ? <ChevronDown size={20} className="text-white/50" /> : <ChevronUp size={20} className="text-white/50" />}
                    </div>
                    <p className="text-white/50 mt-1 font-normal text-sm">2026 год • LexTools</p>
                </div>
                
                <div className="flex gap-3">
                    <button 
                        onClick={handleAIPlanning}
                        disabled={isPlanning}
                        className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all active:bg-white/10 backdrop-blur-md"
                    >
                        {isPlanning ? <RefreshCw className="animate-spin text-purple-300" size={20} /> : <Calendar size={20} />}
                    </button>
                </div>
            </header>

            {/* View Mode Toggle Area */}
            <div className="relative z-20 mb-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                {viewMode === 'week' && (
                    <div className="animate-slide-up -mx-5 px-5 lg:mx-0 lg:px-0 overflow-x-auto no-scrollbar flex gap-2 pb-2 snap-x snap-mandatory touch-pan-x cursor-grab active:cursor-grabbing">
                        {weekDays.map((day, index) => (
                        <DayItem 
                            key={day.d} 
                            day={day.d} 
                            n={day.n} 
                            isSelected={index === 2} 
                        />
                        ))}
                        <div className="w-4 flex-shrink-0" />
                    </div>
                )}
            </div>

            {/* Timeline Area */}
            <div className="relative pl-4 space-y-4 content-lock pb-20">
                {/* Vertical Line */}
                <div className="absolute left-[19px] top-4 bottom-4 w-[1px] bg-white/10" />

                {/* Current Time Indicator Line */}
                <div className="absolute left-0 right-0 h-[1px] bg-red-500/60 z-10 pointer-events-none" 
                    style={{ top: '35%', boxShadow: '0 0 10px rgba(239,68,68,0.5)' }}> 
                    <div className="absolute left-0 -top-2 w-12 bg-red-600 rounded text-[10px] font-bold px-1.5 py-0.5 text-white shadow-lg flex items-center justify-center">
                        {currentTime}
                    </div>
                    <div className="absolute left-11 -top-[3px] w-2 h-2 bg-red-600 rounded-full"></div>
                </div>
                
                {displayEvents.length === 0 && (
                    <div className="py-10 text-center text-white/20 animate-fade-in pl-8">
                        <p>Нет заседаний</p>
                    </div>
                )}

                {displayEvents.map((event, index) => {
                const style = getTypeStyles(event.type, event.isTask);
                const Icon = style.icon;
                return (
                    <div 
                    key={event.id} 
                    className="relative pl-8 animate-slide-up gpu-layer z-0"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => { setSelectedEvent(event); setIsEditing(false); AudioService.play('click'); }}
                    >
                    <div className={`absolute left-[14px] top-[24px] w-[11px] h-[11px] rounded-full z-10 border-[2px] border-[#121212] ${style.dot} transition-all duration-500`}></div>
                    
                    <GlassCard className={`p-0 group active:scale-[0.98] transition-transform cursor-pointer overflow-hidden`}>
                        <div className="flex items-stretch min-h-[5.5rem]">
                            <div className={`w-1.5 ${style.bar}`}></div>
                            
                            <div className="flex-1 p-4 pr-3 flex justify-between items-start">
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 text-xs font-bold text-white/60 font-mono bg-white/5 px-2 py-0.5 rounded-md">
                                        <Clock size={10} />
                                        {event.time}
                                    </div>
                                    <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold flex items-center gap-1 ${style.text} ${style.bg}`}>
                                        <Icon size={10} />
                                        {event.isTask ? 'Задача' : (event.type === 'court' ? 'Заседание' : event.type)}
                                    </span>
                                    </div>
                                    <h3 className="text-[17px] text-white font-medium leading-tight">{event.title}</h3>
                                </div>
                                <div className="text-white/20 p-2">
                                    <MoreHorizontal size={18} />
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                    </div>
                );
                })}
            </div>
        </div>
      </div>

      {/* Floating Add Button */}
      <button 
        onClick={handleCreateEvent}
        className="absolute bottom-28 lg:bottom-10 right-6 lg:right-10 z-40 w-14 h-14 rounded-full bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.25)] flex items-center justify-center active:scale-90 transition-transform animate-scale-in"
      >
        <Plus size={28} />
      </button>

      {/* Event Detail / Edit Modal - Using Portal */}
      {selectedEvent && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end justify-center touch-none">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-xl animate-fade-in duration-500"
                onClick={() => { setSelectedEvent(null); setIsEditing(false); }}
            ></div>

            <div 
                className="w-full lg:max-w-2xl bg-[#1c1c1e] border-t lg:border border-white/10 rounded-t-[2.5rem] lg:rounded-[2.5rem] p-6 pb-safe pt-6 animate-slide-up shadow-[0_-20px_100px_rgba(0,0,0,0.9)] relative max-h-[85dvh] overflow-y-auto no-scrollbar z-[10000] lg:mb-10"
                onClick={(e) => e.stopPropagation()}
            >
                 {/* Handle Bar */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full lg:hidden" />

                {/* Modal Header */}
                <div className="flex justify-between items-start mb-6 mt-4">
                     {!isEditing ? (
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-white/5 flex items-center gap-1 ${getTypeStyles(selectedEvent.type, selectedEvent.isTask).bg} ${getTypeStyles(selectedEvent.type, selectedEvent.isTask).text}`}>
                            {selectedEvent.isTask ? 'Задача' : selectedEvent.type}
                        </div>
                     ) : (
                         <span className="text-white/50 text-sm font-medium pl-1">{selectedEvent.title ? 'Редактирование' : 'Новое дело'}</span>
                     )}
                     <button onClick={() => { setSelectedEvent(null); setIsEditing(false); AudioService.play('click'); }} className="p-2 bg-white/10 rounded-full text-white active:bg-white/20 transition-colors">
                         <X size={20} />
                     </button>
                </div>
                
                {/* Content Logic */}
                {isEditing ? (
                    <div className="space-y-4 animate-fade-in">
                        <div className="space-y-1">
                            <label className="text-xs text-white/40 ml-3 uppercase tracking-wider font-bold">Название</label>
                            <input 
                                type="text" 
                                value={editForm.title || ''} 
                                onChange={e => setEditForm({...editForm, title: e.target.value})}
                                placeholder="Слушание по делу..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-lg outline-none focus:border-white/30 focus:bg-white/10 transition-colors"
                            />
                        </div>

                         <div className="space-y-1">
                            <label className="text-xs text-white/40 ml-3 uppercase tracking-wider font-bold">Тип</label>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                {['court', 'meeting', 'deadline', 'other'].map(t => (
                                    <button 
                                        key={t}
                                        onClick={() => { setEditForm({...editForm, type: t as any}); AudioService.play('click'); }}
                                        className={`px-4 py-2 rounded-xl border text-xs font-bold uppercase transition-all whitespace-nowrap
                                            ${editForm.type === t 
                                                ? getTypeStyles(t).bg + ' ' + getTypeStyles(t).border + ' ' + getTypeStyles(t).text
                                                : 'border-white/10 text-white/40 bg-white/5'
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="flex gap-3">
                             <div className="flex-1 space-y-1">
                                <label className="text-xs text-white/40 ml-3 uppercase tracking-wider font-bold">Время</label>
                                <input 
                                    type="time" 
                                    value={editForm.time || ''} 
                                    onChange={e => setEditForm({...editForm, time: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-lg outline-none focus:border-white/30"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-6">
                            <button 
                                onClick={handleDeleteEvent}
                                className="p-4 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center active:scale-95 transition-transform"
                            >
                                <Trash2 size={20} />
                            </button>
                            <button 
                                onClick={handleSaveEvent}
                                className="flex-1 py-4 bg-white text-black rounded-2xl font-bold text-[17px] active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg shadow-white/10"
                            >
                                <Save size={18} />
                                Сохранить
                            </button>
                        </div>
                    </div>
                ) : (
                    // View Mode
                    <div className="animate-fade-in">
                        <h2 className="text-3xl font-light text-white mb-2 leading-tight">{selectedEvent.title}</h2>
                        
                        <div className="space-y-4 mt-6">
                            <div className="flex items-center gap-4 text-white/70 p-4 bg-white/5 rounded-[1.5rem] border border-white/5 backdrop-blur-sm">
                                <Clock size={20} className="text-white/50" />
                                <span className="text-lg font-medium text-white tracking-wide">{selectedEvent.time}</span>
                            </div>
                            {selectedEvent.description && (
                                <div className="mt-4 p-5 bg-white/5 rounded-[1.5rem] text-white/80 text-base leading-relaxed border border-white/5 flex items-start gap-3">
                                    <AlignLeft size={18} className="text-white/30 shrink-0 mt-1" />
                                    {selectedEvent.description}
                                </div>
                            )}
                        </div>

                        {!selectedEvent.isTask && (
                        <div className="mt-10 flex gap-3 pb-4">
                            <button 
                                onClick={() => { setIsEditing(true); AudioService.play('click'); }}
                                className="flex-1 py-4 bg-[#2c2c2e] text-white rounded-2xl font-semibold text-[17px] active:scale-95 transition-transform border border-white/5"
                            >
                                Изменить
                            </button>
                        </div>
                        )}
                    </div>
                )}
            </div>
        </div>,
        document.body
      )}
    </div>
  );
};