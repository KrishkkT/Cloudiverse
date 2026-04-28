/**
 * ROBUST INTENT VALIDATOR
 * 
 * Enforces strict quality and safety rules for user input.
 * Rules:
 * 1. Min 10 meaningful words (excluding stopwords/symbols)
 * 2. No profanity/abuse (basic list + pattern matching)
 * 3. No low-signal spam (repetitive words, placeholders)
 * 4. Max character limit (2000 chars)
 */

// Simple Stopwords List (English)
const STOPWORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'about', 'as', 'if', 'so', 'this', 'that'
]);

// Basic Profanity Blocklist (extensible)
// Focusing on common offensive categories: hate, violence, explicit
// We use simple string matching to avoid heavy deps, but cover obfuscation basics
const PROFANITY_PATTERNS = [
    // English core
    /fuck/i, /f\*?u\*?c\*?k/i, /fucker/i, /motherfucker/i, /mf/i,
    /shit/i, /sh[i1]t/i, /bullshit/i,
    /bitch/i, /b[i1]tch/i,
    /asshole/i, /asshole/i, /\bass\b/i,
    /\bdick\b/i, /cock/i, /penis/i,
    /pussy/i, /cunt/i,
    /whore/i, /slut/i,
    /bastard/i,
    /retard/i,
    /kys/i, /kill\s*yourself/i,
    /rape/i, /rapist/i,
    /suicide/i,

    // Common internet abuse
    /idiot/i, /moron/i, /stupid/i, /dumb/i,
    /loser/i, /jerk/i, /trash/i, /garbage/i,

    // Hindi / Indian slang (latin)
    /bhosd[i1]k?e?/i, /bhosdi/i, /bhosdina/i,
    /madarchod/i,
    /bhenchod/i, /behenchod/i,
    /chutiya/i, /chutya/i, /chutiye/i,
    /gandu/i, /gaandu/i,
    /lund/i, /loda/i, /lavda/i, /lavde/i, /lodu/i,
    /harami/i,
    /kamina/i, /kameena/i,
    /saala/i, /sala/i,
    /kutte/i, /kutti/i, /kutta/i,
    /chod/i, /chodu/i,
    /maa\s*ka\s*bhosda/i,
    /maa\s*ka\s*bhosdike/i,
    /maa\s*ki\s*chut/i,
    /behen\s*ki\s*chut/i,
    /teri\s*maa/i,
    /teri\s*behen/i,

    // Gujarati slang (latin variants)
    /madarchod/i,
    /bhenchod/i,
    /chutiyo/i, /chutiyu/i,
    /gandu/i, /gaandu/i,
    /lavdo/i, /lavda/i,
    /lodu/i,
    /harami/i,
    /kamino/i,
    /saalo/i, /salo/i,
    /kutto/i, /kutti/i,
    /bhosdi/i,

    // Mixed Hinglish / Gujarati insults
    /teri\s*maa\s*ka/i,
    /behen\s*chod/i,
    /maa\s*chod/i,
    /behen\s*chod/i,
    /baap\s*ko/i
];

// Placeholder patterns
const PLACEHOLDER_PATTERNS = [
    /^test$/i, /^hello$/i, /^hi$/i, /^project$/i, /^asdf/i, /^qwerty/i, /^123/i
];

/**
 * Clean text: remove special chars, extra spaces, lower case
 */
const cleanText = (text) => {
    return text.toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation/symbols
        .replace(/\s+/g, ' ')    // Collapse spaces
        .trim();
};

/**
 * Validate functionality
 * @param {string} text - User input
 * @returns {object} { isValid: boolean, error: string | null }
 */
export const validateProjectDescription = (text) => {
    if (!text || typeof text !== 'string') {
        return { isValid: false, error: 'Input is empty.' };
    }

    const rawText = text.trim();

    // 1. Length Checks
    if (rawText.length > 2000) {
        return { isValid: false, error: 'Description is too long (max 2000 characters).' };
    }

    if (rawText.length < 10) {
        return { isValid: false, error: 'Please describe your project in more detail.' };
    }

    // 2. Profanity Check
    for (const pattern of PROFANITY_PATTERNS) {
        if (pattern.test(rawText)) {
            return { isValid: false, error: 'Input contains inappropriate language.' };
        }
    }

    // 3. Meaningful Word Count
    const cleaned = cleanText(rawText);
    const words = cleaned.split(' ');

    // Filter stopwords and numbers
    const meaningfulWords = words.filter(w => !STOPWORDS.has(w) && isNaN(w) && w.length > 1);

    if (meaningfulWords.length < 10) {
        return { isValid: false, error: 'Description is too vague. Please allow at least 10 meaningful words describing functionality.' };
    }

    // 4. Anti-Spam (Repetition Check)
    // If unique words are < 50% of total words (for text > 5 words) -> potentially spam
    const uniqueWords = new Set(meaningfulWords);
    if (meaningfulWords.length > 5 && uniqueWords.size < meaningfulWords.length * 0.5) {
        return { isValid: false, error: 'Input appears repetitive. Please provide a clear description.' };
    }

    // 5. Placeholder Check
    if (PLACEHOLDER_PATTERNS.some(p => p.test(cleaned))) {
        return { isValid: false, error: 'Please enter a real project description.' };
    }

    return { isValid: true, error: null };
};
