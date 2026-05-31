import { db } from '../db/database';
import { isValidBackup } from './schemas';

export const exportDatabaseToJson = async () => {
	try {
		const data = {
			players: await db.players.toArray(),
			preferences: await db.preferences.toArray(),
			history: await db.history.toArray(),
			gameState: await db.gameState.toArray(),
			version: 1,
			exportDate: Date.now(),
			appName: 'SUDOKUPADO',
		};

		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');

		const dateStr = new Date().toISOString().split('T')[0];
		link.href = url;
		link.download = `sudokupado_backup_${dateStr}.json`;

		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);

		return true;
	} catch (error) {
		console.error('Export failed:', error);
		return false;
	}
};

export const importDatabaseFromJson = async (file: File) => {
	try {
		const text = await file.text();
		const data = JSON.parse(text);

		// Backwards compatibility: legacy backups (pre-maxHints) default to 3 hints per session.
		if (Array.isArray(data?.preferences)) {
			data.preferences = data.preferences.map((p: Record<string, unknown>) => ({
				...p,
				maxHints: typeof p.maxHints === 'number' ? p.maxHints : 3,
			}));
		}

		if (!isValidBackup(data)) {
			throw new Error('Invalid or corrupted backup file');
		}

		// Use a transaction to ensure data integrity
		await db.transaction('rw', [db.players, db.preferences, db.history, db.gameState], async () => {
			// Clear existing data
			await db.players.clear();
			await db.preferences.clear();
			await db.history.clear();
			await db.gameState.clear();

			// Bulk add imported data
			if (data.players.length > 0) await db.players.bulkAdd(data.players);
			if (data.preferences?.length > 0) await db.preferences.bulkAdd(data.preferences);
			if (data.history.length > 0) await db.history.bulkAdd(data.history);
			if (data.gameState?.length > 0) await db.gameState.bulkAdd(data.gameState);
		});

		return true;
	} catch (error) {
		console.error('Import failed:', error);
		throw error;
	}
};
