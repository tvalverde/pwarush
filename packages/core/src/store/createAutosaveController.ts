import { installAutosaveLifecycle } from '../persistence';

export interface AutosaveControllerConfig<TState> {
	getState: () => TState;
	subscribe: (listener: (state: TState, prevState: TState) => void) => () => void;
	snapshot: (state: TState) => string;
	persist: (state: TState) => void | Promise<void>;
	clear?: (state: TState) => void | Promise<void>;
	shouldClear?: (state: TState) => boolean;
	shouldSave?: (state: TState) => boolean;
	triggers?: (state: TState, prevState: TState) => 'save' | 'clear' | null;
	intervalMs?: number;
}

export interface AutosaveController {
	save: (force?: boolean) => Promise<void>;
	start: () => () => void;
}

export function createAutosaveController<TState>(
	config: AutosaveControllerConfig<TState>,
): AutosaveController {
	let lastSnapshot = '';

	const save = async (force = false): Promise<void> => {
		const state = config.getState();

		if (!force && config.shouldSave && !config.shouldSave(state)) return;

		if (config.shouldClear?.(state)) {
			await config.clear?.(state);
			return;
		}

		const snapshot = config.snapshot(state);
		if (!force && snapshot === lastSnapshot) return;

		await config.persist(state);
		lastSnapshot = snapshot;
	};

	const start = (): (() => void) => {
		const cleanupLifecycle = installAutosaveLifecycle(() => save(), {
			intervalMs: config.intervalMs,
		});

		const unsubscribe = config.subscribe((state, prevState) => {
			const action = config.triggers?.(state, prevState);
			if (action === 'save') {
				save(true);
			} else if (action === 'clear') {
				config.clear?.(state);
			}
		});

		return () => {
			cleanupLifecycle();
			unsubscribe();
		};
	};

	return { save, start };
}
