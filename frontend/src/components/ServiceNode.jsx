import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { getServiceMetadata } from '../data/serviceMetadata';

const ServiceNode = ({ data, id }) => {
    const [showPopup, setShowPopup] = useState(false);

    // Extract service ID from data or default to label content
    // Assuming data.serviceId is passed, or we infer from label/icon
    const serviceId = data.serviceId || data.label?.props?.children?.[1]?.props?.children?.toLowerCase().replace(/\s+/g, '');
    const provider = data.provider || 'aws';

    const metadata = getServiceMetadata(serviceId, provider);

    return (
        <div
            className="relative"
            onMouseEnter={() => setShowPopup(true)}
            onMouseLeave={() => setShowPopup(false)}
        >
            <Handle type="target" position={Position.Left} className="!bg-gray-400 !w-2 !h-2" />

            {/* Node Content */}
            <div className="relative z-10">
                {data.label}
            </div>

            <Handle type="source" position={Position.Right} className="!bg-gray-400 !w-2 !h-2" />

            {/* Animated Information Popup */}
            <AnimatePresence>
                {showPopup && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-4 w-72 bg-slate-950/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-5 z-50 pointer-events-none ring-1 ring-white/5"
                    >
                        <div className="flex items-center space-x-3 mb-3 pb-3 border-b border-white/5">
                            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400 border border-brand-500/20">
                                <span className="text-lg">ℹ️</span>
                            </div>
                            <div>
                                <h4 className="font-black text-white text-xs uppercase tracking-wider">{metadata.name || serviceId}</h4>
                                <div className="text-[9px] text-brand-400 font-bold uppercase tracking-widest mt-0.5">Component Details</div>
                            </div>
                        </div>

                        <p className="text-xs text-slate-300 mb-4 leading-relaxed font-medium">
                            {metadata.desc}
                        </p>

                        <div className="bg-white/5 rounded-xl p-3 mb-3 border border-white/5">
                            <p className="text-[9px] text-slate-500 uppercase font-black mb-1.5 tracking-widest flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-brand-500"></div>
                                Logical Function
                            </p>
                            <p className="text-xs text-slate-200 leading-relaxed italic">"{metadata.howItWorks}"</p>
                        </div>

                        {metadata.link && (
                            <div className="flex justify-end">
                                <span className="text-[10px] text-brand-400 font-black uppercase tracking-widest flex items-center gap-1">
                                    Developer Docs <span className="text-lg">›</span>
                                </span>
                            </div>
                        )}

                        {/* Arrow */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 top-full w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white/10"></div>
                        <div className="absolute left-1/2 transform -translate-x-1/2 top-[calc(100%-1px)] w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-slate-950"></div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default memo(ServiceNode);
