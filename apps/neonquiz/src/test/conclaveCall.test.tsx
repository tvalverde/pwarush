import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import AdultQuestionOverlay from '../components/AdultQuestionOverlay';
import QuestionOverlay from '../components/QuestionOverlay';
import TurnTransitionScreen from '../components/TurnTransitionScreen';
import { NEXUS_ID } from '../engine/boardFactory';
import { useGameStore } from '../store/gameStore';
import { CATEGORIES, type Player, type Question } from '../types';

const question: Question = {
	id: 1,
	category: 'CYAN_SCI',
	targetAudience: 'KID',
	questionText: 'Q',
	option0: 'a',
	option1: 'b',
	option2: 'c',
	option3: 'd',
	correctAnswerIndex: 0,
};

const player = (sparks: Player['sparks'], position = 5): Player => ({
	id: 'p0',
	name: 'Ada',
	shape: 'TRIANGLE',
	level: 'KID',
	position,
	sparks,
	usedWildcards: { fiftyFifty: false, change: false, secondChance: false },
	pendingConclaveCategory: null,
});

const feedbackState = (sparks: Player['sparks']) => ({
	phase: 'FEEDBACK' as const,
	activeQuestion: question,
	lastOutcome: {
		correct: true,
		selectedIndex: 0,
		correctIndex: 0,
		collectedSpark: 'CYAN_SCI' as const,
	},
	players: [player(sparks)],
	currentPlayerIndex: 0,
	hiddenOptions: [],
	lockedOptions: [],
	answerRevealed: true,
	isConclave: false,
	wildcardUsedThisQuestion: false,
});

describe('Conclave call-to-action on completing the Sparks', () => {
	beforeEach(() => useGameStore.getState().resetGame());

	it('QuestionOverlay shows the "head to the centre" cue when the final Spark completes the set', () => {
		useGameStore.setState(feedbackState([...CATEGORIES]));
		const { getByTestId, queryByText } = render(<QuestionOverlay />);
		expect(getByTestId('conclave-call')).not.toBeNull();
		expect(queryByText('¡Chispa conseguida!')).toBeNull();
	});

	it('QuestionOverlay shows the generic Spark message when more remain', () => {
		useGameStore.setState(feedbackState(['CYAN_SCI']));
		const { queryByTestId } = render(<QuestionOverlay />);
		expect(queryByTestId('conclave-call')).toBeNull();
	});

	it('AdultQuestionOverlay shows the cue when the final Spark completes the set', () => {
		useGameStore.setState({
			...feedbackState([...CATEGORIES]),
			players: [{ ...player([...CATEGORIES]), level: 'ADULT' }],
		});
		const { getByTestId } = render(<AdultQuestionOverlay />);
		expect(getByTestId('conclave-call')).not.toBeNull();
	});

	it('TurnTransitionScreen reminds the player to reach the Nexus while holding every Spark off-centre', () => {
		useGameStore.setState({
			phase: 'TURN_TRANSITION',
			players: [player([...CATEGORIES], NEXUS_ID + 1)],
			currentPlayerIndex: 0,
		});
		const { getByTestId } = render(<TurnTransitionScreen />);
		expect(getByTestId('nexus-reminder')).not.toBeNull();
	});

	it('TurnTransitionScreen shows no reminder once the player is on the Nexus', () => {
		useGameStore.setState({
			phase: 'TURN_TRANSITION',
			players: [player([...CATEGORIES], NEXUS_ID)],
			currentPlayerIndex: 0,
		});
		const { queryByTestId } = render(<TurnTransitionScreen />);
		expect(queryByTestId('nexus-reminder')).toBeNull();
	});
});
