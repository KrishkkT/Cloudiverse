import React from 'react';
import { 
    ThumbsUp, Activity, AlertTriangle, Lightbulb, Send, CheckCircle, Sparkles 
} from 'lucide-react';
import { useForm, ValidationError } from '@formspree/react';
import { motion } from 'framer-motion';

const FeedbackForm = ({ onCancel }) => {
    const [state, handleSubmit] = useForm("mojabwnj");

    if (state.succeeded) {
        return (
            <div className="p-10 text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-400 mx-auto">
                    <CheckCircle size={40} />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">Feedback Received!</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                    Thank you for helping us shape the future of Cloudiverse.
                </p>
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="w-full btn-premium py-3 text-sm"
                    >
                        Close
                    </button>
                )}
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-black uppercase tracking-widest">
                    <Sparkles size={12} />
                    <span>Quick Feedback</span>
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Tell us anything.</h2>
            </div>

            {/* 1. Overall Experience */}
            <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-300">
                    Overall Experience
                </label>
                <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                        <label key={rating} className="group cursor-pointer">
                            <input
                                type="radio"
                                name="overall_rating"
                                value={rating}
                                className="peer sr-only"
                                required
                            />
                            <div className="h-10 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-sm font-black text-slate-500 transition-all peer-checked:bg-brand-500 peer-checked:text-white peer-checked:border-brand-500 peer-checked:shadow-lg peer-checked:shadow-brand-500/20 group-hover:border-white/10">
                                {rating}
                            </div>
                        </label>
                    ))}
                </div>
                <ValidationError prefix="Rating" field="overall_rating" errors={state.errors} className="text-red-400 text-[10px] font-bold" />
            </div>

            {/* 2. Suggestions */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Suggestions / Message
                </label>
                <textarea
                    name="suggestions"
                    rows={4}
                    placeholder="What features or fixes would make your experience better?"
                    className="input-premium resize-none text-sm"
                    required
                />
            </div>

            {/* 3. Contact Details */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Email (Optional)
                </label>
                <input
                    type="email"
                    name="email"
                    placeholder="architect@example.com"
                    className="input-premium py-2 text-sm"
                />
            </div>

            <div className="flex gap-3">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-xl border border-white/10 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={state.submitting}
                    className="flex-[2] btn-premium py-3 text-xs group"
                >
                    <span className="flex items-center justify-center gap-2">
                        {state.submitting ? 'Sending...' : 'Submit'}
                        <Send size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </span>
                </button>
            </div>
        </form>
    );
};

export default FeedbackForm;
