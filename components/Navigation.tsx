
import React, { useRef, useState, useEffect } from 'react';
import { ListTodo, CalendarDays, Sparkles, ScanLine } from 'lucide-react';
import { ViewState } from '../types';
import { AudioService } from '../services/audioService';

interface NavigationProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  isHidden?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange, isHidden = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [blobState, setBlobState] = useState({ x: 0, width: 0, scaleX: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const navItems = [
    { id: ViewState.TASKS, icon: ListTodo, label: 'Задачи' },
    { id: ViewState.CALENDAR, icon: CalendarDays, label: 'Календарь' },
    { id: ViewState.SCANNER, icon: ScanLine, label: 'Скан' },
    { id: ViewState.ASSISTANT, icon: Sparkles, label: 'AI' },
  ];

  const metricsRef = useRef({
    itemWidth: 0,
    snapPoints: [] as number[],
    containerWidth: 0
  });

  useEffect(() => {
    const updateMetrics = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalWidth = rect.width;
      const itemWidth = totalWidth / navItems.length; 
      
      metricsRef.current.containerWidth = totalWidth;
      metricsRef.current.itemWidth = itemWidth;
      metricsRef.current.snapPoints = navItems.map((_, i) => i * itemWidth);

      const activeIndex = navItems.findIndex(i => i.id === currentView);
      if (activeIndex !== -1 && !isDragging) {
        const targetX = activeIndex * itemWidth;
        setBlobState({ x: targetX, width: itemWidth, scaleX: 1 });
      }
    };

    updateMetrics();
    setTimeout(updateMetrics, 100); 
    window.addEventListener('resize', updateMetrics);
    return () => window.removeEventListener('resize', updateMetrics);
  }, [currentView, isDragging, navItems.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const touch = e.touches[0];
    const containerRect = containerRef.current.getBoundingClientRect();
    const touchX = touch.clientX - containerRect.left;
    setIsDragging(true);
    setDragOffset(touchX - blobState.x);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    const touch = e.touches[0];
    const containerRect = containerRef.current.getBoundingClientRect();
    const rawTouchX = touch.clientX - containerRect.left;
    
    let newX = rawTouchX - dragOffset;

    const maxLeft = 0;
    const maxRight = metricsRef.current.containerWidth - metricsRef.current.itemWidth;

    if (newX < maxLeft) {
        newX = maxLeft - (Math.pow(Math.abs(newX), 0.7)); 
    } else if (newX > maxRight) {
        const overflow = newX - maxRight;
        newX = maxRight + (Math.pow(overflow, 0.7));
    }

    const itemWidth = metricsRef.current.itemWidth;
    setBlobState({ x: newX, width: itemWidth, scaleX: 1.1 });
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    let closestIndex = 0;
    let minDiff = Infinity;

    metricsRef.current.snapPoints.forEach((p, i) => {
      const diff = Math.abs(blobState.x - p);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    });

    const targetX = metricsRef.current.snapPoints[closestIndex];
    setBlobState({ 
        x: targetX, 
        width: metricsRef.current.itemWidth, 
        scaleX: 1 
    });

    if (currentView !== navItems[closestIndex].id) {
       AudioService.play('swipe');
       onViewChange(navItems[closestIndex].id);
    }
  };

  const handleItemClick = (id: ViewState) => {
      if (!isDragging && currentView !== id) {
          AudioService.play('click');
          onViewChange(id);
      }
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[100] flex justify-center pb-safe pt-4 pointer-events-none transition-transform duration-500 ${isHidden ? 'translate-y-32' : 'translate-y-0'}`}>
      <div 
        ref={containerRef}
        className="pointer-events-auto mb-4 bg-[#151515]/80 backdrop-blur-[30px] border border-white/10 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] w-[92%] max-w-[360px] h-[76px] relative flex items-center select-none touch-none overflow-hidden gpu-layer"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="absolute top-1 bottom-1 rounded-[2rem] bg-white/10 border border-white/5"
          style={{ 
            transform: `translate3d(${blobState.x}px, 0, 0) scaleX(${blobState.scaleX})`,
            width: `${blobState.width}px`,
            transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1.1)', 
            transformOrigin: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-[2rem]" />
        </div>

        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <div
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className="flex-1 h-full flex flex-col items-center justify-center relative z-10 cursor-pointer tap-highlight-transparent"
            >
              <div className={`transition-transform duration-500 ease-ios-spring ${isActive && !isDragging ? 'scale-110 -translate-y-1' : 'scale-100'}`}>
                 <item.icon 
                    size={24} 
                    strokeWidth={isActive ? 2.5 : 2} 
                    className={`transition-colors duration-300 ${isActive ? 'text-white' : 'text-white/30'}`} 
                  />
              </div>
              <span 
                className={`absolute bottom-3 text-[9px] font-medium tracking-wide transition-all duration-300 ${isActive ? 'text-white opacity-100 translate-y-0' : 'text-white/0 opacity-0 translate-y-2'}`}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
