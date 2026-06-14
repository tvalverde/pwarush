import { generateCase, sceneForDifficulty } from '../engine/generator';
import type { Case, Difficulty } from '../engine/types';

export interface GenerateRequest {
	id: number;
	type: 'GENERATE';
	difficulty: Difficulty;
	seed?: number;
}

export interface GeneratedResponse {
	id: number;
	type: 'GENERATED';
	payload: { case: Case; seed: number };
}

function randomSeed(): number {
	return Math.floor(Math.random() * 0x7fffffff);
}

export function generateCaseForRequest(difficulty: Difficulty, seed?: number): GeneratedResponse {
	const resolvedSeed = seed ?? randomSeed();
	const scene = sceneForDifficulty(difficulty, resolvedSeed);
	const value = generateCase(scene, difficulty, resolvedSeed);
	return { id: 0, type: 'GENERATED', payload: { case: value, seed: resolvedSeed } };
}

export function workerHandler(e: MessageEvent<GenerateRequest>): void {
	const { id, type, difficulty, seed } = e.data;
	if (type === 'GENERATE') {
		const response = generateCaseForRequest(difficulty, seed);
		self.postMessage({ ...response, id });
	}
}

if (typeof self !== 'undefined' && typeof (self as unknown as Worker).postMessage === 'function') {
	self.onmessage = workerHandler;
}
