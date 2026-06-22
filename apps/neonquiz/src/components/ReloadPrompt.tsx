import { useRegisterSW } from 'virtual:pwa-register/react';
import { UpdateBanner } from '@pwarush/core/pwa/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';

export const RELOAD_FALLBACK_MS = 5000;

function ReloadPrompt() {
	const t = useGameStore((s) => s.t);
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

	const newVersionMessage = newVersion
		? t('pwa.version_update').replace('{from}', __APP_VERSION__).replace('{to}', newVersion)
		: t('pwa.new_version_msg');

	return (
		<UpdateBanner
			offlineReady={offlineReady}
			needRefresh={needRefresh}
			onUpdate={handleUpdate}
			onClose={close}
			readyLabel={t('pwa.ready')}
			readyMessage={t('pwa.ready_msg')}
			newVersionLabel={t('pwa.new_version')}
			newVersionMessage={newVersionMessage}
			updateLabel={t('pwa.update')}
			closeLabel={t('pwa.close').toUpperCase()}
		/>
	);
}

export default ReloadPrompt;
