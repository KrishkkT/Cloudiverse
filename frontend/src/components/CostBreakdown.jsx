import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Gift, 
  ExternalLink, 
  Database, 
  Cpu, 
  Globe, 
  Shield, 
  Zap, 
  MessageSquare, 
  BarChart3, 
  HardDrive,
  Info 
} from 'lucide-react';

const STATUS_LABELS = {
    PRICED: 'Hardware Provisioning',
    FREE_TIER: 'Provider Subsidies',
    EXTERNAL: 'Variable Usage'
};

const STATUS_ICONS = {
    PRICED: CreditCard,
    FREE_TIER: Gift,
    EXTERNAL: ExternalLink
};

const STATUS_COLORS = {
    PRICED: 'text-brand-400',
    FREE_TIER: 'text-accent-cyan',
    EXTERNAL: 'text-accent-purple'
};

const CostBreakdown = ({ services, currency = 'USD' }) => {

    const getMonthly = (s) => {
        if (typeof s.cost?.monthly === 'number') return s.cost.monthly;
        if (typeof s.monthly_cost === 'number') return s.monthly_cost;
        if (typeof s.cost === 'number') return s.cost;
        return 0;
    };

    const groupedServices = useMemo(() => {
        const groups = {
            PRICED: [],
            FREE_TIER: [],
            EXTERNAL: []
        };

        (services || []).forEach(service => {
            let status = service.pricing_status;
            if (!status) {
                if (getMonthly(service) > 0) status = 'PRICED';
                else if (service.cost?.formatted?.toLowerCase().includes('included')) status = 'FREE_TIER';
                else status = 'PRICED';
            }
            if (!groups[status]) groups.PRICED.push(service);
            else groups[status].push(service);
        });

        return groups;
    }, [services]);

    const totals = useMemo(() => {
        return {
            PRICED: groupedServices.PRICED.reduce((sum, s) => sum + getMonthly(s), 0),
            FREE_TIER: 0,
            EXTERNAL: 0
        };
    }, [groupedServices]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* 1. Infrastructure Cost Drivers (Priced) */}
            {groupedServices.PRICED.length > 0 && (
                <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="glass-panel p-6 rounded-3xl border-white/5 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 blur-3xl pointer-events-none" />
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center ${STATUS_COLORS.PRICED}`}>
                               <CreditCard size={20} />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Cost Core</h3>
                                <p className="text-sm font-bold text-white uppercase tracking-tight">{STATUS_LABELS.PRICED}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-baseline gap-1">
                                <span className="text-xs font-medium text-slate-500">$</span>
                                <span className="text-2xl font-display font-black text-white">{totals.PRICED.toFixed(2)}</span>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">/ mo</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {groupedServices.PRICED.map((service, idx) => {
                            const Icon = getIconForCategory(service.category);
                            const percent = (getMonthly(service) / totals.PRICED) * 100;
                            return (
                                <div key={idx} className="group flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-brand-500/10 group-hover:text-brand-400 transition-all shadow-lg border border-white/5">
                                                <Icon size={18} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white leading-tight mb-1 group-hover:text-brand-400 transition-colors">
                                                   {service.cloud_service || service.display_name || service.name}
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                                                   {service.category || 'Infrastructure'}
                                                   {getMonthly(service) === 0 && (
                                                       <span className="flex items-center gap-1 text-accent-cyan tracking-normal">
                                                           <Info size={10} /> {service.reason || 'Est. Free Tier'}
                                                       </span>
                                                   )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-white italic">
                                                {service.cost?.formatted || `$${getMonthly(service).toFixed(2)}`}
                                            </div>
                                            {getMonthly(service) > 0 && (
                                                <div className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">
                                                    {percent.toFixed(0)}% Allocation
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {getMonthly(service) > 0 && (
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-1">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percent}%` }}
                                                className="h-full bg-gradient-to-r from-brand-500 to-brand-600"
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* 2. Free / Included Services */}
            {groupedServices.FREE_TIER.length > 0 && (
                <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.1 }}
                   className="glass-panel p-6 rounded-3xl border-white/5 relative overflow-hidden bg-accent-cyan/5"
                >
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-accent-cyan/10 flex items-center justify-center ${STATUS_COLORS.FREE_TIER}`}>
                               <Gift size={20} />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Optimization</h3>
                                <p className="text-sm font-bold text-white uppercase tracking-tight">{STATUS_LABELS.FREE_TIER}</p>
                            </div>
                        </div>
                        <div className="px-3 py-1 bg-accent-cyan/10 border border-accent-cyan/20 rounded-md text-[10px] font-black text-accent-cyan uppercase tracking-widest">
                           Subsidized 100%
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {groupedServices.FREE_TIER.map((service, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="w-6 h-6 rounded-full bg-accent-cyan/20 flex items-center justify-center text-accent-cyan">
                                    <CheckCircle2 size={12} />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-white">{service.display_name}</div>
                                    <div className="text-[10px] text-slate-500 font-medium italic">{service.reason || 'Standard Feature'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* 3. External / Usage-Based Services */}
            {groupedServices.EXTERNAL.length > 0 && (
                <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.2 }}
                   className="glass-panel p-6 rounded-3xl border-white/5 relative overflow-hidden bg-accent-purple/5"
                >
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-accent-purple/10 flex items-center justify-center ${STATUS_COLORS.EXTERNAL}`}>
                               <ExternalLink size={20} />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Consumption</h3>
                                <p className="text-sm font-bold text-white uppercase tracking-tight">{STATUS_LABELS.EXTERNAL}</p>
                            </div>
                        </div>
                        <div className="px-3 py-1 bg-accent-purple/10 border border-accent-purple/20 rounded-md text-[10px] font-black text-accent-purple uppercase tracking-widest">
                           Dynamic Tiers
                        </div>
                    </div>

                    <div className="space-y-4">
                        {groupedServices.EXTERNAL.map((service, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-accent-purple/30 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-accent-purple group-hover:scale-110 transition-transform">
                                        <Zap size={18} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white italic">{service.display_name}</div>
                                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{service.reason || 'Usage-dependent streams'}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-accent-purple uppercase tracking-[0.2em]">Variable Rate</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

function getIconForCategory(category) {
    const map = {
        'Compute': Cpu,
        'Database': Database,
        'Storage': HardDrive,
        'Networking': Globe,
        'Security': Shield,
        'AI/ML': Zap,
        'Messaging': MessageSquare,
        'Monitoring': BarChart3
    };
    return map[category] || Layout;
}

const Layout = (props) => <Database {...props} />; // Fallback

export default CostBreakdown;
