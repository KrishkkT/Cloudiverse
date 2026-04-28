import React from 'react';
import { motion } from 'framer-motion';

const SecondaryBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-950">
      {/* The Structural Grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {/* Cyan / Teal Element */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.4, 0.3],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-cyan-500/10 blur-[150px] mix-blend-screen"
      />

      {/* Violet / Purple Element */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        className="absolute top-[10%] right-[5%] w-[50%] h-[60%] rounded-full bg-violet-500/15 blur-[160px] mix-blend-screen"
      />

      {/* Rose / Pink Element */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5
        }}
        className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-rose-500/10 blur-[140px] mix-blend-screen"
      />
    </div>
  );
};

export default SecondaryBackground;
