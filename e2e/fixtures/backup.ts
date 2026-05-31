export interface BackupBuilderOptions {
	playerName?: string;
	score?: number;
}

export const buildValidBackup = (options: BackupBuilderOptions = {}) => {
	const { playerName = 'Imported Player', score = 3200 } = options;
	return {
		appName: 'SUDOKUPADO',
		version: 1,
		exportDate: 1_700_000_000_000,
		players: [
			{
				id: 1,
				name: playerName,
				createdAt: 1_700_000_000_000,
				isDeleted: 0,
			},
		],
		preferences: [
			{
				id: 1,
				playerId: 1,
				difficulty: 'beginner',
				allowNotes: true,
				maxMistakes: 3,
				maxHints: 3,
			},
		],
		history: [
			{
				id: 1,
				playerId: 1,
				difficulty: 'beginner',
				score,
				timeElapsed: 180,
				mistakes: 1,
				hintsUsed: 0,
				date: 1_700_500_000_000,
			},
		],
		gameState: [],
	};
};

export const buildInvalidBackup = () => ({
	notTheRightAppName: true,
	players: [],
});
