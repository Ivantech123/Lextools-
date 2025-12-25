import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, Circle, CheckCircle, Trash2, Flag, Target, Zap, Wand2, X, ListChecks, StickyNote, Play, Pause, ChevronLeft, Calendar as CalendarIcon, Clock, User as UserIcon, Settings } from 'lucide-react';
import { Task, Priority, Note, ViewState } from '../types';
import { GlassCard } from './GlassCard';
import { SwipeableItem } from './SwipeableItem';
import { GeminiService } from '../services/geminiService';
import { AudioService } from '../services/audioService';
import { NoteEditor } from './NoteEditor';
import { InfoSheet } from './InfoSheet';

type WorkspaceMode = 'tasks' | 'notes';

interface TaskViewProps {
    onOpenSettings: () => void;
}

export const TaskView: React.FC<TaskViewProps> = ({ onOpenSettings }) => {
  // --- STATE: MODE & DATA ---
  const [mode, setMode] = useState<WorkspaceMode>('tasks');
  
  // Tasks Logic
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('glassai_tasks');
    return saved ? JSON.parse(saved) : [
        { id: 'welcome', title: 'Добро пожаловать в LexTools', completed: false, category: 'Система', priority: Priority.HIGH }
    ];
  });

  // Notes Logic
  const [notes, setNotes] = useState<Note[]>(() => {
      const saved = localStorage.getItem('glassai_notes');
      return saved ? JSON.parse(saved) : [];
  });
  
  // UI State
  const [inputValue, setInputValue] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<Priority>(Priority.MEDIUM);
  const [isSmartAdding, setIsSmartAdding] = useState(false);
  const [showInfoSheet, setShowInfoSheet] = useState(false);

  // Note Editor State
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Focus / Timer State
  const [focusMode, setFocusMode] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);

  // Scroll/Pull-down Logic
  const containerRef = useRef<HTMLDivElement>(null);

  // --- EFFECTS ---
  useEffect(() => {
    localStorage.setItem('glassai_tasks', JSON.stringify(tasks));
    window.dispatchEvent(new Event('data-updated'));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('glassai_notes', JSON.stringify(notes));
  }, [notes]);
  
  // Manual touch handling for pull-to-reveal info
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

  // Timer Logic
  useEffect(() => {
      let interval: any;
      if (focusMode && timerActive && timeLeft > 0) {
          interval = setInterval(() => {
              setTimeLeft((prev) => prev - 1);
          }, 1000);
      } else if (timeLeft === 0) {
          setTimerActive(false);
          AudioService.play('success');
      }
      return () => clearInterval(interval);
  }, [focusMode, timerActive, timeLeft]);

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleModeSwitch = (m: WorkspaceMode) => {
      setMode(m);
      AudioService.play('click');
  };

  // --- ACTIONS ---

  const addItem = useCallback(async () => {
    if (!inputValue.trim()) return;
    AudioService.play('click');

    if (mode === 'tasks') {
        setTasks(prev => [{ 
            id: Date.now().toString(), 
            title: inputValue, 
            completed: false, 
            category: 'Входящие',
            priority: selectedPriority
        }, ...prev]);
    } else {
        const newNote: Note = {
            id: Date.now().toString(),
            title: inputValue,
            content: '', 
            lastModified: Date.now()
        };
        setNotes(prev => [newNote, ...prev]);
        setSelectedNote(newNote); // Auto open
    }
    setInputValue('');
  }, [inputValue, selectedPriority, mode]);

  const handleSmartAdd = async () => {
      if (!inputValue.trim()) return;
      setIsSmartAdding(true);
      AudioService.play('click');
      
      if (mode === 'tasks') {
          const analysis = await GeminiService.analyzeInput(inputValue);
          if (analysis) {
              if (analysis.type === 'task') {
                  setTasks(prev => [{
                      id: Date.now().toString(),
                      title: analysis.title,
                      completed: false,
                      category: analysis.category || 'Входящие',
                      priority: analysis.priority as Priority || Priority.MEDIUM,
                      dueTime: analysis.time, // Add time if AI found it
                      dueDate: analysis.date, // Add date if AI found it
                      aiGenerated: true
                  }, ...prev]);
                  AudioService.play('success');
              } else {
                  setTasks(prev => [{
                      id: Date.now().toString(),
                      title: analysis.title,
                      completed: false,
                      category: 'Событие',
                      priority: Priority.HIGH,
                      dueTime: analysis.time,
                      dueDate: analysis.date,
                      aiGenerated: true
                  }, ...prev]);
                  AudioService.play('success');
              }
          } else {
              addItem();
          }
      } else {
           setNotes(prev => [{
              id: Date.now().toString(),
              title: inputValue,
              content: 'AI: Заметка создана автоматически...', 
              lastModified: Date.now(),
              tags: ['AI']
          }, ...prev]);
      }
      
      setIsSmartAdding(false);
      setInputValue('');
  };

  const deleteItem = (id: string, type: 'task' | 'note', e?: React.MouseEvent) => {
      e?.stopPropagation();
      AudioService.play('delete');
      if (type === 'task') {
          setTasks(prev => prev.filter(t => t.id !== id));
      } else {
          setNotes(prev => prev.filter(n => n.id !== id));
          if (selectedNote?.id === id) setSelectedNote(null);
      }
  };

  const toggleTask = (id: string) => {
    AudioService.play('click');
    setTasks(prev => prev.map(t => {
        if (t.id === id) {
            if (!t.completed) AudioService.play('success');
            return { ...t, completed: !t.completed };
        }
        return t;
    }));
  };

  const updateNote = (id: string, fields: Partial<Note>) => {
      setNotes(prev => prev.map(n => n.id === id ? { ...n, ...fields, lastModified: Date.now() } : n));
      setSelectedNote(prev => prev && prev.id === id ? { ...prev, ...fields, lastModified: Date.now() } : prev);
  };

  // --- RENDER HELPERS ---

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  const getPriorityColor = (p?: Priority) => {
    switch (p) {
      case Priority.HIGH: return 'text-red-400';
      case Priority.MEDIUM: return 'text-yellow-400';
      case Priority.LOW: return 'text-blue-400';
      default: return 'text-white/20';
    }
  };

  return (
    <div 
        className="h-full flex flex-col relative w-full items-center"
    >
      <InfoSheet 
        view={ViewState.TASKS} 
        isOpen={showInfoSheet} 
        onClose={() => setShowInfoSheet(false)} 
      />

      <div 
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex-1 w-full overflow-y-auto px-5 pb-32 no-scrollbar touch-pan-y transition-all duration-500 relative"
      >
        <div className="max-w-5xl mx-auto w-full">
            {/* Pull Indicator Hint */}
            <div className="absolute top-0 left-0 right-0 h-1 flex justify-center opacity-20 lg:hidden">
                <div className="w-8 h-1 bg-white rounded-full mt-2"></div>
            </div>
        
            {/* Header & Mode Switcher */}
            <header className={`mt-2 pt-safe lg:pt-8 mb-6 animate-slide-up gpu-layer transition-all duration-500 ${focusMode ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
                <div className="flex justify-between items-center mb-4">
                <h1 className="font-extralight text-4xl text-white tracking-tight">Работа</h1>
                <div className="flex gap-3">
                    <button
                        onClick={() => { setFocusMode(true); setTimerActive(true); AudioService.play('click'); }}
                        className="w-11 h-11 rounded-full border border-white/5 bg-white/5 flex items-center justify-center backdrop-blur-md text-accent hover:bg-accent-10 hover:text-white transition-all"
                    >
                        <Target size={20} />
                    </button>
                    {/* Mobile Only User Button, Desktop has it in sidebar */}
                    <div className="lg:hidden">
                        <button
                            onClick={onOpenSettings}
                            className="w-11 h-11 rounded-full overflow-hidden border border-white/5 relative active:scale-95 transition-transform"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-accent-20 to-transparent"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <UserIcon size={20} className="text-white/70" />
                            </div>
                        </button>
                    </div>
                </div>
                </div>

                {/* Custom Segmented Control */}
                <div className="p-1 bg-white/5 rounded-2xl flex relative max-w-md">
                    <div 
                        className={`absolute top-1 bottom-1 w-[48%] bg-[#2c2c2e] rounded-xl shadow-lg transition-transform duration-300 ease-ios-spring ${mode === 'notes' ? 'translate-x-[100%]' : 'translate-x-0'}`} 
                    />
                    <button 
                        onClick={() => handleModeSwitch('tasks')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 relative z-10 text-sm font-medium transition-colors ${mode === 'tasks' ? 'text-white' : 'text-white/40'}`}
                    >
                        <ListChecks size={16} /> Задачи
                    </button>
                    <button 
                        onClick={() => handleModeSwitch('notes')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 relative z-10 text-sm font-medium transition-colors ${mode === 'notes' ? 'text-white' : 'text-white/40'}`}
                    >
                        <StickyNote size={16} /> Заметки
                    </button>
                </div>
            </header>

            {/* FOCUS MODE OVERLAY */}
            {focusMode && (
                <div className="flex flex-col items-center justify-center h-[60vh] animate-scale-in relative z-50">
                    <button 
                        onClick={() => { setFocusMode(false); AudioService.play('click'); }}
                        className="absolute top-0 right-0 p-3 text-white/30 hover:text-white"
                    >
                        <X size={24} />
                    </button>

                    <div className="w-64 h-64 rounded-full border-[6px] border-white/5 flex items-center justify-center relative mb-8">
                        <div className="absolute inset-0 rounded-full border-[6px] border-accent border-t-transparent animate-spin duration-[3000ms]" style={{ animationPlayState: timerActive ? 'running' : 'paused' }} />
                        <div className="text-6xl font-thin text-white font-mono tracking-wider">
                            {formatTime(timeLeft)}
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-white text-xl font-light mb-1">{activeTasks[0]?.title || "Глубокая работа"}</h2>
                        <p className="text-accent text-sm uppercase tracking-widest">Focus Session</p>
                    </div>

                    <div className="flex gap-6">
                        <button 
                            onClick={() => { setTimerActive(!timerActive); AudioService.play('click'); }}
                            className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center active:scale-90 transition-transform"
                        >
                            {timerActive ? <Pause size={24} fill="black" /> : <Play size={24} fill="black" className="ml-1" />}
                        </button>
                    </div>
                </div>
            )}

            {/* INPUT AREA */}
            {!focusMode && (
                <div className="animate-slide-up delay-75 mb-6 z-20 gpu-layer">
                    <div className="p-1 pl-4 bg-[#1c1c1e]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] flex items-center gap-2 transition-all focus-within:border-white/20 focus-within:bg-[#252529]">
                        <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={mode === 'tasks' ? "Новая задача..." : "Заголовок заметки..."}
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/30 text-[17px] font-normal h-12 min-w-0"
                        onKeyDown={(e) => e.key === 'Enter' && addItem()}
                        />
                        
                        <div className="flex gap-1 pr-1">
                            {mode === 'tasks' && (
                                <button 
                                    onClick={handleSmartAdd}
                                    disabled={isSmartAdding || !inputValue}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-purple-300 transition-all disabled:opacity-30 active:scale-95"
                                >
                                    {isSmartAdding ? <div className="w-4 h-4 border-2 border-purple-300 border-t-transparent rounded-full animate-spin" /> : <Wand2 size={18} />}
                                </button>
                            )}
                            <button 
                                onClick={() => addItem()}
                                disabled={!inputValue}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-black transition-transform active:scale-90 disabled:opacity-30 disabled:bg-white/20 disabled:text-white"
                            >
                                <Plus size={22} />
                            </button>
                        </div>
                    </div>
                    {mode === 'tasks' && (
                        <div className="flex gap-2 px-2 mt-3">
                            {[Priority.HIGH, Priority.MEDIUM, Priority.LOW].map(p => (
                            <button
                                key={p}
                                onClick={() => { setSelectedPriority(p); AudioService.play('click'); }}
                                className={`px-3 py-1.5 rounded-full text-[11px] font-medium tracking-wide border transition-all uppercase
                                ${selectedPriority === p 
                                    ? (p === Priority.HIGH ? 'bg-red-500/20 border-red-500 text-red-200' : p === Priority.MEDIUM ? 'bg-yellow-500/20 border-yellow-500 text-yellow-200' : 'bg-blue-500/20 border-blue-500 text-blue-200')
                                    : 'bg-white/5 border-transparent text-white/40'
                                }`}
                            >
                                {p === Priority.HIGH ? 'Важно' : p === Priority.MEDIUM ? 'Обычно' : 'Низкий'}
                            </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* CONTENT AREA */}
            {!focusMode && (
                <div className="space-y-4 content-lock min-h-[300px]">
                    
                    {/* TASKS VIEW */}
                    {mode === 'tasks' && (
                        <>
                            {activeTasks.length === 0 && inputValue === '' && (
                                <div className="text-center text-white/20 py-12 font-light animate-scale-in">
                                    <p className="text-lg">Задач нет</p>
                                    <p className="text-xs">Наслаждайтесь свободой</p>
                                </div>
                            )}

                            {activeTasks.map((task, index) => (
                                <div 
                                key={task.id} 
                                className="animate-slide-up gpu-layer" 
                                style={{ animationDelay: `${index < 5 ? index * 30 : 0}ms` }} 
                                >
                                    <SwipeableItem
                                        onSwipeLeft={() => deleteItem(task.id, 'task')}
                                        onSwipeRight={() => toggleTask(task.id)}
                                    >
                                        <GlassCard 
                                            onClick={() => toggleTask(task.id)}
                                            variant="light" 
                                            className="p-4 pr-3 flex items-center gap-3.5 group relative !rounded-none" 
                                        >
                                            <button className="text-white/30 group-active:text-accent transition-colors shrink-0 mt-0.5">
                                                <Circle size={22} strokeWidth={1.5} />
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[17px] text-white font-normal truncate leading-snug tracking-tight">
                                                    {task.title}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {task.category && (
                                                    <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">
                                                        {task.category}
                                                    </span>
                                                    )}
                                                    {task.priority && (
                                                        <Flag size={10} className={getPriorityColor(task.priority)} fill="currentColor" />
                                                    )}
                                                    {task.dueTime && (
                                                        <div className="flex items-center gap-0.5 text-[10px] text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                                                            <Clock size={8} /> {task.dueTime}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </GlassCard>
                                    </SwipeableItem>
                                </div>
                            ))}
                        </>
                    )}

                    {/* NOTES VIEW */}
                    {mode === 'notes' && (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                            {notes.length === 0 && (
                                <div className="col-span-2 lg:col-span-3 text-center text-white/20 py-12 font-light animate-scale-in">
                                    <p className="text-lg">Нет заметок</p>
                                </div>
                            )}
                            {notes.map((note, index) => (
                                <div key={note.id} className="animate-slide-up gpu-layer" style={{ animationDelay: `${index * 30}ms` }}>
                                    <SwipeableItem onSwipeLeft={() => deleteItem(note.id, 'note')}>
                                        <GlassCard 
                                            onClick={() => { setSelectedNote(note); AudioService.play('open'); }}
                                            className="h-44 p-5 flex flex-col justify-between active:scale-[0.98] group hover:border-white/20 !rounded-none"
                                        >
                                            <div className="overflow-hidden">
                                                <h3 className="text-white text-[17px] font-semibold line-clamp-2 leading-tight mb-2 tracking-tight group-hover:text-accent transition-colors">{note.title || "Без названия"}</h3>
                                                <p className="text-white/50 text-[13px] line-clamp-4 leading-relaxed font-light">
                                                    {note.content || "Текст отсутствует..."}
                                                </p>
                                            </div>
                                            <div className="flex justify-between items-center mt-2 border-t border-white/5 pt-3">
                                                <span className="text-[10px] text-white/30 font-medium">{new Date(note.lastModified).toLocaleDateString()}</span>
                                            </div>
                                        </GlassCard>
                                    </SwipeableItem>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Completed Tasks (Only in Task Mode) */}
                    {mode === 'tasks' && completedTasks.length > 0 && (
                    <div className="pt-2">
                        <div className="flex items-center gap-3 mb-4 px-2 opacity-30 animate-slide-up">
                            <div className="h-[1px] bg-white flex-1"></div>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Завершено</span>
                            <div className="h-[1px] bg-white flex-1"></div>
                        </div>
                        <div className="space-y-2">
                            {completedTasks.map((task) => (
                                <SwipeableItem 
                                    key={task.id}
                                    onSwipeRight={() => toggleTask(task.id)} 
                                    onSwipeLeft={() => deleteItem(task.id, 'task')}
                                >
                                    <GlassCard 
                                        onClick={() => toggleTask(task.id)}
                                        variant="flat" 
                                        className="p-3.5 flex items-center gap-3 opacity-40 active:opacity-100 transition-opacity !rounded-none"
                                    >
                                        <CheckCircle size={20} className="text-white/50" />
                                        <span className="text-[15px] text-white line-through decoration-white/30 decoration-1 flex-1 truncate">{task.title}</span>
                                    </GlassCard>
                                </SwipeableItem>
                            ))}
                        </div>
                    </div>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* --- FULL SCREEN NOTE EDITOR --- */}
      {selectedNote && (
          <NoteEditor 
             note={selectedNote}
             onUpdate={updateNote}
             onDelete={(id) => { deleteItem(id, 'note'); setSelectedNote(null); }}
             onClose={() => setSelectedNote(null)}
          />
      )}
    </div>
  );
};