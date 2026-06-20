import { useEffect, useState } from 'react';
import { db, SESSION_ID } from '../db/database';
import { loadQuestionBank } from '../db/seed';
import { useGameStore } from '../store/gameStore';

/**
 * Seeds the question bank on first launch, loads it into the question pool, and resumes
 * a previously saved session if one exists. Returns true once the app is ready to render.
 */
export const useBootstrap = (): boolean => {
	const [ready, setReady] = useState(false);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const bank = await loadQuestionBank();
				if (cancelled) return;

				const saved = await db.gameSession.get(SESSION_ID);
				if (cancelled) return;

				if (saved && saved.players.length >= 2) {
					useGameStore.getState().hydrate(saved, bank);
				} else {
					useGameStore.getState().loadBank(bank);
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
