import type React from 'react';
import type { Scene } from '../engine/types';
import { useGameStore } from '../store/gameStore';
import { renderClue } from '../utils/renderClue';
import Portrait from './board/Portrait';

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

	// Group each clue (kept at its original index for test hooks + check state) under
	// the suspect who narrates it, in cast order; the victim never narrates.
	const groups = activeCase.people
		.filter((person) => person.id !== activeCase.victimId)
		.map((person) => ({
			person,
			indices: activeCase.clues
				.map((_, index) => index)
				.filter((index) => activeCase.narrators[index] === person.id),
		}))
		.filter((group) => group.indices.length > 0);

	return (
		<section className="flex flex-col gap-3">
			<h3 className="font-display text-xs font-bold uppercase tracking-widest-premium text-secondary">
				{t('game.clues')}
			</h3>
			<div className="flex flex-col gap-4">
				{groups.map(({ person, indices }) => (
					<div key={person.id} className="flex gap-3">
						<span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-outline-variant bg-surface-container text-on-surface">
							<Portrait personId={person.id} gender={person.gender} className="h-full w-full" />
						</span>
						<div className="flex min-w-0 flex-1 flex-col gap-1">
							<span className="font-display text-xs font-bold uppercase tracking-wide-premium text-secondary">
								{person.name}
							</span>
							<ul className="flex flex-col gap-2">
								{indices.map((index) => {
									const checked = checkedClues.includes(index);
									return (
										<li key={index}>
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
												{renderClue(activeCase.clues[index], scene, t, language)}
											</button>
										</li>
									);
								})}
							</ul>
						</div>
					</div>
				))}
			</div>
		</section>
	);
};

export default CluePanel;
