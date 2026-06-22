import { Button } from '@pwarush/core/ui';
import { ArrowLeft, Trash2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { clearFailedQuestions, getFailedQuestions } from '../db/failedQuestions';
import { useTap } from '../hooks/useHaptics';
import { useGameStore } from '../store/gameStore';
import type { Question } from '../types';
import QuestionCardBrowser from './QuestionCardBrowser';

interface FlashcardsScreenProps {
	onClose: () => void;
}

/** Review of the globally logged failed questions, each with its correct answer revealed. */
const FlashcardsScreen: React.FC<FlashcardsScreenProps> = ({ onClose }) => {
	const t = useGameStore((s) => s.t);
	const tap = useTap();
	const [cards, setCards] = useState<Question[] | null>(null);
	// Player-centric audience filter: "kid" shows kid-eligible questions (KID + BOTH), "adult"
	// shows adult-eligible ones (ADULT + BOTH). No "both" chip here — a player reviews as one role.
	const [audience, setAudience] = useState<'ALL' | 'KID' | 'ADULT'>('ALL');

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
		tap();
		await clearFailedQuestions();
		setCards([]);
	};

	const handleClose = () => {
		tap();
		onClose();
	};

	const shown = (cards ?? []).filter((card) =>
		audience === 'ALL'
			? true
			: audience === 'KID'
				? card.targetAudience !== 'ADULT'
				: card.targetAudience !== 'KID',
	);

	return (
		<div data-testid="flashcards-screen" className="absolute inset-0 z-30 flex flex-col bg-surface">
			<header className="flex items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-4 py-4">
				<button
					type="button"
					aria-label={t('flashcards.back')}
					onClick={handleClose}
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

			{cards && cards.length > 0 && (
				<div
					className="flex flex-wrap gap-2 border-b border-outline-variant px-4 py-3"
					data-testid="repaso-audience-filter"
				>
					{(['ALL', 'KID', 'ADULT'] as const).map((option) => (
						<button
							type="button"
							key={option}
							data-testid={`rfilter-${option}`}
							onClick={() => {
								tap();
								setAudience(option);
							}}
							className={`rounded-full border px-3 py-1.5 font-hanken text-[11px] font-bold uppercase tracking-wide-premium transition-colors ${
								audience === option
									? 'border-primary bg-primary-container text-on-surface'
									: 'border-outline-variant bg-surface-container text-on-surface-variant'
							}`}
						>
							{t(
								option === 'ALL'
									? 'manage.all'
									: option === 'KID'
										? 'audience.kid'
										: 'audience.adult',
							)}
						</button>
					))}
				</div>
			)}

			<main className="flex flex-1 flex-col overflow-y-auto">
				{cards && shown.length === 0 && (
					<p className="mt-10 text-center font-hanken text-sm text-on-surface-variant">
						{t('flashcards.empty')}
					</p>
				)}
				{shown.length > 0 && <QuestionCardBrowser key={audience} questions={shown} interactive />}
			</main>

			<div className="border-t border-outline-variant bg-surface-container-lowest p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
				<Button variant="secondary" size="lg" className="w-full uppercase" onClick={handleClose}>
					{t('flashcards.back')}
				</Button>
			</div>
		</div>
	);
};

export default FlashcardsScreen;
