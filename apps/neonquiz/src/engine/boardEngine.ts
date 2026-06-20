import type { Board } from '../types';
import { getNode } from './boardFactory';

/**
 * Returns every node reachable in exactly `steps` moves from `startNodeId`, walking
 * the board graph without immediately backtracking onto the node just left. Pure DFS;
 * the resulting destination ids are de-duplicated.
 */
export const calculateValidMoves = (board: Board, startNodeId: number, steps: number): number[] => {
	if (steps <= 0) return [];

	const destinations = new Set<number>();

	const walk = (current: number, previous: number, remaining: number): void => {
		if (remaining === 0) {
			destinations.add(current);
			return;
		}
		for (const next of getNode(board, current).connectedNodeIds) {
			if (next === previous) continue;
			walk(next, current, remaining - 1);
		}
	};

	walk(startNodeId, -1, steps);
	return [...destinations].sort((a, b) => a - b);
};
