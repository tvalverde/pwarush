export interface AutosaveLifecycleOptions {
	intervalMs?: number;
}

const DEFAULT_INTERVAL_MS = 3000;

export function installAutosaveLifecycle(
	save: () => void,
	options?: AutosaveLifecycleOptions,
): () => void {
	const intervalMs = options?.intervalMs ?? DEFAULT_INTERVAL_MS;
	const interval = setInterval(save, intervalMs);

	const onVisibilityChange = () => {
		if (document.visibilityState === 'hidden') save();
	};
	const onBeforeUnload = () => save();

	window.addEventListener('beforeunload', onBeforeUnload);
	document.addEventListener('visibilitychange', onVisibilityChange);

	return () => {
		clearInterval(interval);
		window.removeEventListener('beforeunload', onBeforeUnload);
		document.removeEventListener('visibilitychange', onVisibilityChange);
	};
}
