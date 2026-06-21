// Per-player accent colours, shared by the board tokens and the lobby chips so a player's
// shape AND colour are identical in setup and in play. Indexed by player order.
export const PLAYER_ACCENTS = [
	'var(--color-cat-cyan)',
	'var(--color-cat-crimson)',
	'var(--color-cat-gold)',
	'var(--color-cat-emerald)',
	'var(--color-cat-orange)',
	'var(--color-cat-violet)',
];

export const playerAccent = (index: number): string =>
	PLAYER_ACCENTS[index % PLAYER_ACCENTS.length];

// A player's display colour: their pinned profile accent when present, otherwise the
// legacy order-based accent (keeps pre-H8 sessions and fixtures rendering correctly).
export const playerColor = (player: { accentColor?: string }, index: number): string =>
	player.accentColor ?? playerAccent(index);
