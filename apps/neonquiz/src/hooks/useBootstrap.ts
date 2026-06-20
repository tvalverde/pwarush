import { useEffect, useState } from 'react';
import { db, SESSION_ID } from '../db/database';
import { loadUsedIds } from '../db/questionUsage';
import { loadQuestionBank } from '../db/seed';
import { useGameStore } from '../store/gameStore';

/**
 * Seeds the question bank on first launch, loads it (with persisted question usage) into the
 * store, and resumes a previously saved session if one exists. Returns true once ready.
 */
export const useBootstrap = (): boolean => {
	const [ready, setReady] = useState(false);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const bank = await loadQuestionBank();
				if (cancelled) return;

				const [saved, usedIds] = await Promise.all([db.gameSession.get(SESSION_ID), loadUsedIds()]);
				if (cancelled) return;

				if (saved && saved.players.length >= 2) {
					useGameStore.getState().hydrate(saved, bank, usedIds);
				} else {
					useGameStore.getState().loadBank(bank, usedIds);
				}
			} catch (err) {
				console.error('Bootstrap failed:', err);
			} finally {
				if (!cancelled) setReady(true);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	return ready;
};
