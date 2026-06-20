import type React from 'react';
import { useGameStore } from '../store/gameStore';
import { CATEGORIES } from '../types';
import { categoryColor } from '../utils/categories';

/** Conclave step 1: the rivals collectively pick the challenger's final-question category. */
const ConclaveVoteScreen: React.FC = () => {
	const voteConclaveCategory = useGameStore((s) => s.voteConclaveCategory);
	const t = useGameStore((s) => s.t);

	return (
		<div
			data-testid="conclave-vote"
			className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-surface px-6 text-center"
		>
			<div className="flex flex-col items-center gap-1">
				<h2 className="font-display text-2xl font-bold uppercase tracking-widest-premium text-tertiary">
					{t('conclave.vote_title')}
				</h2>
				<p className="font-hanken text-xs uppercase tracking-wide-premium text-on-surface-variant">
					{t('conclave.vote_subtitle')}
				</p>
			</div>

			<div className="grid w-full max-w-sm grid-cols-2 gap-3">
				{CATEGORIES.map((category) => {
					const color = categoryColor(category);
					return (
						<button
							type="button"
							key={category}
							data-testid={`vote-${category}`}
							onClick={() => voteConclaveCategory(category)}
							className="rounded-full border-2 bg-surface-container-high px-4 py-3 font-hanken text-sm font-bold text-on-surface transition-transform active:scale-[0.98]"
							style={{ borderColor: color, color }}
						>
							{t(`categories.${category}`)}
						</button>
					);
				})}
			</div>
		</div>
	);
};

export default ConclaveVoteScreen;
