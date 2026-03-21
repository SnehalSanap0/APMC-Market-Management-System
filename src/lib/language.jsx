import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || 'mr'); // 'mr' or 'en'

    useEffect(() => {
        localStorage.setItem('app_lang', lang);
    }, [lang]);

    // t(marathi, english)
    const t = (mr, en) => {
        if (!en) return mr;
        return lang === 'mr' ? mr : en;
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
