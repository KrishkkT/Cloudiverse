import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FeedbackForm from './FeedbackForm';

const FeedbackWidget = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-[9999]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="absolute bottom-20 right-0 w-[min(calc(100vw-3rem),400px)] glass-premium border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
                    >
                        <FeedbackForm onCancel={() => setIsOpen(false)} />
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 ${
                    isOpen 
                    ? 'bg-slate-900 border border-white/10 text-white' 
                    : 'bg-brand-500 text-white shadow-brand-500/20'
                }`}
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
                
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse" />
                )}
            </motion.button>
        </div>
    );
};

export default FeedbackWidget;
