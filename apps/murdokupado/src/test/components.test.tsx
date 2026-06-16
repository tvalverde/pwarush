import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import GameScreen from '../components/GameScreen';
import ResultScreen from '../components/ResultScreen';
import { courtroom } from '../data/scenes';
import type { Case } from '../engine/types';
import { useGameStore } from '../store/gameStore';

const manualCase: Case = {
	sceneId: 'courtroom',
	people: courtroom.cast,
	victimId: 'mara',
	murdererId: 'bo',
	difficulty: 'beginner',
	solution: {
		mara: { r: 0, c: 0 },
		bo: { r: 1, c: 1 },
		gemma: { r: 2, c: 2 },
		dee: { r: 3, c: 3 },
	},
	clues: [
		{ type: 'in_room', person: 'mara', room: 'courtroom' },
		{ type: 'same_room', a: 'gemma', b: 'dee' },
	],
	narrators: ['bo', 'gemma'],
};

afterEach(() => {
	cleanup();
});

describe('GameScreen board', () => {
	beforeEach(() => {
		useGameStore.getState().initGame(structuredClone(manualCase));
	});

	it('renders one button per scene cell and the suspect tray', () => {
		render(<GameScreen />);
		// courtroom is 4x4 = 16 cells.
		for (let r = 0; r < 4; r++) {
			for (let c = 0; c < 4; c++) {
				expect(screen.getByTestId(`cell-${r}-${c}`)).toBeInTheDocument();
			}
		}
		expect(screen.getByTestId('suspect-mara')).toBeInTheDocument();
		expect(screen.getByTestId('suspect-dee')).toBeInTheDocument();
	});

	it('places a selected suspect onto a tapped cell', () => {
		render(<GameScreen />);
		fireEvent.click(screen.getByTestId('suspect-mara'));
		fireEvent.click(screen.getByTestId('cell-0-0'));

		expect(useGameStore.getState().placement.mara).toEqual({ r: 0, c: 0 });
		// Token rendered on the board and removed from the tray.
		expect(screen.getByTestId('token-mara')).toBeInTheDocument();
		expect(screen.queryByTestId('suspect-mara')).not.toBeInTheDocument();
	});

	it('marks the victim in the suspect tray', () => {
		render(<GameScreen />);
		// manualCase victim is mara; suspects carry the data-victim flag.
		expect(screen.getByTestId('suspect-mara')).toHaveAttribute('data-victim', 'true');
		expect(screen.getByTestId('suspect-dee')).not.toHaveAttribute('data-victim');
	});

	it('renders the clue panel with rendered sentences', () => {
		useGameStore.getState().setLanguage('en');
		render(<GameScreen />);
		expect(screen.getByTestId('clue-0')).toHaveTextContent('Mara was in the courtroom');
	});

	it('exposes a hint button that reveals the place/dismiss controls', () => {
		render(<GameScreen />);
		expect(screen.queryByTestId('hint-controls')).not.toBeInTheDocument();
		fireEvent.click(screen.getByTestId('hint-button'));
		expect(screen.getByTestId('hint-controls')).toBeInTheDocument();
		expect(screen.getByTestId('hint-apply')).toBeInTheDocument();
		expect(screen.getByTestId('hint-dismiss')).toBeInTheDocument();
	});

	it("sinks a narrator's whole block once all its clues are checked", () => {
		const { container } = render(<GameScreen />);
		const clueOrderInDom = (): string[] =>
			Array.from(container.querySelectorAll('[data-testid^="clue-"]')).map((el) =>
				el.getAttribute('data-testid'),
			) as string[];
		// manualCase: clue-0 narrated by bo, clue-1 by gemma. bo is listed first.
		expect(clueOrderInDom()).toEqual(['clue-0', 'clue-1']);
		// Checking bo's only clue fully completes his block, sinking it below gemma.
		fireEvent.click(screen.getByTestId('clue-0'));
		expect(clueOrderInDom()).toEqual(['clue-1', 'clue-0']);
		// Unchecking floats bo's block back above gemma.
		fireEvent.click(screen.getByTestId('clue-0'));
		expect(clueOrderInDom()).toEqual(['clue-0', 'clue-1']);
	});
});

describe('ResultScreen reveal', () => {
	beforeEach(() => {
		useGameStore.getState().initGame(structuredClone(manualCase));
		useGameStore.getState().setLastResult({
			timeElapsed: 75,
			mistakes: 1,
			difficulty: 'beginner',
			murdererId: 'bo',
			victimId: 'mara',
			hintsUsed: 0,
		});
	});

	it('reveals the murderer and victim names', () => {
		render(<ResultScreen />);
		expect(screen.getByTestId('result-screen')).toBeInTheDocument();
		expect(screen.getByTestId('murderer-name')).toHaveTextContent('Bo');
	});
});
