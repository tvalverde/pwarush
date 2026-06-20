import {
	type Board,
	type BoardNode,
	CATEGORIES,
	type NodeType,
	type TriviaCategory,
} from '../types';
import { type Axial, addAxial, axialToPixel, HEX_DIRECTIONS, scaleAxial } from './hex';

export const NEXUS_ID = 0;
const SPOKE_LENGTH = 3; // NORMAL tiles between the Nexus and each Spark vertex
const VERTEX_DISTANCE = SPOKE_LENGTH + 1; // ring radius (4) — the Spark vertices sit on it

interface NodeBuilder {
	id: number;
	type: NodeType;
	category: TriviaCategory | null;
	x: number;
	y: number;
	connectedNodeIds: number[];
}

/**
 * Builds the reduced "Familiar" board on a flat-top hexagonal lattice: a central Nexus,
 * six color-coded spokes of three NORMAL tiles running out along the six hex directions,
 * six Spark Node vertices on the outer ring (one per category), and the ring's
 * mixed-category NORMAL tiles joining consecutive vertices. The graph topology is identical
 * to the radial layout — only the tile coordinates change. Pure and deterministic.
 */
export const buildFamiliarBoard = (): Board => {
	const nodes: NodeBuilder[] = [];

	const addNode = (type: NodeType, category: TriviaCategory | null, axial: Axial): number => {
		const id = nodes.length;
		const { x, y } = axialToPixel(axial);
		nodes.push({ id, type, category, x, y, connectedNodeIds: [] });
		return id;
	};

	const connect = (a: number, b: number): void => {
		if (!nodes[a].connectedNodeIds.includes(b)) nodes[a].connectedNodeIds.push(b);
		if (!nodes[b].connectedNodeIds.includes(a)) nodes[b].connectedNodeIds.push(a);
	};

	addNode('NEXUS', null, { q: 0, r: 0 }); // NEXUS_ID === 0

	const vertexIds: number[] = [];

	CATEGORIES.forEach((category, c) => {
		const spokeDir = HEX_DIRECTIONS[c];

		let previous = NEXUS_ID;
		for (let step = 1; step <= SPOKE_LENGTH; step++) {
			const id = addNode('NORMAL', category, scaleAxial(spokeDir, step));
			connect(previous, id);
			previous = id;
		}

		const vertexId = addNode('SPARK_NODE', category, scaleAxial(spokeDir, VERTEX_DISTANCE));
		connect(previous, vertexId);
		vertexIds.push(vertexId);
	});

	// Outer ring: each edge walks from a Spark vertex toward the next along hex direction c+2,
	// placing the mixed-category NORMAL tiles that tile the honeycomb's perimeter.
	CATEGORIES.forEach((_, c) => {
		const corner = scaleAxial(HEX_DIRECTIONS[c], VERTEX_DISTANCE);
		const edgeStep = HEX_DIRECTIONS[(c + 2) % CATEGORIES.length];
		let previous = vertexIds[c];
		for (let step = 1; step <= SPOKE_LENGTH; step++) {
			const ringCategory = CATEGORIES[(c + step) % CATEGORIES.length];
			const id = addNode('NORMAL', ringCategory, addAxial(corner, scaleAxial(edgeStep, step)));
			connect(previous, id);
			previous = id;
		}
		connect(previous, vertexIds[(c + 1) % CATEGORIES.length]);
	});

	const finalized: BoardNode[] = nodes.map((node) => ({
		id: node.id,
		type: node.type,
		category: node.category,
		connectedNodeIds: node.connectedNodeIds,
		x: node.x,
		y: node.y,
	}));

	return { nodes: finalized };
};

export const getNode = (board: Board, id: number): BoardNode => {
	const node = board.nodes[id];
	if (!node || node.id !== id) throw new Error(`Unknown board node: ${id}`);
	return node;
};
