import React from 'react';
import SecondaryBackground from '../components/SecondaryBackground';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MessageSquare, MapPin, Send, Phone, Clock, Sparkles, Linkedin } from 'lucide-react';
import { motion } from 'framer-motion';

const Contact = () => {
    const navigate = useNavigate();

    const fadeInUp = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    };

    return (
        <div className="relative min-h-screen text-slate-200 selection:bg-brand-500/30 selection:text-white bg-slate-950 font-sans">
            <SecondaryBackground />

            {/* Nav Header */}
            <header className="sticky top-0 z-50 bg-slate-950/50 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-2">
                        <img src="/cloudiverse.png" alt="Cloudiverse" className="h-8 w-auto" />
                    </a>
                    <button
                        onClick={() => navigate('/')}
                        className="group flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-all"
                    >
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-all">
                            <ArrowLeft size={16} />
                        </div>
                        <span>Back to Home</span>
                    </button>

                </div>
            </header>

            <main className="relative pt-20 pb-32">
                <div className="container mx-auto px-6">
                    <motion.div {...fadeInUp} className="text-center mb-20">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6">
                            <MessageSquare size={12} />
                            <span>Connect with Excellence</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-6">
                            How can we <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">help you?</span>
                        </h1>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            Have questions about our platform or need enterprise support? Our team is
                            standing by to help you accelerate your cloud journey.
                        </p>
                    </motion.div>

                    <div className="grid lg:grid-cols-12 gap-12 max-w-6xl mx-auto">
                        {/* Contact Info */}
                        <div className="lg:col-span-5 space-y-8">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="glass-premium p-8 rounded-[2rem] border border-white/5"
                            >
                                <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                                    <Sparkles size={20} className="text-blue-400" />
                                    Contact Information
                                </h3>

                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                                            <Mail size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Email Us</p>
                                            <p className="text-slate-200 font-bold">support@cloudiverse.app</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Location</p>
                                            <p className="text-slate-200 font-bold">Remotely Operating</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 pt-10 border-t border-white/5">
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <Clock size={16} className="text-blue-400" />
                                        <span className="text-sm font-medium">Response time: Usually within 4 hours</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Contact Form */}
                        <div className="lg:col-span-7">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="glass-premium p-10 rounded-[2rem] border border-white/5"
                            >
                                <form className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Full Name</label>
                                            <input type="text" placeholder="John Doe" className="input-premium" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
                                            <input type="email" placeholder="john@company.com" className="input-premium" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Subject</label>
                                        <select className="input-premium appearance-none cursor-pointer">
                                            <option>General Inquiry</option>
                                            <option>Enterprise Support</option>
                                            <option>Partnership Request</option>
                                            <option>Billing Question</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Message</label>
                                        <textarea rows={5} placeholder="How can we assist you today?" className="input-premium resize-none"></textarea>
                                    </div>

                                    <button className="btn-premium w-full mt-4 group">
                                        <span>Send Message</span>
                                        <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Premium Footer */}
            <footer className="py-12 border-t border-white/5 relative z-10 mt-auto">
                <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">&copy; {new Date().getFullYear()} Cloudiverse Architect</span>
                    </div>
                    <div className="flex items-center gap-8">
                        <a href="/about" className="text-xs font-bold text-slate-500 hover:text-brand-400 transition-colors uppercase tracking-widest">About</a>
                        <a href="/terms" className="text-xs font-bold text-slate-500 hover:text-brand-400 transition-colors uppercase tracking-widest">Terms</a>
                        <a href="/privacy" className="text-xs font-bold text-slate-500 hover:text-brand-400 transition-colors uppercase tracking-widest">Privacy</a>
                        <a 
                            href="https://linkedin.com/company/cloudiverse" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-slate-500 hover:text-brand-400 transition-colors"
                            aria-label="LinkedIn"
                        >
                            <Linkedin size={16} />
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Contact;
