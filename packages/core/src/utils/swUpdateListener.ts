export const installSWUpdateListener = (): void => {
	const sw = navigator.serviceWorker;
	if (!sw) return;

	const hadController = sw.controller !== null;
	let refreshing = false;

	sw.addEventListener('controllerchange', () => {
		if (!hadController || refreshing) return;
		refreshing = true;
		window.location.reload();
	});
};
