import type { Board } from '../types';
import { getNode, NEXUS_ID } from './boardFactory';

export interface MoveOptions {
	// When false (default) the Nexus is impassable: it can be neither entered nor crossed,
	// so players without the 6 Sparks route around the ring (the "Nexus Wall" rule).
	nexusUnlocked?: boolean;
}

/**
 * Returns every node reachable in exactly `steps` moves from `startNodeId`, walking the
 * board graph without immediately backtracking onto the node just left. The Nexus is
 * gated by `nexusUnlocked`: while locked it is skipped entirely; while unlocked it follows
 * a "reach or pass" rule — any path that arrives at it within `steps` stops there and
 * exposes it as a destination. Pure DFS; destinations are de-duplicated.
 */
export const calculateValidMoves = (
	board: Board,
	startNodeId: number,
	steps: number,
	options: MoveOptions = {},
): number[] => {
	if (steps <= 0) return [];
	const nexusUnlocked = options.nexusUnlocked ?? false;

	const destinations = new Set<number>();

	const walk = (current: number, previous: number, remaining: number): void => {
		if (remaining === 0) {
			destinations.add(current);
			return;
		}
		for (const next of getNode(board, current).connectedNodeIds) {
			if (next === previous) continue;
			if (next === NEXUS_ID) {
				// Reach-or-pass: entering the Nexus ends movement; locked, it is impassable.
				if (nexusUnlocked) destinations.add(NEXUS_ID);
				continue;
			}
			walk(next, current, remaining - 1);
		}
	};

	walk(startNodeId, -1, steps);
	return [...destinations].sort((a, b) => a - b);
};
