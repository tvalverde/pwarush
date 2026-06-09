import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import ca from './locales/ca.json';
import en from './locales/en.json';
import es from './locales/es.json';

type Language = 'es' | 'en' | 'ca';

const translations: Record<Language, any> = {
	es,
	en,
	ca,
};

interface I18nContextType {
	language: Language;
	setLanguage: (lang: Language) => void;
	t: (key: string, interpolations?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
	const [language, setLanguageState] = useState<Language>(() => {
		if (
			typeof window !== 'undefined' &&
			window.localStorage &&
			typeof window.localStorage.getItem === 'function'
		) {
			try {
				const saved = window.localStorage.getItem('elfarsante_lang');
				if (saved === 'es' || saved === 'en' || saved === 'ca') {
					return saved;
				}
			} catch (e) {
				console.error('Error accessing localStorage:', e);
			}
		}
		// Opcional: detectar idioma del navegador
		if (typeof navigator !== 'undefined') {
			const browserLang = navigator.language.split('-')[0];
			if (browserLang === 'ca') return 'ca';
			if (browserLang === 'en') return 'en';
		}
		return 'es';
	});

	useEffect(() => {
		localStorage.setItem('elfarsante_lang', language);
		document.documentElement.lang = language;
	}, [language]);

	const setLanguage = (lang: Language) => {
		setLanguageState(lang);
	};

	const t = (key: string, interpolations?: Record<string, string>): string => {
		const keys = key.split('.');
		let current: any = translations[language];

		for (const k of keys) {
			if (current[k] === undefined) {
				// Fallback to Spanish if missing
				let fallback: any = translations.es;
				for (const fk of keys) {
					if (fallback[fk] === undefined) return key;
					fallback = fallback[fk];
				}
				current = fallback;
				break;
			}
			current = current[k];
		}

		if (typeof current !== 'string') return key;

		if (interpolations) {
			return Object.entries(interpolations).reduce((str, [key, value]) => {
				return str.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value);
			}, current);
		}

		return current;
	};

	return (
		<I18nContext.Provider value={{ language, setLanguage, t }}>{children}</I18nContext.Provider>
	);
}

export function useTranslation() {
	const context = useContext(I18nContext);
	if (context === undefined) {
		throw new Error('useTranslation must be used within an I18nProvider');
	}
	return context;
}
