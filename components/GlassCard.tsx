
import React, { memo } from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'light' | 'heavy' | 'flat' | 'active';
  onClick?: (e: React.MouseEvent) => void;
}

const GlassCardComponent: React.FC<GlassCardProps> = ({ children, className = '', variant = 'light', onClick }) => {
  const baseStyles = "relative overflow-hidden transition-all duration-300 ease-out gpu-layer";
  
  const variants = {
    // Cleaner, colder glass look using consolidated CSS class
    light: "glass-panel-light active:bg-white/[0.08]",
    heavy: "bg-[#000000]/60 backdrop-blur-[40px] saturate-150 border border-white/[0.05]",
    flat: "bg-white/[0.03] border border-white/[0.03]",
    active: "bg-white/[0.12] backdrop-blur-[30px] border border-white/[0.15] shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
  };

  const interactiveStyles = onClick ? "cursor-pointer active:scale-[0.98]" : "";

  return (
    <div 
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${interactiveStyles} ${className} rounded-[1.6rem]`}
    >
      {/* Subtle top highlight for depth */}
      <div className="absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-60" />
      {children}
    </div>
  );
};

export const GlassCard = memo(GlassCardComponent);
