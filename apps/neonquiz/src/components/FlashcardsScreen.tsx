import { Button } from '@pwarush/core/ui';
import { ArrowLeft, Trash2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { clearFailedQuestions, getFailedQuestions } from '../db/failedQuestions';
import { useGameStore } from '../store/gameStore';
import type { Question } from '../types';
import { categoryColor } from '../utils/categories';

interface FlashcardsScreenProps {
	onClose: () => void;
}

/** Review of the globally logged failed questions, each with its correct answer revealed. */
const FlashcardsScreen: React.FC<FlashcardsScreenProps> = ({ onClose }) => {
	const t = useGameStore((s) => s.t);
	const [cards, setCards] = useState<Question[] | null>(null);

	useEffect(() => {
		let cancelled = false;
		getFailedQuestions().then((q) => {
			if (!cancelled) setCards(q);
		});
		return () => {
			cancelled = true;
		};
	}, []);

	const handleClear = async () => {
		await clearFailedQuestions();
		setCards([]);
	};

	return (
		<div data-testid="flashcards-screen" className="absolute inset-0 z-30 flex flex-col bg-surface">
			<header className="flex items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-4 py-4">
				<button
					type="button"
					aria-label={t('flashcards.back')}
					onClick={onClose}
					className="flex items-center gap-1 font-hanken text-sm text-on-surface-variant hover:text-on-surface"
				>
					<ArrowLeft className="h-4 w-4" />
				</button>
				<h2 className="font-display text-lg font-bold uppercase tracking-widest-premium text-primary">
					{t('flashcards.title')}
				</h2>
				<button
					type="button"
					aria-label={t('flashcards.clear')}
					onClick={handleClear}
					disabled={!cards || cards.length === 0}
					className="text-on-surface-variant hover:text-error disabled:opacity-30"
				>
					<Trash2 className="h-4 w-4" />
				</button>
			</header>

			<main className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-6">
				{cards && cards.length === 0 && (
					<p className="mt-10 text-center font-hanken text-sm text-on-surface-variant">
						{t('flashcards.empty')}
					</p>
				)}
				{cards?.map((card) => {
					const color = categoryColor(card.category);
					const correct = [card.option0, card.option1, card.option2, card.option3][
						card.correctAnswerIndex
					];
					return (
						<div
							key={card.id ?? card.questionText}
							className="flex flex-col gap-2 rounded-lg border-l-4 bg-surface-container-low p-4"
							style={{ borderColor: color }}
						>
							<span
								className="font-display text-[9px] font-bold uppercase tracking-widest-premium"
								style={{ color }}
							>
								{t(`categories.${card.category}`)}
							</span>
							<p className="font-hanken text-sm font-bold text-on-surface">{card.questionText}</p>
							<p className="font-sans text-sm text-success">
								<span className="text-on-surface-variant">{t('flashcards.answer')}: </span>
								{correct}
							</p>
						</div>
					);
				})}
			</main>

			<div className="border-t border-outline-variant bg-surface-container-lowest p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
				<Button variant="secondary" size="lg" className="w-full uppercase" onClick={onClose}>
					{t('flashcards.back')}
				</Button>
			</div>
		</div>
	);
};

export default FlashcardsScreen;
