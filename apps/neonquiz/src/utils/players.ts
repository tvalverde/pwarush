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
