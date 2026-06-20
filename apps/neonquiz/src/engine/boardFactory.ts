import {
	type Board,
	type BoardNode,
	CATEGORIES,
	type NodeType,
	type TriviaCategory,
} from '../types';

export const NEXUS_ID = 0;
const VERTEX_RADIUS = 100;
const SPOKE_RADII = [28, 56, 84];
const RING_FRACTIONS = [0.25, 0.5, 0.75];

const degToRad = (deg: number): number => (deg * Math.PI) / 180;

const vertexAngle = (categoryIndex: number): number => degToRad(-90 + categoryIndex * 60);

interface NodeBuilder {
	id: number;
	type: NodeType;
	category: TriviaCategory | null;
	x: number;
	y: number;
	connectedNodeIds: number[];
}

/**
 * Builds the reduced "Familiar" board: a central Nexus, six color-coded spokes of
 * three NORMAL tiles each, and an outer ring whose six vertices are the Spark Nodes
 * (one per category), joined by mixed-category NORMAL tiles. Pure and deterministic.
 */
export const buildFamiliarBoard = (): Board => {
	const nodes: NodeBuilder[] = [];

	const addNode = (
		type: NodeType,
		category: TriviaCategory | null,
		x: number,
		y: number,
	): number => {
		const id = nodes.length;
		nodes.push({ id, type, category, x, y, connectedNodeIds: [] });
		return id;
	};

	const connect = (a: number, b: number): void => {
		if (!nodes[a].connectedNodeIds.includes(b)) nodes[a].connectedNodeIds.push(b);
		if (!nodes[b].connectedNodeIds.includes(a)) nodes[b].connectedNodeIds.push(a);
	};

	addNode('NEXUS', null, 0, 0); // NEXUS_ID === 0

	const vertexIds: number[] = [];
	const spokeInnerIds: number[] = [];

	CATEGORIES.forEach((category, c) => {
		const angle = vertexAngle(c);
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);

		let previous = NEXUS_ID;
		let innermost = -1;
		SPOKE_RADII.forEach((radius) => {
			const id = addNode('NORMAL', category, radius * cos, radius * sin);
			if (innermost === -1) innermost = id;
			connect(previous, id);
			previous = id;
		});

		const vertexId = addNode('SPARK_NODE', category, VERTEX_RADIUS * cos, VERTEX_RADIUS * sin);
		connect(previous, vertexId);
		vertexIds.push(vertexId);
		spokeInnerIds.push(innermost);
	});

	// Outer ring: mixed-category NORMAL tiles linking consecutive Spark vertices.
	CATEGORIES.forEach((_, c) => {
		const startAngle = vertexAngle(c);
		const endAngle = vertexAngle(c + 1);
		let previous = vertexIds[c];
		RING_FRACTIONS.forEach((fraction, t) => {
			const angle = startAngle + (endAngle - startAngle) * fraction;
			const ringCategory = CATEGORIES[(c + t + 1) % CATEGORIES.length];
			const id = addNode(
				'NORMAL',
				ringCategory,
				VERTEX_RADIUS * Math.cos(angle),
				VERTEX_RADIUS * Math.sin(angle),
			);
			connect(previous, id);
			previous = id;
		});
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
