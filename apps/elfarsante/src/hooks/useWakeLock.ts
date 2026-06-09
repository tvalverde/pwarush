import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook to prevent the screen from turning off using the Screen Wake Lock API.
 * @param enabled - Whether the wake lock should be active.
 */
export function useWakeLock(enabled: boolean) {
	const wakeLock = useRef<any>(null);

	const requestWakeLock = useCallback(async () => {
		if ('wakeLock' in navigator && enabled) {
			try {
				wakeLock.current = await (navigator as any).wakeLock.request('screen');

				// Listen for when the lock is released (e.g. by the system)
				wakeLock.current.addEventListener('release', () => {
					wakeLock.current = null;
				});
			} catch (err: unknown) {
				if (err instanceof Error) {
					console.error(`Wake Lock error: ${err.name}, ${err.message}`);
				}
			}
		}
	}, [enabled]);

	useEffect(() => {
		if (enabled) {
			requestWakeLock();
		} else {
			if (wakeLock.current) {
				wakeLock.current.release();
				wakeLock.current = null;
			}
		}

		// Re-request wake lock if app becomes visible again
		const handleVisibilityChange = () => {
			if (enabled && wakeLock.current === null && document.visibilityState === 'visible') {
				requestWakeLock();
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			if (wakeLock.current) {
				wakeLock.current.release();
			}
		};
	}, [enabled, requestWakeLock]);
}
