import { Button } from '@pwarush/core/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useTap } from '../hooks/useHaptics';
import { useGameStore } from '../store/gameStore';
import type { Question } from '../types';
import { categoryColor } from '../utils/categories';

interface QuestionCardBrowserProps {
	questions: Question[];
	/** Per-card footer slot, e.g. an audience control on the management screen. */
	footer?: (question: Question) => React.ReactNode;
	/**
	 * Active-recall mode for KID/BOTH cards (the Repaso): the options are tappable and the answer
	 * stays hidden until the player picks one. When false (the manager) the correct answer is shown
	 * up front so difficulty can be judged at a glance.
	 */
	interactive?: boolean;
}

/**
 * Paginated, one-card-at-a-time question viewer shared by the Review (Repaso) and the audience
 * manager. ADULT cards stay hidden behind a "reveal answer" button. KID/BOTH cards either let the
 * player pick (interactive) or show the correct option (manager). Scales to any number of cards
 * without an endless scroll. Callers that change the underlying set (e.g. a category filter)
 * should pass a `key` to remount and reset navigation.
 */
const QuestionCardBrowser: React.FC<QuestionCardBrowserProps> = ({
	questions,
	footer,
	interactive = false,
}) => {
	const t = useGameStore((s) => s.t);
	const tap = useTap();
	const [index, setIndex] = useState(0);
	const [revealed, setRevealed] = useState(false);
	const [picked, setPicked] = useState<number | null>(null);

	if (questions.length === 0) return null;

	const safeIndex = Math.min(index, questions.length - 1);
	const question = questions[safeIndex];
	const color = categoryColor(question.category);
	const options = [question.option0, question.option1, question.option2, question.option3];
	const correctAnswer = options[question.correctAnswerIndex];
	const isAdult = question.targetAudience === 'ADULT';

	// Navigation clears the per-card reveal/answer so each new card starts fresh for practice.
	const go = (delta: number) => {
		tap();
		setRevealed(false);
		setPicked(null);
		setIndex((i) =>
			Math.max(0, Math.min(questions.length - 1, Math.min(i, questions.length - 1) + delta)),
		);
	};

	// In practice mode, colour each option once the player has answered: the correct one turns
	// green, a wrong pick turns red, the rest dim. Before answering everything is neutral/tappable.
	const practiceOptionClass = (i: number): string => {
		if (picked === null) {
			return 'border-outline-variant bg-surface-container-high text-on-surface hover:border-primary';
		}
		if (i === question.correctAnswerIndex) {
			return 'border-success bg-success-container text-on-success-container';
		}
		if (i === picked) return 'border-error bg-error-container text-on-error-container';
		return 'border-outline-variant bg-surface-container text-on-surface-variant opacity-60';
	};

	return (
		<div data-testid="question-card-browser" className="flex flex-1 flex-col gap-4 px-5 py-6">
			<div
				data-testid="question-card"
				className="flex flex-1 flex-col gap-4 rounded-lg border-2 bg-surface-container-low p-5"
				style={{ borderColor: color }}
			>
				<span
					className="font-display text-[10px] font-bold uppercase tracking-widest-premium"
					style={{ color }}
				>
					{t(`categories.${question.category}`)}
				</span>
				<p className="font-hanken text-base font-bold text-on-surface">{question.questionText}</p>

				{isAdult ? (
					revealed ? (
						<p
							data-testid="card-answer"
							className="rounded-md border px-4 py-3 font-sans text-sm text-on-surface"
							style={{ borderColor: color }}
						>
							<span className="text-on-surface-variant">{t('adult.answer')}: </span>
							{correctAnswer}
						</p>
					) : (
						<Button
							variant="primary"
							size="md"
							className="uppercase"
							data-testid="card-reveal"
							onClick={() => {
								tap();
								setRevealed(true);
							}}
						>
							{t('review.reveal')}
						</Button>
					)
				) : interactive ? (
					<div className="flex flex-col gap-2">
						{options.map((label, i) => (
							<button
								type="button"
								key={label}
								data-testid={`card-option-${i}`}
								disabled={picked !== null}
								onClick={() => {
									tap();
									setPicked(i);
								}}
								className={`rounded-full border px-4 py-3 text-left font-sans text-sm transition-colors ${practiceOptionClass(i)}`}
							>
								{label}
							</button>
						))}
						{picked !== null && (
							<p
								data-testid="card-result"
								className={`pt-1 text-center font-display text-sm font-bold uppercase tracking-wide-premium ${
									picked === question.correctAnswerIndex ? 'text-success' : 'text-error'
								}`}
							>
								{t(picked === question.correctAnswerIndex ? 'question.correct' : 'question.wrong')}
							</p>
						)}
					</div>
				) : (
					<div className="flex flex-col gap-2">
						{options.map((label, i) => (
							<div
								key={label}
								data-testid={`card-option-${i}`}
								className={`rounded-full border px-4 py-3 text-left font-sans text-sm ${
									i === question.correctAnswerIndex
										? 'border-success bg-success-container text-on-success-container'
										: 'border-outline-variant bg-surface-container text-on-surface-variant'
								}`}
							>
								{label}
							</div>
						))}
					</div>
				)}

				{footer && <div className="mt-auto pt-2">{footer(question)}</div>}
			</div>

			<div className="flex items-center justify-between">
				<button
					type="button"
					aria-label={t('review.prev')}
					data-testid="card-prev"
					disabled={safeIndex === 0}
					onClick={() => go(-1)}
					className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant hover:text-primary disabled:opacity-30"
				>
					<ChevronLeft className="h-5 w-5" />
				</button>
				<span
					data-testid="card-counter"
					className="font-display text-sm font-bold tabular-nums text-on-surface-variant"
				>
					{safeIndex + 1} / {questions.length}
				</span>
				<button
					type="button"
					aria-label={t('review.next')}
					data-testid="card-next"
					disabled={safeIndex === questions.length - 1}
					onClick={() => go(1)}
					className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant hover:text-primary disabled:opacity-30"
				>
					<ChevronRight className="h-5 w-5" />
				</button>
			</div>
		</div>
	);
};

export default QuestionCardBrowser;
