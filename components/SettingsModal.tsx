
import React, { useState } from 'react';
import { User, UserSettings } from '../types';
import { X, Volume2, VolumeX, Smartphone, Palette, LogOut, Check, Code, FileJson, Heart } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { AudioService } from '../services/audioService';

interface SettingsModalProps {
  user: User;
  onUpdateSettings: (settings: UserSettings) => void;
  onLogout: () => void;
  onClose: () => void;
}

const COLORS = [
  { name: 'Indigo', r: '99, 102, 241' },
  { name: 'Purple', r: '168, 85, 247' },
  { name: 'Emerald', r: '16, 185, 129' },
  { name: 'Orange', r: '249, 115, 22' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ user, onUpdateSettings, onLogout, onClose }) => {
  const [settings, setSettings] = useState<UserSettings>(user.settings || {
      soundEnabled: true,
      hapticsEnabled: true,
      accentColor: '99, 102, 241'
  });

  const update = (key: keyof UserSettings, value: any) => {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      onUpdateSettings(newSettings);
      AudioService.play('click');
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-xl flex items-end sm:items-center justify-center animate-fade-in">
        <div 
            className="absolute inset-0"
            onClick={onClose}
        />
        
        <div className="w-full max-w-[380px] bg-[#151515] border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 pb-safe animate-slide-up shadow-2xl relative z-10">
            
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-white">Настройки</h2>
                    <p className="text-white/40 text-sm">{user.name}</p>
                </div>
                <button 
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 active:bg-white/10"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="space-y-6">
                {/* Open Source Notice */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                         <Code size={40} className="text-white" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <Heart size={14} className="text-red-400 fill-red-400/20" />
                        <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Open Source</span>
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed font-medium">
                        LexTools — это полностью бесплатный проект с открытым исходным кодом. 
                        Это не коммерческий продукт. Вся документация, код и само приложение доступны свободно.
                    </p>
                </div>

                {/* Toggles */}
                <GlassCard className="p-4 bg-white/5 border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${settings.soundEnabled ? 'bg-accent text-white' : 'bg-white/10 text-white/40'}`}>
                                {settings.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                            </div>
                            <span className="text-white text-[15px]">Звуковые эффекты</span>
                        </div>
                        <button 
                            onClick={() => update('soundEnabled', !settings.soundEnabled)}
                            className={`w-12 h-7 rounded-full transition-colors relative ${settings.soundEnabled ? 'bg-accent' : 'bg-white/10'}`}
                        >
                            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${settings.soundEnabled ? 'left-6' : 'left-1'}`} />
                        </button>
                    </div>

                    <div className="w-full h-[1px] bg-white/5 mb-4" />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${settings.hapticsEnabled ? 'bg-accent text-white' : 'bg-white/10 text-white/40'}`}>
                                <Smartphone size={18} />
                            </div>
                            <span className="text-white text-[15px]">Тактильный отклик</span>
                        </div>
                        <button 
                            onClick={() => update('hapticsEnabled', !settings.hapticsEnabled)}
                            className={`w-12 h-7 rounded-full transition-colors relative ${settings.hapticsEnabled ? 'bg-accent' : 'bg-white/10'}`}
                        >
                            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${settings.hapticsEnabled ? 'left-6' : 'left-1'}`} />
                        </button>
                    </div>
                </GlassCard>

                {/* Accent Color */}
                <div>
                    <h3 className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3 ml-2">Тема оформления</h3>
                    <div className="grid grid-cols-4 gap-3">
                        {COLORS.map((c) => (
                            <button
                                key={c.name}
                                onClick={() => update('accentColor', c.r)}
                                className={`h-14 rounded-2xl border flex items-center justify-center transition-all relative overflow-hidden group
                                    ${settings.accentColor === c.r ? 'border-white/40' : 'border-white/5 bg-white/5'}`}
                            >
                                <div className="absolute inset-0 opacity-20" style={{ backgroundColor: `rgb(${c.r})` }} />
                                <div className="w-6 h-6 rounded-full shadow-lg" style={{ backgroundColor: `rgb(${c.r})` }} />
                                {settings.accentColor === c.r && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                        <Check size={16} className="text-white drop-shadow-md" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={onLogout}
                    className="w-full py-4 rounded-2xl border border-red-500/30 text-red-400 font-medium flex items-center justify-center gap-2 active:bg-red-500/10 transition-colors mt-2"
                >
                    <LogOut size={18} />
                    Выйти из аккаунта
                </button>
                
                <p className="text-center text-white/20 text-[10px] mt-2 font-mono">
                    LexTools v2.6.3 • Open Source License
                </p>
            </div>
        </div>
    </div>
  );
};
