import { useCallback, useEffect, useRef } from 'react';
import type { Difficulty } from '../types';
import type { HintResult } from '../workers/sudokuWorker';

interface PromiseSettler<T> {
	resolve: (data: T) => void;
	reject: (err: Error) => void;
}

const WORKER_NOT_READY_ERROR = 'Sudoku worker not ready';
const WORKER_CRASHED_ERROR = 'Worker crashed';
const WORKER_TERMINATED_ERROR = 'Worker terminated';

export const useSudokuWorker = () => {
	const workerRef = useRef<Worker | null>(null);
	const messageIdRef = useRef(0);
	const settlersRef = useRef(new Map<number, PromiseSettler<any>>());

	useEffect(() => {
		workerRef.current = new Worker(new URL('../workers/sudokuWorker.ts', import.meta.url), {
			type: 'module',
		});

		const handleMessage = (e: MessageEvent) => {
			const { id, payload } = e.data;
			const settler = settlersRef.current.get(id);
			if (settler) {
				settler.resolve(payload);
				settlersRef.current.delete(id);
			}
		};

		const handleError = (e: ErrorEvent) => {
			console.error('Sudoku Worker Error:', e);
			for (const [id, settler] of settlersRef.current) {
				settler.reject(new Error(WORKER_CRASHED_ERROR));
				settlersRef.current.delete(id);
			}
		};

		workerRef.current.addEventListener('message', handleMessage);
		workerRef.current.addEventListener('error', handleError);

		return () => {
			for (const [id, settler] of settlersRef.current) {
				settler.reject(new Error(WORKER_TERMINATED_ERROR));
				settlersRef.current.delete(id);
			}
			workerRef.current?.terminate();
		};
	}, []);

	const generatePuzzle = useCallback(
		(difficulty: Difficulty): Promise<{ initialGrid: number[][]; solution: number[][] }> => {
			return new Promise((resolve, reject) => {
				if (!workerRef.current) {
					reject(new Error(WORKER_NOT_READY_ERROR));
					return;
				}

				const id = ++messageIdRef.current;
				settlersRef.current.set(id, { resolve, reject });
				workerRef.current.postMessage({ id, type: 'GENERATE', difficulty });
			});
		},
		[],
	);

	const getHint = useCallback((grid: number[][], solution: number[][]): Promise<HintResult> => {
		return new Promise((resolve, reject) => {
			if (!workerRef.current) {
				reject(new Error(WORKER_NOT_READY_ERROR));
				return;
			}

			const id = ++messageIdRef.current;
			settlersRef.current.set(id, { resolve, reject });
			workerRef.current.postMessage({ id, type: 'GET_HINT', grid, solution });
		});
	}, []);

	return { generatePuzzle, getHint };
};
