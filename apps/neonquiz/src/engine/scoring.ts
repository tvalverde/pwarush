export const ARCADE_BASE_POINTS = 100;
export const ARCADE_COMBO_MULTIPLIER = 50;
export const ARCADE_SPEED_BONUS_THRESHOLD_MS = 10_000;
export const ARCADE_SPEED_BONUS_POINTS = 200;

export interface ArcadeScoreResult {
	scoreDelta: number;
	newCombo: number;
	newMaxCombo: number;
}

export function calculateArcadeScore(
	correct: boolean,
	currentCombo: number,
	currentMaxCombo: number,
	isAdult: boolean,
	answerTimeMs: number | null,
): ArcadeScoreResult {
	if (!correct) {
		return {
			scoreDelta: 0,
			newCombo: 0,
			newMaxCombo: currentMaxCombo,
		};
	}

	const newCombo = currentCombo + 1;
	let scoreDelta = ARCADE_BASE_POINTS + newCombo * ARCADE_COMBO_MULTIPLIER;

	if (isAdult && answerTimeMs !== null && answerTimeMs <= ARCADE_SPEED_BONUS_THRESHOLD_MS) {
		scoreDelta += ARCADE_SPEED_BONUS_POINTS;
	}

	return {
		scoreDelta,
		newCombo,
		newMaxCombo: Math.max(currentMaxCombo, newCombo),
	};
}
