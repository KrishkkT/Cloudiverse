import React from 'react';
import { Layers } from 'lucide-react';
import { motion } from 'framer-motion';

const Logo = ({ size = 'md', className = '', animate = true }) => {
  const sizeMap = {
    sm: { box: 'w-8 h-8', icon: 14, radius: 'rounded-lg' },
    md: { box: 'w-10 h-10', icon: 18, radius: 'rounded-xl' },
    lg: { box: 'w-12 h-12', icon: 22, radius: 'rounded-2xl' },
    xl: { box: 'w-16 h-16', icon: 28, radius: 'rounded-[1.5rem]' },
  };

  const s = sizeMap[size] || sizeMap.md;

  return (
    <div className={`relative ${className}`}>
      {/* Animated Glow Backlight */}
      {animate && (
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute inset-0 bg-brand-500 blur-lg ${s.radius}`}
        />
      )}
      
      <div className={`relative z-10 ${s.box} ${s.radius} bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-xl shadow-brand-500/20 active:scale-95 transition-transform cursor-pointer`}>
        <Layers size={s.icon} className="text-white drop-shadow-md" strokeWidth={2.5} />
      </div>
    </div>
  );
};

export default Logo;