export const hasUserInput = (
	grid: number[][],
	initialGrid: number[][],
	notes: number[][][],
): boolean => {
	for (let r = 0; r < 9; r++) {
		for (let c = 0; c < 9; c++) {
			if (grid[r][c] !== initialGrid[r][c]) return true;
			if (notes[r][c].length > 0) return true;
		}
	}
	return false;
};

export const isMistakeLimitReached = (mistakes: number, maxMistakes: number): boolean => {
	if (maxMistakes === -1) return false;
	if (maxMistakes === 0) return mistakes > 0;
	return mistakes >= maxMistakes;
};
