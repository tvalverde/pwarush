import { describe, expect, it } from 'vitest';
import { calculateValidMoves } from '../engine/boardEngine';
import { buildFamiliarBoard, getNode, NEXUS_ID } from '../engine/boardFactory';
import type { Board } from '../types';

const lineBoard: Board = {
	nodes: [
		{ id: 0, type: 'NORMAL', category: null, connectedNodeIds: [1], x: 0, y: 0 },
		{ id: 1, type: 'NORMAL', category: null, connectedNodeIds: [0, 2], x: 1, y: 0 },
		{ id: 2, type: 'NORMAL', category: null, connectedNodeIds: [1, 3], x: 2, y: 0 },
		{ id: 3, type: 'NORMAL', category: null, connectedNodeIds: [2], x: 3, y: 0 },
	],
};

describe('calculateValidMoves', () => {
	it('returns an empty list for non-positive steps', () => {
		expect(calculateValidMoves(lineBoard, 0, 0)).toEqual([]);
	});

	it('walks forward without immediately backtracking', () => {
		expect(calculateValidMoves(lineBoard, 0, 1)).toEqual([1]);
		expect(calculateValidMoves(lineBoard, 0, 2)).toEqual([2]);
		expect(calculateValidMoves(lineBoard, 0, 3)).toEqual([3]);
	});

	it('cannot reach a node further than the chain allows', () => {
		expect(calculateValidMoves(lineBoard, 0, 4)).toEqual([]);
	});

	it('reaches distinct destinations on the real board within a die roll', () => {
		const board = buildFamiliarBoard();
		for (let roll = 1; roll <= 6; roll++) {
			const moves = calculateValidMoves(board, NEXUS_ID, roll);
			expect(moves.length).toBeGreaterThan(0);
			expect(new Set(moves).size).toBe(moves.length);
			expect(moves).not.toContain(NEXUS_ID);
		}
	});

	it('lets a player leave a Spark vertex toward the ring or the spoke', () => {
		const board = buildFamiliarBoard();
		const spark = board.nodes.find((node) => node.type === 'SPARK_NODE');
		expect(spark).toBeDefined();
		const moves = calculateValidMoves(board, getNode(board, spark!.id).id, 1);
		expect(moves.length).toBeGreaterThanOrEqual(2);
	});
});

describe('Nexus wall rule', () => {
	const board = buildFamiliarBoard();
	const spokeInner = board.nodes.find(
		(node) => node.type === 'NORMAL' && node.connectedNodeIds.includes(NEXUS_ID),
	);
	const midId = spokeInner?.connectedNodeIds.find((id) => id !== NEXUS_ID) ?? -1;
	const outerId = getNode(board, midId).connectedNodeIds.find((id) => id !== spokeInner?.id) ?? -1;

	it('skips the Nexus when the player lacks the six Sparks (locked)', () => {
		const moves = calculateValidMoves(board, spokeInner!.id, 1);
		expect(moves).not.toContain(NEXUS_ID);
		expect(moves).toContain(midId);
	});

	it('exposes the Nexus as a destination once unlocked', () => {
		const moves = calculateValidMoves(board, spokeInner!.id, 1, { nexusUnlocked: true });
		expect(moves).toContain(NEXUS_ID);
	});

	it('lets an unlocked Nexus be entered when the roll reaches or overshoots it', () => {
		// outer spoke node is 3 steps from the Nexus; a roll of 5 still lets it enter.
		expect(calculateValidMoves(board, outerId, 5, { nexusUnlocked: true })).toContain(NEXUS_ID);
		expect(calculateValidMoves(board, outerId, 5)).not.toContain(NEXUS_ID);
	});
});
