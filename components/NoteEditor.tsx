
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, Trash2, Wand2, Sparkles, SpellCheck, AlignLeft, ScanLine } from 'lucide-react';
import { Note } from '../types';
import { AudioService } from '../services/audioService';
import { GeminiService } from '../services/geminiService';

interface NoteEditorProps {
  note: Note;
  onUpdate: (id: string, fields: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ note, onUpdate, onDelete, onClose }) => {
  // Local state for performant typing animation without re-rendering parent
  const [localContent, setLocalContent] = useState(note.content || "");
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const typingIntervalRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync props to local state if changed externally (though rare in this modal view)
  // We use a check to avoid overwriting ongoing typing
  useEffect(() => {
    if (!typingIntervalRef.current && note.content !== localContent) {
        // Only sync if we are NOT currently animating
        // This is a loose sync to prevent cursor jumping if parent updates
        if (Math.abs(note.content.length - localContent.length) > 5) {
            setLocalContent(note.content);
        }
    }
  }, [note.content]);

  // Debounced Save to Parent
  useEffect(() => {
      const timer = setTimeout(() => {
          if (localContent !== note.content && !typingIntervalRef.current) {
              onUpdate(note.id, { content: localContent });
          }
      }, 800);
      return () => clearTimeout(timer);
  }, [localContent]);

  // Cleanup interval on unmount
  useEffect(() => {
      return () => {
          if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      };
  }, []);

  const simulateTyping = (textToType: string, append: boolean = false) => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      
      let currentIndex = 0;
      // If append is false, we clear content first (for full rewrites like fixes)
      // If append is true, we keep existing content and just add the new part
      
      if (!append) {
        setLocalContent("");
      }

      // Calculate speed based on length: faster for longer texts
      const speed = textToType.length > 200 ? 5 : 20;
      
      typingIntervalRef.current = setInterval(() => {
          if (currentIndex < textToType.length) {
              const char = textToType.charAt(currentIndex);
              setLocalContent(prev => prev + char);
              
              // Play sound every few chars
              if (currentIndex % 3 === 0) {
                 AudioService.play('keyboard');
              }
              
              currentIndex++;
          } else {
              if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
              typingIntervalRef.current = null;
              
              // Final sync
              const finalContent = append ? localContent + textToType : textToType; 
              // Note: accessing 'localContent' inside closure might be stale if we relied on it, 
              // but here we are driving state updates via setLocalContent(prev => ...) so visual state is correct.
              // For the onUpdate, it's safer to trigger it via the effect dependency on localContent, 
              // but we can force it here just in case.
              AudioService.play('success');
          }
      }, speed);
  };

  const handleAiAction = async (action: 'fix' | 'summarize' | 'expand') => {
      if (!localContent || isAiProcessing) return;
      setIsAiProcessing(true);
      AudioService.play('click');
      
      try {
        const newText = await GeminiService.refineText(localContent, action);
        if (newText && newText !== localContent) {
            simulateTyping(newText, false); // Rewrite mode
        }
      } catch (e) {
          console.error(e);
      } finally {
          setIsAiProcessing(false);
      }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAiProcessing(true);
    AudioService.play('click');

    const reader = new FileReader();
    reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        try {
            const extractedText = await GeminiService.extractTextFromImage(base64);
            if (extractedText) {
                const textToAppend = (localContent ? "\n\n" : "") + extractedText;
                simulateTyping(textToAppend, true); // Append mode
            }
        } catch (e) {
            console.error("OCR Error", e);
        } finally {
            setIsAiProcessing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    reader.readAsDataURL(file);
  };

  const handleManualChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
      }
      setLocalContent(e.target.value);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-[#000000] flex flex-col animate-slide-up touch-none">
        {/* Header */}
        <div className="pt-safe px-4 pb-2 flex items-center justify-between bg-gradient-to-b from-[#1c1c1e] to-transparent sticky top-0 z-10 backdrop-blur-sm">
            <button 
            onClick={() => { onClose(); AudioService.play('click'); }}
            className="flex items-center gap-1 text-accent active:opacity-50 transition-opacity py-2"
            >
                <ChevronLeft size={24} />
                <span className="text-[17px]">Заметки</span>
            </button>
            
            <div className="flex items-center gap-2">
                <button 
                onClick={() => onDelete(note.id)}
                className="p-2 text-red-400 active:opacity-50 hover:bg-red-500/10 rounded-full transition-colors"
                >
                        <Trash2 size={20} />
                </button>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pt-2 pb-safe no-scrollbar">
                <span className="text-[11px] text-white/30 font-medium uppercase tracking-widest mb-4 block">
                    {new Date(note.lastModified).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                </span>

                <input 
                    type="text"
                    value={note.title}
                    onChange={(e) => onUpdate(note.id, { title: e.target.value })}
                    placeholder="Заголовок"
                    className="w-full bg-transparent border-none outline-none text-white text-3xl font-bold placeholder-white/20 mb-6 leading-tight"
                />

                <div className="relative min-h-[50vh]">
                    <textarea 
                        value={localContent}
                        onChange={handleManualChange}
                        placeholder="Начните писать..."
                        className="w-full h-full min-h-[60vh] bg-transparent border-none outline-none text-white/90 text-lg font-light placeholder-white/20 resize-none leading-relaxed prose-editor pb-32"
                    />
                    {isAiProcessing && !typingIntervalRef.current && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] rounded-xl pointer-events-none">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-0"></div>
                                <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-150"></div>
                                <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-300"></div>
                            </div>
                        </div>
                    )}
                </div>
        </div>

        {/* AI Toolbar - Fixed to keyboard/bottom */}
        <div className="pb-safe px-4 pt-4 bg-[#151515]/80 backdrop-blur-xl border-t border-white/5">
            <input 
                type="file" 
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
            />
            
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                <div className={`w-8 h-8 rounded-full bg-accent-10 flex items-center justify-center shrink-0 transition-all ${isAiProcessing ? 'scale-110' : 'scale-100'}`}>
                    <Wand2 size={16} className={`text-accent ${isAiProcessing ? 'animate-spin' : ''}`} />
                </div>
                
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isAiProcessing}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 text-sm text-white/80 active:bg-white/10 active:scale-95 transition-all whitespace-nowrap disabled:opacity-50"
                >
                    <ScanLine size={14} /> Скан
                </button>

                <div className="w-[1px] h-6 bg-white/10 mx-1"></div>

                <button 
                    onClick={() => handleAiAction('fix')}
                    disabled={isAiProcessing}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 text-sm text-white/80 active:bg-white/10 active:scale-95 transition-all whitespace-nowrap disabled:opacity-50"
                >
                    <SpellCheck size={14} /> Исправить
                </button>
                <button 
                    onClick={() => handleAiAction('summarize')}
                    disabled={isAiProcessing}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 text-sm text-white/80 active:bg-white/10 active:scale-95 transition-all whitespace-nowrap disabled:opacity-50"
                >
                    <AlignLeft size={14} /> Сократить
                </button>
                <button 
                    onClick={() => handleAiAction('expand')}
                    disabled={isAiProcessing}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 text-sm text-white/80 active:bg-white/10 active:scale-95 transition-all whitespace-nowrap disabled:opacity-50"
                >
                    <Sparkles size={14} /> Дополнить
                </button>
            </div>
        </div>
    </div>,
    document.body
  );
};
