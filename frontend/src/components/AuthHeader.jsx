import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const AuthHeader = () => {
    return (
        <header className="fixed top-0 left-0 w-full h-20 px-6 sm:px-12 z-50 flex items-center justify-between pointer-events-none">
            {/* Logo linked to Home */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="pointer-events-auto"
            >
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="flex items-center">
                        <a href={'/'}><img
                            src="/cloudiverse.png"
                            alt="Cloudiverse Architect"
                            className="h-9 w-auto"
                        /></a>
                    </div>
                </Link>
            </motion.div>

            {/* Back link */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="pointer-events-auto"
            >
                <Link to="/" className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
                    <ChevronLeft size={16} />
                    <span>Back to home</span>
                </Link>
            </motion.div>
        </header>
    );
};

export default AuthHeader;
