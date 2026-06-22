import { useEffect, useState } from 'react';
import { applyAudienceOverrides, getAudienceOverrides } from '../db/questionOverrides';
import { loadUsedIds } from '../db/questionUsage';
import { loadQuestionBank } from '../db/seed';
import { useGameStore } from '../store/gameStore';

/**
 * Seeds the question bank on first launch and loads it (with persisted question usage and audience
 * overrides) into the store. Always lands on the lobby; a previously saved game is offered there
 * via the "Resume" card rather than re-entered automatically. Returns true once ready.
 */
export const useBootstrap = (): boolean => {
	const [ready, setReady] = useState(false);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const rawBank = await loadQuestionBank();
				if (cancelled) return;

				const [usedIds, overrides] = await Promise.all([loadUsedIds(), getAudienceOverrides()]);
				if (cancelled) return;

				const bank = applyAudienceOverrides(rawBank, overrides);
				useGameStore.getState().loadBank(bank, usedIds);
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
