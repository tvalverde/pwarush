import { describe, expect, it, vi } from 'vitest';
import { countSolutions } from '../engine/solver';
import { sceneOf } from '../utils/caseState';
import {
	type GenerateRequest,
	generateCaseForRequest,
	workerHandler,
} from '../workers/murdokuWorker';

describe('murdoku worker protocol', () => {
	it('generates a deterministic case for a given seed', () => {
		const first = generateCaseForRequest('beginner', 99);
		const second = generateCaseForRequest('beginner', 99);
		expect(first.payload.case).toEqual(second.payload.case);
		expect(first.payload.seed).toBe(99);
	});

	it('produces a case with a unique solution', () => {
		const { payload } = generateCaseForRequest('intermediate', 5);
		const scene = sceneOf(payload.case);
		expect(countSolutions(scene, payload.case.clues, 2)).toBe(1);
	});

	it('posts a GENERATED response that echoes the request id', () => {
		const postSpy = vi.spyOn(self, 'postMessage').mockImplementation(() => {});
		const event = {
			data: { id: 7, type: 'GENERATE', difficulty: 'beginner', seed: 3 } as GenerateRequest,
		} as MessageEvent<GenerateRequest>;

		workerHandler(event);

		expect(postSpy).toHaveBeenCalledTimes(1);
		const message = postSpy.mock.calls[0][0] as {
			id: number;
			type: string;
			payload: { seed: number };
		};
		expect(message.id).toBe(7);
		expect(message.type).toBe('GENERATED');
		expect(message.payload.seed).toBe(3);
		postSpy.mockRestore();
	});
});
