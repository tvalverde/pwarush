/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />
/// <reference types="vite-plugin-pwa/info" />
/// <reference types="vite-plugin-pwa/client" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
	readonly VITE_E2E?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

interface BeforeInstallPromptEvent extends Event {
	readonly platforms: string[];
	readonly userChoice: Promise<{
		outcome: 'accepted' | 'dismissed';
		platform: string;
	}>;
	prompt(): Promise<void>;
}

interface WindowEventMap {
	beforeinstallprompt: BeforeInstallPromptEvent;
}

interface WakeLockSentinel extends EventTarget {
	readonly released: boolean;
	readonly type: 'screen';
	release(): Promise<void>;
	onrelease: ((this: WakeLockSentinel, ev: Event) => void) | null;
}

interface WakeLock {
	request(type: 'screen'): Promise<WakeLockSentinel>;
}

interface Navigator {
	readonly wakeLock: WakeLock;
}
