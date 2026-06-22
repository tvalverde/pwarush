import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PlayerToken from '../components/board/PlayerToken';
import type { Player } from '../types';

const player: Player = {
	id: 'p1',
	name: 'Ada',
	shape: 'TRIANGLE',
	level: 'KID',
	position: 0,
	sparks: [],
	usedWildcards: { fiftyFifty: false, change: false, secondChance: false },
	pendingConclaveCategory: null,
	correct: 0,
	wrong: 0,
};

const renderToken = (accent: string) =>
	render(
		<svg>
			<title>token</title>
			<PlayerToken player={player} accent={accent} x={10} y={20} />
		</svg>,
	);

describe('PlayerToken (raised, board-contrasting piece)', () => {
	it('casts a shadow to lift the token off the board', () => {
		const { container } = renderToken('var(--color-cat-cyan)');
		expect(container.innerHTML).toContain('url(#nq-token-shadow)');
	});

	it('keeps a constant dark separation rim so it never merges with a same-colour tile', () => {
		const { container } = renderToken('var(--color-cat-cyan)');
		const circles = [...container.querySelectorAll('circle')];
		expect(circles.some((c) => c.getAttribute('fill') === '#05050a')).toBe(true);
	});

	it('halos the disc in the player accent', () => {
		const accent = 'var(--color-cat-crimson)';
		const { container } = renderToken(accent);
		const circles = [...container.querySelectorAll('circle')];
		expect(circles.some((c) => c.getAttribute('stroke') === accent)).toBe(true);
	});
});
