import type React from 'react';
import type { Scene } from '../engine/types';
import { useGameStore } from '../store/gameStore';
import { renderClue } from '../utils/renderClue';

interface CluePanelProps {
	scene: Scene;
}

const CluePanel: React.FC<CluePanelProps> = ({ scene }) => {
	const activeCase = useGameStore((s) => s.activeCase);
	const checkedClues = useGameStore((s) => s.checkedClues);
	const toggleClueCheck = useGameStore((s) => s.toggleClueCheck);
	const language = useGameStore((s) => s.language);
	const t = useGameStore((s) => s.t);

	if (!activeCase) return null;

	return (
		<section className="flex flex-col gap-2">
			<h3 className="font-display text-xs font-bold uppercase tracking-widest-premium text-secondary">
				{t('game.clues')}
			</h3>
			<ul className="flex flex-col gap-2">
				{activeCase.clues.map((clue, index) => {
					const checked = checkedClues.includes(index);
					return (
						<li key={`${clue.type}-${index}`}>
							<button
								type="button"
								data-testid={`clue-${index}`}
								onClick={() => toggleClueCheck(index)}
								className={`w-full rounded-DEFAULT border border-outline-variant px-4 py-3 text-left font-display text-sm transition-colors ${
									checked
										? 'bg-surface-container text-secondary line-through'
										: 'bg-surface-container-lowest text-on-surface'
								}`}
							>
								{renderClue(clue, scene, t, language)}
							</button>
						</li>
					);
				})}
			</ul>
		</section>
	);
};

export default CluePanel;
