export const isIOS = (): boolean => {
	if (typeof navigator === 'undefined') return false;
	if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return true;
	// iPadOS 13+ reports as Mac with touch support
	return /Mac/.test(navigator.userAgent) && navigator.maxTouchPoints > 1;
};

export const isStandalone = (): boolean =>
	(typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ||
	(typeof navigator !== 'undefined' && (navigator as { standalone?: boolean }).standalone === true);
