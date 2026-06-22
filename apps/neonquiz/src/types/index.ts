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

export type PlayerLevel = 'KID' | 'ADULT';

export interface Player {
	id: string;
	name: string;
	shape: PlayerShape;
	level: PlayerLevel;
	position: number;
	sparks: TriviaCategory[];
	usedWildcards: WildcardUsage;
	pendingConclaveCategory: TriviaCategory | null;
	// Added in Hito 8 (optional so earlier sessions and test fixtures stay valid):
	// the player's pinned accent colour (from their profile) and per-match answer tallies.
	accentColor?: string;
	profileId?: number;
	correct?: number;
	wrong?: number;
}

// A reusable, device-local player remembered across games, with lifetime aggregates.
export interface PlayerProfile {
	id?: number;
	name: string;
	shape: PlayerShape;
	accentColor: string;
	preferredLevel: PlayerLevel;
	gamesPlayed: number;
	gamesWon: number;
	totalCorrect: number;
	totalWrong: number;
	totalPlayMs: number;
	currentStreak: number;
	bestStreak: number;
	createdAt: number;
	lastPlayedAt: number;
}

// One participant's contribution to a finished match — stored in the Hall of Fame roster and
// used to update the corresponding profile's aggregates.
export interface MatchPlayerStat {
	profileId?: number;
	name: string;
	shape: PlayerShape;
	color: string;
	level: PlayerLevel;
	sparks: number;
	correct: number;
	wrong: number;
	winner: boolean;
}

// The distilled outcome of a completed match, consumed by the profile-aggregation layer.
export interface GameResult {
	durationMs: number;
	turns: number;
	players: MatchPlayerStat[];
}

export interface FailedQuestionEntry {
	id?: number;
	questionId: number;
	failedAt: number;
}

// A user override of a question's effective audience, keyed by a stable content key (not the
// Dexie auto-id, which is reassigned on re-seed). Lets a too-hard KID question be moved to ADULT.
export interface QuestionAudienceOverride {
	key: string;
	audience: TargetAudience;
}

export interface GameHistoryEntry {
	id?: number;
	winnerName: string;
	winnerShape: PlayerShape;
	winnerColor: string;
	players: number;
	turns: number;
	date: number;
	// Hito 8 enrichments — optional so pre-H8 entries render without them.
	durationMs?: number;
	roster?: MatchPlayerStat[];
	correct?: number;
	wrong?: number;
	wildcardsUsed?: number;
	conclaveFails?: number;
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
	// Hito 8 — persisted so the match clock survives a reload (optional for legacy sessions).
	startedAt?: number;
	conclaveFails?: number;
	// Active (un-paused) elapsed ms at checkpoint time; on resume `startedAt` is reconstructed from
	// it so time spent away (or paused) never inflates the match duration.
	elapsedMs?: number;
}
