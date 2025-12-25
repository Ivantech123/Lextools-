
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Download, X } from 'lucide-react';
import { ViewState, User, UserSettings } from './types';
import { Navigation } from './components/Navigation';
import { DesktopSidebar } from './components/DesktopSidebar';
import { TaskView } from './components/TaskView';
import { CalendarView } from './components/CalendarView';
import { AssistantView } from './components/AssistantView';
import { ScannerView } from './components/ScannerView';
import { OnboardingGuide } from './components/OnboardingGuide';
import { ParticleLoader } from './components/ParticleLoader';
import { AuthScreen } from './components/AuthScreen';
import { SettingsModal } from './components/SettingsModal';
import { AudioService } from './services/audioService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.TASKS);
  const [isMounted, setIsMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Auth & Settings
  const [user, setUser] = useState<User | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  
  // PWA State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  // Gesture state
  const touchStartRef = useRef<{x: number, y: number} | null>(null);
  const viewOrder = [ViewState.TASKS, ViewState.CALENDAR, ViewState.SCANNER, ViewState.ASSISTANT];

  useEffect(() => {
    const checkIsDesktop = window.matchMedia("(min-width: 1024px)").matches;
    setIsDesktop(checkIsDesktop);
    if (checkIsDesktop) document.body.classList.add('is-desktop');
    
    // Listen for resize
    const handleResize = () => {
       const isDesk = window.matchMedia("(min-width: 1024px)").matches;
       setIsDesktop(isDesk);
       if (isDesk) document.body.classList.add('is-desktop');
       else document.body.classList.remove('is-desktop');
    };
    window.addEventListener('resize', handleResize);
    
    setTimeout(() => setIsMounted(true), 100);

    // AUTH BYPASS LOGIC
    const savedUser = localStorage.getItem('lawyer_user');
    
    let activeUser: User;

    if (savedUser) {
        // Normal saved user
        activeUser = JSON.parse(savedUser);
    } else {
        // Auto-login default user (Auth disabled)
        activeUser = {
            name: 'User',
            specialization: 'System',
            isPro: true,
            settings: { soundEnabled: true, hapticsEnabled: true, accentColor: '99, 102, 241' }
        };
        // We don't save to localStorage immediately to allow "fresh" feel, or we can.
        // Let's just set it in state so the app works.
    }
    
    setUser(activeUser);
    applySettings(activeUser.settings);

    // Check for onboarding
    const hasSeenGuide = localStorage.getItem('glassai_guide_seen');
    if (!hasSeenGuide && !window.location.hostname.includes('localhost')) {
        setTimeout(() => setShowGuide(true), 2500);
    }

    // PWA Install Prompt Listener
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('resize', handleResize);
    };
  }, []);

  const applySettings = (settings?: UserSettings) => {
      if (!settings) return;
      
      // Apply Sound
      AudioService.setMuted(!settings.soundEnabled);
      
      // Apply Theme
      if (settings.accentColor) {
          document.documentElement.style.setProperty('--accent-color', settings.accentColor);
      }
  };

  const handleUpdateSettings = (newSettings: UserSettings) => {
      if (!user) return;
      const updatedUser = { ...user, settings: newSettings };
      setUser(updatedUser);
      localStorage.setItem('lawyer_user', JSON.stringify(updatedUser));
      applySettings(newSettings);
  };

  const handleLogin = (newUser: User) => {
      setUser(newUser);
      applySettings(newUser.settings);
      const hasSeenGuide = localStorage.getItem('glassai_guide_seen');
      if (!hasSeenGuide) {
          setShowGuide(true);
      }
  };

  const handleLogout = () => {
      localStorage.removeItem('lawyer_user');
      // For now, logout just resets to default user since auth is disabled
      window.location.reload(); 
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  const handleCloseGuide = () => {
      setShowGuide(false);
      localStorage.setItem('glassai_guide_seen', 'true');
  };

  // Touch Swipe Logic (Mobile Only)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isDesktop) return;
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isDesktop || !touchStartRef.current) return;
    const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    const dx = touchEnd.x - touchStartRef.current.x;
    const dy = touchEnd.y - touchStartRef.current.y;

    if (Math.abs(dy) > Math.abs(dx)) return; // Vertical scroll

    if (Math.abs(dx) > 60) {
        const currentIndex = viewOrder.indexOf(currentView);
        if (dx < 0 && currentIndex < viewOrder.length - 1) {
            setCurrentView(viewOrder[currentIndex + 1]);
        } else if (dx > 0 && currentIndex > 0) {
            setCurrentView(viewOrder[currentIndex - 1]);
        }
    }
    touchStartRef.current = null;
  };

  return (
    <>
      {isLoading && <ParticleLoader onComplete={() => setIsLoading(false)} />}
      
      {/* Auth Screen Removed */}
      {/* {!user && !isLoading && <AuthScreen onLogin={handleLogin} />} */}

      {user && showSettings && (
          <SettingsModal 
            user={user} 
            onClose={() => setShowSettings(false)} 
            onLogout={handleLogout}
            onUpdateSettings={handleUpdateSettings}
          />
      )}

      {user && showGuide && <OnboardingGuide onClose={handleCloseGuide} />}

      <div 
        className={`app-container transition-all duration-1000 ease-in-out relative transform ${!user ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Install Button (PWA) */}
        {showInstallBtn && !showGuide && !isDesktop && (
            <div className="absolute top-14 right-4 z-50 animate-scale-in">
                <button 
                    onClick={handleInstallClick}
                    className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-white text-xs font-medium shadow-lg active:scale-95 transition-transform"
                >
                    <Download size={12} />
                    <span>Установить</span>
                    <div 
                        className="ml-1 p-0.5 bg-white/10 rounded-full"
                        onClick={(e) => { e.stopPropagation(); setShowInstallBtn(false); }}
                    >
                         <X size={10} />
                    </div>
                </button>
            </div>
        )}

        {/* Optimized Background Orbs - Now using accent colors */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div 
                className={`absolute top-[-20%] left-[-20%] w-[100vw] h-[100vw] rounded-full blur-[90px] opacity-15 transition-transform duration-1000 will-change-transform bg-accent
                ${currentView === ViewState.ASSISTANT ? 'translate-y-10' : 'translate-y-0'}`} 
            />
            <div 
                className={`absolute bottom-[-10%] right-[-10%] w-[100vw] h-[100vw] rounded-full blur-[90px] opacity-10 transition-transform duration-1000 will-change-transform bg-accent
                ${currentView === ViewState.ASSISTANT ? '-translate-y-10' : 'translate-y-0'}`} 
            />
        </div>

        {/* DESKTOP SIDEBAR */}
        {isDesktop && user && (
            <DesktopSidebar 
                currentView={currentView} 
                onViewChange={setCurrentView} 
                onOpenSettings={() => setShowSettings(true)}
            />
        )}

        {/* Content Container */}
        <div className={`relative z-10 h-full flex-1 flex flex-col transition-opacity duration-500 ${isDesktop ? '' : 'pt-safe'} ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
          <main className="flex-1 relative w-full h-full">
              <ViewContainer isActive={currentView === ViewState.TASKS}>
                <TaskView onOpenSettings={() => setShowSettings(true)} />
              </ViewContainer>
              
              <ViewContainer isActive={currentView === ViewState.CALENDAR}>
                <CalendarView />
              </ViewContainer>

              <ViewContainer isActive={currentView === ViewState.SCANNER}>
                <ScannerView />
              </ViewContainer>
              
              <ViewContainer isActive={currentView === ViewState.ASSISTANT}>
                <AssistantView />
              </ViewContainer>
          </main>

          {isMounted && !isDesktop && (
              <Navigation 
                currentView={currentView} 
                onViewChange={setCurrentView} 
                isHidden={showGuide || showSettings} 
              />
          )}
        </div>
      </div>
    </>
  );
};

const ViewContainer: React.FC<{ isActive: boolean; children: React.ReactNode }> = ({ isActive, children }) => {
  const [shouldRender, setShouldRender] = useState(isActive);

  useEffect(() => {
    if (isActive) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 400); // Shorter unmount delay
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`absolute inset-0 w-full h-full transition-all duration-500 ease-ios-spring-smooth will-change-transform gpu-layer ${
        isActive 
          ? 'opacity-100 scale-100 translate-x-0 pointer-events-auto' 
          : 'opacity-0 scale-[0.96] pointer-events-none'
      }`}
    >
      {children}
    </div>
  );
};

export default App;
