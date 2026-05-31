import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSudokuWorker } from '../../hooks/useSudokuWorker';

describe('Integration: useSudokuWorker Bridge', () => {
	beforeEach(() => {
		vi.mocked(Worker).mockClear();
	});

	it('should send a message to the worker and resolve the promise when it responds (generate)', async () => {
		const { result } = renderHook(() => useSudokuWorker());

		// In setup.ts, Worker is mocked and vi.stubGlobal'd
		const mockWorkerInstance = vi.mocked(Worker).mock.results[0].value;

		const mockPayload = {
			initialGrid: [[1]],
			solution: [[1]],
			difficulty: 'beginner',
		};

		// 1. Call the async function
		const promise = result.current.generatePuzzle('beginner');

		// 2. Verify postMessage was called correctly (including the new ID logic)
		expect(mockWorkerInstance.postMessage).toHaveBeenCalledWith({
			id: 1,
			type: 'GENERATE',
			difficulty: 'beginner',
		});

		// 3. Simulate the worker responding
		// Get the registered message handler from addEventListener
		const messageHandler = mockWorkerInstance.addEventListener.mock.calls.find(
			(call: any) => call[0] === 'message',
		)[1];

		messageHandler({ data: { id: 1, type: 'GENERATED', payload: mockPayload } });

		// 4. Verify resolution
		const resolved = await promise;
		expect(resolved).toEqual(mockPayload);
	});

	it('should handle hints asynchronously via the bridge', async () => {
		const { result } = renderHook(() => useSudokuWorker());
		const mockWorkerInstance = vi.mocked(Worker).mock.results[0].value;

		const mockHint = { r: 0, c: 0, value: 5, type: 'naked_single' };

		const promise = result.current.getHint([[0]], [[5]]);

		expect(mockWorkerInstance.postMessage).toHaveBeenCalledWith({
			id: 1,
			type: 'GET_HINT',
			grid: [[0]],
			solution: [[5]],
		});

		const messageHandler = mockWorkerInstance.addEventListener.mock.calls.find(
			(call: any) => call[0] === 'message',
		)[1];

		messageHandler({ data: { id: 1, type: 'HINT_GENERATED', payload: mockHint } });

		const resolved = await promise;
		expect(resolved).toEqual(mockHint);
	});
});
