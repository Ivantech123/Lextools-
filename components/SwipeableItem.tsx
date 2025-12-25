
import React, { useRef, useState } from 'react';
import { Trash2, CheckCircle, Archive } from 'lucide-react';

interface SwipeableItemProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  className?: string;
}

export const SwipeableItem: React.FC<SwipeableItemProps> = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  threshold = 80,
  className = "" 
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swiped, setSwiped] = useState<'left' | 'right' | null>(null);
  
  const startX = useRef(0);
  const currentX = useRef(0);
  const itemRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (swiped) return; // Prevent interaction if already actioned
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || swiped) return;
    
    const x = e.touches[0].clientX;
    const diff = x - startX.current;
    
    // Lock vertical scroll if swiping horizontally logic can be added here
    // For now, we rely on touch-action: pan-y in CSS
    
    // Add resistance
    currentX.current = diff; // Linear for now, or add resistance logic: diff * 0.7
    setOffsetX(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging || swiped) return;
    setIsDragging(false);

    if (onSwipeLeft && offsetX < -threshold) {
      // Trigger Left Action (Delete)
      setOffsetX(-500); // Fly off screen
      setSwiped('left');
      setTimeout(() => onSwipeLeft(), 300);
    } else if (onSwipeRight && offsetX > threshold) {
      // Trigger Right Action (Complete)
      setOffsetX(500); // Fly off screen
      setSwiped('right');
      setTimeout(() => onSwipeRight(), 300);
    } else {
      // Reset
      setOffsetX(0);
    }
  };

  // Background Opacity Calculations
  const leftOpacity = Math.min(Math.abs(Math.min(offsetX, 0)) / (threshold * 1.5), 1);
  const rightOpacity = Math.min(Math.max(offsetX, 0) / (threshold * 1.5), 1);

  return (
    <div className={`relative overflow-hidden rounded-[1.6rem] mb-3 ${className}`}>
      {/* Background Actions Layer */}
      <div className="absolute inset-0 flex justify-between items-center pointer-events-none">
        
        {/* Right Swipe Background (Complete) */}
        <div 
            className="absolute left-0 top-0 bottom-0 flex items-center pl-6 w-full bg-emerald-500/20 backdrop-blur-md transition-opacity"
            style={{ opacity: rightOpacity }}
        >
            <CheckCircle className="text-emerald-400" size={24} />
        </div>

        {/* Left Swipe Background (Delete) */}
        <div 
            className="absolute right-0 top-0 bottom-0 flex items-center justify-end pr-6 w-full bg-red-500/20 backdrop-blur-md transition-opacity"
            style={{ opacity: leftOpacity }}
        >
            <Trash2 className="text-red-400" size={24} />
        </div>
      </div>

      {/* Foreground Content */}
      <div
        ref={itemRef}
        className="transform touch-pan-y"
        style={{ 
          transform: `translate3d(${offsetX}px, 0, 0)`,
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};
