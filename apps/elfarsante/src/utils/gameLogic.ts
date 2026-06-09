import type { GameConfig, Player, RoundData } from '../context/GameStateContext';
import { AVAILABLE_CATEGORIES } from '../data/dictionary';

interface GenerateRoundParams {
	currentPlayers: Player[];
	validPlayerNames: string[]; // only needed for completely new drafts
	config: GameConfig;
	usedWords: Record<string, string[]>;
	forceResetScores?: boolean;
}

interface GenerateRoundResult {
	newPlayers: Player[];
	newRound: RoundData;
	exhaustedCategory?: string; // Returns category name if we had to reset its history
}

export async function generateNewRound({
	currentPlayers,
	validPlayerNames,
	config,
	usedWords,
	forceResetScores = false,
}: GenerateRoundParams): Promise<GenerateRoundResult> {
	const { farsantesCount, selectedCategories, timerDuration, language = 'es' } = config;

	// Use validPlayerNames if provided (e.g. from HomeScreen), otherwise use current active players
	const playerNames =
		validPlayerNames.length > 0 ? validPlayerNames : currentPlayers.map((p) => p.name);

	const farsanteIndices: number[] = [];
	const allIndices = playerNames.map((_, i) => i);

	if (playerNames.length === 3 && farsantesCount === 1) {
		// Weighted randomness for 3 players to reduce (but not eliminate) consecutive repeats
		const previousFarsanteNames = currentPlayers
			.filter((p) => p.role === 'farsante')
			.map((p) => p.name);

		const ticketPool: number[] = [];
		allIndices.forEach((idx) => {
			const isPrevious = previousFarsanteNames.includes(playerNames[idx]);
			const tickets = isPrevious ? 1 : 4; // 1 ticket for the repeater, 4 for the fresh ones
			for (let i = 0; i < tickets; i++) ticketPool.push(idx);
		});

		const selectedIdx = ticketPool[Math.floor(Math.random() * ticketPool.length)];
		farsanteIndices.push(selectedIdx);
	} else {
		// Pure randomness for > 3 players or multiple farsantes
		while (farsanteIndices.length < farsantesCount) {
			const idx = Math.floor(Math.random() * playerNames.length);
			if (!farsanteIndices.includes(idx)) {
				farsanteIndices.push(idx);
			}
		}
	}

	const newPlayers: Player[] = playerNames.map((name, index) => {
		const existingPlayer = currentPlayers.find((p) => p.name === name);
		const isFarsante = farsanteIndices.includes(index);
		const shouldResetScore = forceResetScores;
		return {
			id: existingPlayer ? existingPlayer.id : `p-${index}-${Date.now()}`,
			name,
			score: existingPlayer && !shouldResetScore ? existingPlayer.score : 0,
			farsanteCount: (existingPlayer ? existingPlayer.farsanteCount : 0) + (isFarsante ? 1 : 0),
			wronglyEliminatedCount: existingPlayer ? existingPlayer.wronglyEliminatedCount : 0,
			roundsSurvivedCount: existingPlayer ? existingPlayer.roundsSurvivedCount : 0,
			farsanteWinsCount: existingPlayer ? existingPlayer.farsanteWinsCount : 0,
			isAlive: true,
			role: isFarsante ? 'farsante' : 'normal',
		};
	});

	// Select random word based on selected categories
	let chosenCat: string;
	if (selectedCategories.includes('aleatorio')) {
		const realCategories = AVAILABLE_CATEGORIES.filter((c) => c !== 'aleatorio');
		chosenCat = realCategories[Math.floor(Math.random() * realCategories.length)];
	} else {
		chosenCat = selectedCategories[Math.floor(Math.random() * selectedCategories.length)];
	}

	let wordLists: Record<string, string[]>;
	try {
		const dictModule = await import(`../data/dictionaries/${language}.json`);
		wordLists = dictModule.default || dictModule;
	} catch (err) {
		console.error('Failed to load dictionary for', language, err);
		const fallbackModule = await import(`../data/dictionaries/es.json`);
		wordLists = fallbackModule.default || fallbackModule;
	}

	const fullWordList = wordLists[chosenCat] || [];
	const categoryUsedWords = usedWords[chosenCat] || [];
	let filteredWords = fullWordList.filter((w) => !categoryUsedWords.includes(w));

	let exhaustedCategory: string | undefined;

	if (filteredWords.length === 0 && fullWordList.length > 0) {
		// Agotadas: Resetear historial de esa categoría y avisar
		exhaustedCategory = chosenCat;
		filteredWords = fullWordList;
	}

	let chosenWord: string;
	if (filteredWords.length > 0) {
		chosenWord = filteredWords[Math.floor(Math.random() * filteredWords.length)];
	} else {
		// Fallback extremo
		chosenCat = 'animales';
		chosenWord = 'León';
	}

	const startingPlayerId = newPlayers[Math.floor(Math.random() * newPlayers.length)].id;

	const newRound: RoundData = {
		word: chosenWord,
		category: chosenCat,
		farsanteIds: newPlayers.filter((p) => p.role === 'farsante').map((p) => p.id),
		remainingTime: timerDuration,
		accusedId: null,
		currentPlayerIndex: 0,
		startingPlayerId,
		hasShownStartNotice: false,
	};

	return { newPlayers, newRound, exhaustedCategory };
}
