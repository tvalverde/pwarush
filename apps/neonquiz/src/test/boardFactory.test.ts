import { describe, expect, it } from 'vitest';
import { buildFamiliarBoard, getNode, NEXUS_ID } from '../engine/boardFactory';
import { CATEGORIES } from '../types';

describe('buildFamiliarBoard', () => {
	const board = buildFamiliarBoard();

	it('creates a single Nexus hub at the center connected to all six spokes', () => {
		const nexus = getNode(board, NEXUS_ID);
		expect(nexus.type).toBe('NEXUS');
		expect(nexus.x).toBe(0);
		expect(nexus.y).toBe(0);
		expect(nexus.connectedNodeIds).toHaveLength(CATEGORIES.length);
	});

	it('places exactly one Spark Node per category', () => {
		const sparks = board.nodes.filter((node) => node.type === 'SPARK_NODE');
		expect(sparks).toHaveLength(CATEGORIES.length);
		const sparkCategories = sparks.map((node) => node.category).sort();
		expect(sparkCategories).toEqual([...CATEGORIES].sort());
	});

	it('builds 43 nodes (1 nexus + 6 spokes of 3 + 6 vertices + 6 ring segments of 3)', () => {
		expect(board.nodes).toHaveLength(1 + 6 * 3 + 6 + 6 * 3);
	});

	it('keeps every edge bidirectional', () => {
		for (const node of board.nodes) {
			for (const other of node.connectedNodeIds) {
				expect(board.nodes[other].connectedNodeIds).toContain(node.id);
			}
		}
	});

	it('gives every node at least two connections (no dead ends)', () => {
		for (const node of board.nodes) {
			expect(node.connectedNodeIds.length).toBeGreaterThanOrEqual(2);
		}
	});

	it('throws on an unknown node id', () => {
		expect(() => getNode(board, 999)).toThrow();
	});
});
