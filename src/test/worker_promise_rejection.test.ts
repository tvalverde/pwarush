import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSudokuWorker } from '../hooks/useSudokuWorker';

describe('Regression: Worker Promise Rejection', () => {
	beforeEach(() => {
		vi.mocked(Worker).mockClear();
	});

	it('should reject all pending generatePuzzle promises when worker is terminated (no hang)', async () => {
		const { result, unmount } = renderHook(() => useSudokuWorker());

		const TIMEOUT_MS = 200;
		const timeoutPromise = new Promise<'timeout'>((resolve) =>
			setTimeout(() => resolve('timeout'), TIMEOUT_MS),
		);

		const puzzlePromise = result.current.generatePuzzle('beginner');

		unmount();

		const raceResult = await Promise.race([
			puzzlePromise.then(
				() => 'resolved',
				() => 'rejected',
			),
			timeoutPromise,
		]);

		expect(raceResult).toBe('rejected');
	});

	it('should reject all pending getHint promises when worker is terminated (no hang)', async () => {
		const { result, unmount } = renderHook(() => useSudokuWorker());

		const TIMEOUT_MS = 200;
		const timeoutPromise = new Promise<'timeout'>((resolve) =>
			setTimeout(() => resolve('timeout'), TIMEOUT_MS),
		);

		const hintPromise = result.current.getHint([[0]], [[5]]);

		unmount();

		const raceResult = await Promise.race([
			hintPromise.then(
				() => 'resolved',
				() => 'rejected',
			),
			timeoutPromise,
		]);

		expect(raceResult).toBe('rejected');
	});

	it('should reject with descriptive message when worker is terminated', async () => {
		const { result, unmount } = renderHook(() => useSudokuWorker());

		const promise = result.current.generatePuzzle('beginner');

		unmount();

		await expect(promise).rejects.toThrow('Worker terminated');
	});

	it('should reject all pending promises when worker crashes', async () => {
		const { result } = renderHook(() => useSudokuWorker());
		const mockWorkerInstance = vi.mocked(Worker).mock.results[0].value;

		const promise = result.current.generatePuzzle('beginner');

		const errorHandler = mockWorkerInstance.addEventListener.mock.calls.find(
			(call: any) => call[0] === 'error',
		)[1];

		errorHandler(new ErrorEvent('error', { message: 'Worker crashed' }));

		await expect(promise).rejects.toThrow('Worker crashed');
	});

	it('should resolve generatePuzzle correctly when worker responds normally', async () => {
		const { result } = renderHook(() => useSudokuWorker());
		const mockWorkerInstance = vi.mocked(Worker).mock.results[0].value;

		const mockPayload = { initialGrid: [[1]], solution: [[1]] };
		const promise = result.current.generatePuzzle('beginner');

		const messageHandler = mockWorkerInstance.addEventListener.mock.calls.find(
			(call: any) => call[0] === 'message',
		)[1];

		messageHandler({ data: { id: 1, payload: mockPayload } });

		const resolved = await promise;
		expect(resolved).toEqual(mockPayload);
	});

	it('should resolve getHint correctly when worker responds normally', async () => {
		const { result } = renderHook(() => useSudokuWorker());
		const mockWorkerInstance = vi.mocked(Worker).mock.results[0].value;

		const mockHint = { r: 0, c: 0, value: 5, type: 'naked_single' };
		const promise = result.current.getHint([[0]], [[5]]);

		const messageHandler = mockWorkerInstance.addEventListener.mock.calls.find(
			(call: any) => call[0] === 'message',
		)[1];

		messageHandler({ data: { id: 1, payload: mockHint } });

		const resolved = await promise;
		expect(resolved).toEqual(mockHint);
	});
});
