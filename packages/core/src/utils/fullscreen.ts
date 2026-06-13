import { isIOS } from './device';

/*
  Fullscreen transitions are async and consume the user-activation token, so
  overlapping enter/exit calls (e.g. React StrictMode re-running a screen effect
  right after its cleanup) end in a racy final state: the cleanup's exit lands
  after the remount's enter, and re-entering is then rejected for lack of
  activation. Operations are serialized through a single promise chain and an
  operation only runs if it still matches the latest requested intent, so a
  stale exit scheduled between two enters is skipped instead of executed.
*/
type FullscreenIntent = 'enter' | 'exit';

let fullscreenOps: Promise<void> = Promise.resolve();
let latestIntent: FullscreenIntent = 'exit';

const enqueue = (intent: FullscreenIntent, operation: () => Promise<void>): Promise<void> => {
	latestIntent = intent;
	fullscreenOps = fullscreenOps.then(() => {
		if (latestIntent !== intent) return;
		return operation();
	});
	return fullscreenOps;
};

export const requestAppFullscreen = (): Promise<void> =>
	enqueue('enter', async () => {
		if (isIOS() || document.fullscreenElement) return;
		try {
			await document.documentElement.requestFullscreen?.();
		} catch (_err) {}
	});

export const exitAppFullscreen = (): Promise<void> =>
	enqueue('exit', async () => {
		try {
			if (document.fullscreenElement) {
				await document.exitFullscreen();
			}
		} catch (_err) {}
	});
