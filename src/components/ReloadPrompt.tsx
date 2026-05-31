import { useRegisterSW } from 'virtual:pwa-register/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';

export const RELOAD_FALLBACK_MS = 5000;

function ReloadPrompt() {
	const { t } = useGameStore();
	const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

	const {
		offlineReady: [offlineReady, setOfflineReady],
		needRefresh: [needRefresh, setNeedRefresh],
	} = useRegisterSW({
		onRegistered(r: ServiceWorkerRegistration | undefined) {
			if (r) registrationRef.current = r;
		},
		onRegisterError(error: unknown) {
			console.error('SW registration error', error);
		},
	});

	const [newVersion, setNewVersion] = useState<string | null>(null);

	useEffect(() => {
		const handleVisibility = () => {
			if (!document.hidden) {
				navigator.serviceWorker
					?.getRegistration()
					.then((reg) => reg?.update())
					.catch(() => {});
			}
		};
		document.addEventListener('visibilitychange', handleVisibility);
		return () => document.removeEventListener('visibilitychange', handleVisibility);
	}, []);

	useEffect(() => {
		if (!needRefresh) return;
		fetch(`${import.meta.env.BASE_URL}version.json`)
			.then((res) => res.json())
			.then((data: { version?: string }) => {
				if (data.version) setNewVersion(data.version);
			})
			.catch(() => {});
	}, [needRefresh]);

	const handleUpdate = useCallback(() => {
		const waiting = registrationRef.current?.waiting ?? null;

		if (!waiting) {
			window.location.reload();
			return;
		}

		// The actual reload is owned by the global `controllerchange` listener
		// in main.tsx, which fires only after the new SW takes control of the
		// client. This fallback covers user agents where `controllerchange`
		// never fires (e.g. iOS Safari in standalone mode).
		setTimeout(() => window.location.reload(), RELOAD_FALLBACK_MS);

		waiting.postMessage({ type: 'SKIP_WAITING' });
	}, []);

	const close = () => {
		setOfflineReady(false);
		setNeedRefresh(false);
		setNewVersion(null);
	};

	return (
		<AnimatePresence>
			{(offlineReady || needRefresh) && (
				<motion.div
					initial={{ y: 100, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: 100, opacity: 0 }}
					className="absolute bottom-20 left-4 right-4 z-[100] mx-auto max-w-[400px]"
				>
					<div className="bg-primary-text text-white p-4 rounded-2xl shadow-2xl flex flex-col items-center justify-between gap-4 border border-white/10 overflow-hidden">
						<div className="flex flex-col gap-1 flex-1 text-center w-full">
							<span className="font-hanken text-xs font-black uppercase tracking-widest-premium">
								{offlineReady ? t('pwa.ready') : t('pwa.new_version')}
							</span>
							<p className="font-sans text-[10px] opacity-80 leading-tight">
								{offlineReady
									? t('pwa.ready_msg')
									: newVersion
										? t('pwa.version_update')
												.replace('{from}', __APP_VERSION__)
												.replace('{to}', newVersion)
										: t('pwa.new_version_msg')}
							</p>
						</div>
						<div className="flex gap-2 shrink-0 w-full">
							{needRefresh ? (
								<button
									type="button"
									onClick={handleUpdate}
									className="bg-white text-primary-text px-4 py-2 rounded-full font-hanken text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 flex-1 shadow-sm active:scale-95 transition-transform"
								>
									<RefreshCw className="w-3 h-3" />
									{t('pwa.update')}
								</button>
							) : (
								<button
									type="button"
									onClick={() => close()}
									className="bg-white text-primary-text px-4 py-2 rounded-full font-hanken text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 flex-1 shadow-sm active:scale-95 transition-transform"
								>
									<Check className="w-3 h-3" />
									{t('pwa.close').toUpperCase()}
								</button>
							)}
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

export default ReloadPrompt;
