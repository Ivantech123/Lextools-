import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Zap, Aperture, Check, RefreshCw, AlertTriangle } from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { AudioService } from '../services/audioService';
import { GlassCard } from './GlassCard';
import { Priority, ViewState } from '../types';
import { InfoSheet } from './InfoSheet';

export const ScannerView: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInfoSheet, setShowInfoSheet] = useState(false);

  // Initialize Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError("Доступ к камере запрещен или недоступен.");
        console.error("Camera Error:", err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    AudioService.play('shutter');

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(dataUrl);
      setIsProcessing(true);
      
      const base64Data = dataUrl.split(',')[1];
      
      const analysis = await GeminiService.analyzeImage(base64Data);
      setResult(analysis);
      setIsProcessing(false);
      AudioService.play('success');
    }
  };

  const handleSave = () => {
      if (!result) return;
      AudioService.play('click');
      
      if (result.type === 'task') {
          const tasks = JSON.parse(localStorage.getItem('glassai_tasks') || '[]');
          const newTask = {
              id: Date.now().toString(),
              title: result.title,
              completed: false,
              category: result.category || 'Скан',
              priority: result.priority as Priority || Priority.MEDIUM,
              dueTime: result.time,
              aiGenerated: true
          };
          localStorage.setItem('glassai_tasks', JSON.stringify([newTask, ...tasks]));
      } else {
          // Event
          const events = JSON.parse(localStorage.getItem('glassai_events') || '[]');
          const newEvent = {
              id: Date.now().toString(),
              title: result.title,
              time: result.time || '12:00',
              type: 'other',
              description: 'Создано из скана'
          };
          localStorage.setItem('glassai_events', JSON.stringify([...events, newEvent]));
      }
      
      // Notify other components
      window.dispatchEvent(new Event('data-updated'));
      
      handleRetake();
  };

  const handleRetake = () => {
      setCapturedImage(null);
      setResult(null);
      setIsProcessing(false);
      AudioService.play('click');
  };

  // Pull down logic for info (only if not capturing)
  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
      if (capturedImage) return;
      const diff = e.changedTouches[0].clientY - touchStartY.current;
      if (diff > 150 && touchStartY.current < 150) {
          setShowInfoSheet(true);
          AudioService.play('open');
      }
  };

  return (
    <div 
        className="h-full w-full bg-black relative overflow-hidden flex flex-col items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
    >
      <InfoSheet 
        view={ViewState.SCANNER} 
        isOpen={showInfoSheet} 
        onClose={() => setShowInfoSheet(false)} 
      />

      {/* Hidden Canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera Feed or Captured Image */}
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
          {capturedImage ? (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover lg:object-contain" />
          ) : (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover lg:max-w-4xl lg:rounded-2xl lg:border border-white/10"
              />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none lg:hidden"></div>
      </div>

      {/* HUD Interface */}
      {!capturedImage && !error && (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center">
             <div className="w-[70%] aspect-[3/4] lg:w-[400px] border border-white/20 rounded-[2rem] relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                 <div className="absolute inset-0 border-[2px] border-white/10 rounded-[2rem]"></div>
                 <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/60 rounded-tl-xl"></div>
                 <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white/60 rounded-tr-xl"></div>
                 <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white/60 rounded-bl-xl"></div>
                 <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/60 rounded-br-xl"></div>
                 
                 <div className="absolute top-0 left-0 right-0 h-[2px] bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,1)] animate-[scan_3s_ease-in-out_infinite]"></div>
             </div>
             
             <p className="mt-8 text-white/60 text-xs tracking-[0.2em] font-mono animate-pulse uppercase">Система AI анализа готова</p>
        </div>
      )}

      {/* Error State */}
      {error && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black">
              <div className="text-center p-6">
                  <Camera size={48} className="mx-auto text-red-400 mb-4" />
                  <p className="text-white/60">{error}</p>
              </div>
          </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 h-48 z-20 flex flex-col items-center justify-end pb-28 lg:pb-10 pointer-events-auto">
          
          {isProcessing ? (
               <div className="flex flex-col items-center gap-4 animate-fade-in">
                   <div className="w-16 h-16 rounded-full border-2 border-white/20 flex items-center justify-center">
                       <RefreshCw className="animate-spin text-accent" size={24} />
                   </div>
                   <p className="text-white text-sm font-medium">Анализ изображения...</p>
               </div>
          ) : result ? (
               <GlassCard className="w-[90%] max-w-md p-5 animate-slide-up bg-[#1c1c1e]/90 backdrop-blur-xl border-white/10">
                   <div className="flex items-start gap-4">
                       <div className={`p-3 rounded-full ${result.type === 'task' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>
                           {result.type === 'task' ? <Check size={20} /> : <Zap size={20} />}
                       </div>
                       <div className="flex-1">
                           <h3 className="text-white font-medium text-lg">{result.title}</h3>
                           <p className="text-white/50 text-sm mt-1">
                               {result.type === 'task' 
                                  ? `${result.category || 'Общее'} • ${result.priority || 'Обычно'}`
                                  : `${result.time || 'Весь день'} • Событие`
                               }
                           </p>
                       </div>
                   </div>

                   {/* Warning for low confidence */}
                   {result.confidence && result.confidence < 80 && (
                       <div className="mt-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3">
                           <AlertTriangle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                           <div>
                               <p className="text-yellow-200 text-xs font-medium">Низкая точность ({result.confidence}%)</p>
                               <p className="text-yellow-500/60 text-[10px] leading-tight mt-0.5">
                                   Проверьте данные перед сохранением. Текст мог быть распознан с ошибками.
                               </p>
                           </div>
                       </div>
                   )}

                   <div className="flex gap-3 mt-5">
                       <button onClick={handleRetake} className="flex-1 py-3 bg-white/5 rounded-xl text-white/70 text-sm">Отмена</button>
                       <button onClick={handleSave} className="flex-1 py-3 bg-white text-black rounded-xl font-medium text-sm">Сохранить</button>
                   </div>
               </GlassCard>
          ) : (
              <button 
                  onClick={handleCapture}
                  className="w-20 h-20 rounded-full border-[4px] border-white/20 flex items-center justify-center bg-white/5 active:bg-white/20 active:scale-95 transition-all relative group"
              >
                  <div className="w-16 h-16 rounded-full bg-white transition-all group-active:scale-90 shadow-[0_0_20px_rgba(255,255,255,0.2)]"></div>
              </button>
          )}
      </div>
      <style>{`
        @keyframes scan {
            0% { top: 0; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};