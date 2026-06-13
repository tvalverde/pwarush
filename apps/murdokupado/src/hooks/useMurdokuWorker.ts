import { useCallback, useEffect, useRef } from 'react';
import type { Case, Difficulty } from '../engine/types';

interface PromiseSettler<T> {
	resolve: (data: T) => void;
	reject: (err: Error) => void;
}

interface GeneratedPayload {
	case: Case;
	seed: number;
}

const WORKER_NOT_READY_ERROR = 'Murdoku worker not ready';
const WORKER_CRASHED_ERROR = 'Worker crashed';
const WORKER_TERMINATED_ERROR = 'Worker terminated';

export const useMurdokuWorker = () => {
	const workerRef = useRef<Worker | null>(null);
	const messageIdRef = useRef(0);
	const settlersRef = useRef(new Map<number, PromiseSettler<GeneratedPayload>>());

	useEffect(() => {
		const settlers = settlersRef.current;
		workerRef.current = new Worker(new URL('../workers/murdokuWorker.ts', import.meta.url), {
			type: 'module',
		});

		const handleMessage = (e: MessageEvent) => {
			const { id, payload } = e.data;
			const settler = settlers.get(id);
			if (settler) {
				settler.resolve(payload);
				settlers.delete(id);
			}
		};

		const handleError = (e: ErrorEvent) => {
			console.error('Murdoku Worker Error:', e);
			for (const [id, settler] of settlers) {
				settler.reject(new Error(WORKER_CRASHED_ERROR));
				settlers.delete(id);
			}
		};

		workerRef.current.addEventListener('message', handleMessage);
		workerRef.current.addEventListener('error', handleError);

		return () => {
			for (const [id, settler] of settlers) {
				settler.reject(new Error(WORKER_TERMINATED_ERROR));
				settlers.delete(id);
			}
			workerRef.current?.terminate();
		};
	}, []);

	const generate = useCallback(
		(difficulty: Difficulty, seed?: number): Promise<GeneratedPayload> => {
			return new Promise((resolve, reject) => {
				if (!workerRef.current) {
					reject(new Error(WORKER_NOT_READY_ERROR));
					return;
				}
				const id = ++messageIdRef.current;
				settlersRef.current.set(id, { resolve, reject });
				workerRef.current.postMessage({ id, type: 'GENERATE', difficulty, seed });
			});
		},
		[],
	);

	return { generate };
};
