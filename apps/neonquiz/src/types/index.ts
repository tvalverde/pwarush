export type Language = 'en' | 'es';

export const CATEGORIES = [
	'EMERALD_GEO',
	'CRIMSON_HIST',
	'VIOLET_ART',
	'CYAN_SCI',
	'GOLD_ENT',
	'ORANGE_SPORT',
] as const;

export type TriviaCategory = (typeof CATEGORIES)[number];

export type TargetAudience = 'KID' | 'ADULT' | 'BOTH';

export interface Question {
	id?: number;
	category: TriviaCategory;
	targetAudience: TargetAudience;
	questionText: string;
	option0: string;
	option1: string;
	option2: string;
	option3: string;
	correctAnswerIndex: number;
}

export type NodeType = 'NORMAL' | 'SPARK_NODE' | 'NEXUS';

export interface BoardNode {
	id: number;
	type: NodeType;
	category: TriviaCategory | null;
	connectedNodeIds: number[];
	x: number;
	y: number;
}

export interface Board {
	nodes: BoardNode[];
}

export const PLAYER_SHAPES = [
	'TRIANGLE',
	'SQUARE',
	'PENTAGON',
	'HEXAGON',
	'CIRCLE',
	'RHOMBUS',
] as const;

export type PlayerShape = (typeof PLAYER_SHAPES)[number];

export interface WildcardUsage {
	fiftyFifty: boolean;
	change: boolean;
	secondChance: boolean;
}

export interface Player {
	id: string;
	name: string;
	shape: PlayerShape;
	position: number;
	sparks: TriviaCategory[];
	usedWildcards: WildcardUsage;
}

export interface FailedQuestionEntry {
	id?: number;
	questionId: number;
	failedAt: number;
}

export type GamePhase =
	| 'LOBBY'
	| 'TURN_TRANSITION'
	| 'ROLLING_DICE'
	| 'AWAITING_MOVE'
	| 'QUESTION_ACTIVE'
	| 'FEEDBACK'
	| 'CONCLAVE_VOTE'
	| 'CONCLAVE_HANDOFF'
	| 'CONCLAVE_QUESTION'
	| 'VICTORY';

export interface GameSession {
	id: number;
	players: Player[];
	currentPlayerIndex: number;
	phase: GamePhase;
	updatedAt: number;
}
