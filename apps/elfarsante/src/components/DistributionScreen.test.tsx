import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useGameState } from '../context/GameStateContext';
import { DistributionScreen } from './DistributionScreen';

// Mock the context hook
vi.mock('../context/GameStateContext', () => ({
	useGameState: vi.fn(),
}));

// Mock SFX hook
vi.mock('../hooks/useSFX', () => ({
	useSFX: () => ({
		playTick: vi.fn(),
	}),
}));

// Mock I18n hook
vi.mock('../i18n/I18nContext', () => ({
	useTranslation: () => ({
		t: (key: string) => {
			if (key === 'distribution.next_player') return 'Siguiente Jugador';
			return key;
		},
	}),
}));

describe('DistributionScreen Layout (Sticky Bottom Regression)', () => {
	const mockState = {
		players: [
			{
				id: '1',
				name: 'Jugador 1',
				isAlive: true,
				role: 'normal' as const,
				score: 0,
				farsanteCount: 0,
				wronglyEliminatedCount: 0,
				roundsSurvivedCount: 0,
				farsanteWinsCount: 0,
			},
			{
				id: '2',
				name: 'Jugador 2',
				isAlive: true,
				role: 'farsante' as const,
				score: 0,
				farsanteCount: 1,
				wronglyEliminatedCount: 0,
				roundsSurvivedCount: 0,
				farsanteWinsCount: 0,
			},
		],
		round: {
			currentPlayerIndex: 0,
			word: 'Test Word',
			category: 'Test Category',
			farsanteIds: ['2'],
			remainingTime: 300,
			accusedId: null,
			startingPlayerId: '1',
			hasShownStartNotice: true,
		},
		currentPhase: 'REPARTO' as const,
		config: {
			timerDuration: 300,
			selectedCategories: ['Test Category'],
			farsantesCount: 1,
			penaltyOnFail: false,
			scoreLimit: null,
			blindTimer: false,
			language: 'es' as const,
		},
		usedWords: {},
		updatedAt: 0,
		localMutationCount: 0,
	};

	it('should have the sticky bottom pattern and required padding', () => {
		vi.mocked(useGameState).mockReturnValue({
			state: mockState,
			dispatch: vi.fn(),
			syncStatus: 'synced',
		});

		const { container } = render(<DistributionScreen />);

		// Check main container for correct padding and overflow
		const mainContainer = container.firstChild as HTMLElement;
		expect(mainContainer.className).toContain('pb-[120px]');
		expect(mainContainer.className).toContain('justify-start');
		expect(mainContainer.className).toContain('overflow-y-auto');

		// Check for the fixed bottom action container
		const actionContainer = screen.getByText(/Siguiente Jugador/i).closest('.fixed');
		expect(actionContainer).not.toBeNull();
		expect(actionContainer?.className).toContain('bottom-0');
		expect(actionContainer?.className).toContain('z-50');
	});
});
