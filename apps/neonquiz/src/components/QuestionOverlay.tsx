import { BoardOverlay, Button } from '@pwarush/core/ui';
import type React from 'react';
import { useGameStore } from '../store/gameStore';
import { categoryColor } from '../utils/categories';

const QuestionOverlay: React.FC = () => {
	const phase = useGameStore((s) => s.phase);
	const question = useGameStore((s) => s.activeQuestion);
	const outcome = useGameStore((s) => s.lastOutcome);
	const hiddenOptions = useGameStore((s) => s.hiddenOptions);
	const lockedOptions = useGameStore((s) => s.lockedOptions);
	const player = useGameStore((s) => s.players[s.currentPlayerIndex]);
	const answerQuestion = useGameStore((s) => s.answerQuestion);
	const continueAfterFeedback = useGameStore((s) => s.continueAfterFeedback);
	const useFiftyFifty = useGameStore((s) => s.useFiftyFifty);
	const useChange = useGameStore((s) => s.useChange);
	const useSecondChance = useGameStore((s) => s.useSecondChance);
	const revealAnswer = useGameStore((s) => s.revealAnswer);
	const answerRevealed = useGameStore((s) => s.answerRevealed);
	const isConclave = useGameStore((s) => s.isConclave);
	const t = useGameStore((s) => s.t);

	if (!question) return null;

	const color = categoryColor(question.category);
	const options = [question.option0, question.option1, question.option2, question.option3];
	const isFeedback = phase === 'FEEDBACK';
	const wrongFeedback = isFeedback && outcome !== null && !outcome.correct;
	const used = player?.usedWildcards;
	// While a 2nd chance is still on offer we must NOT reveal the correct answer; the
	// player either takes the retry or reveals it deliberately ("show answer").
	const retryOffered =
		wrongFeedback && !isConclave && !!used && !used.secondChance && !answerRevealed;

	const optionClass = (index: number): string => {
		if (!isFeedback) {
			if (lockedOptions.includes(index)) {
				return 'border-outline-variant bg-surface-container text-on-surface-variant opacity-40';
			}
			return 'border-outline-variant bg-surface-container-high text-on-surface hover:border-primary';
		}
		if (retryOffered) {
			// Only mark the failed pick; keep the correct answer hidden until the retry is resolved.
			if (index === outcome?.selectedIndex)
				return 'border-error bg-error-container text-on-error-container';
			return 'border-outline-variant bg-surface-container text-on-surface-variant opacity-60';
		}
		if (index === question.correctAnswerIndex)
			return 'border-success bg-success-container text-on-success-container';
		if (index === outcome?.selectedIndex)
			return 'border-error bg-error-container text-on-error-container';
		return 'border-outline-variant bg-surface-container text-on-surface-variant opacity-60';
	};

	const visibleOptions = options
		.map((label, index) => ({ label, index }))
		.filter(({ index }) => !hiddenOptions.includes(index));

	return (
		<BoardOverlay
			data-testid="question-overlay"
			className="z-20 bg-surface/85 p-5 backdrop-blur-sm"
		>
			<div
				className="flex w-full max-w-sm flex-col gap-4 rounded-lg border-2 bg-surface-container-low p-5"
				style={{ borderColor: color }}
			>
				<span
					className="font-display text-[10px] font-bold uppercase tracking-widest-premium"
					style={{ color }}
				>
					{t(`categories.${question.category}`)}
				</span>
				<p className="font-hanken text-base font-bold text-on-surface">{question.questionText}</p>

				{!isConclave && used && (
					<div className="flex justify-center gap-2" data-testid="wildcard-bar">
						<button
							type="button"
							data-testid="wildcard-5050"
							disabled={isFeedback || used.fiftyFifty || hiddenOptions.length > 0}
							onClick={useFiftyFifty}
							className="rounded-full border border-tertiary px-3 py-1.5 font-hanken text-[11px] font-bold uppercase tracking-wide-premium text-tertiary disabled:opacity-35"
						>
							{t('wildcard.fifty_fifty')}
						</button>
						<button
							type="button"
							data-testid="wildcard-change"
							disabled={isFeedback || used.change}
							onClick={useChange}
							className="rounded-full border border-tertiary px-3 py-1.5 font-hanken text-[11px] font-bold uppercase tracking-wide-premium text-tertiary disabled:opacity-35"
						>
							{t('wildcard.change')}
						</button>
					</div>
				)}

				<div className="flex flex-col gap-2">
					{visibleOptions.map(({ label, index }) => (
						<button
							type="button"
							key={label}
							disabled={isFeedback || lockedOptions.includes(index)}
							data-testid={`answer-${index}`}
							onClick={() => answerQuestion(index)}
							className={`rounded-full border px-4 py-3 text-left font-sans text-sm transition-colors ${optionClass(index)}`}
						>
							{label}
						</button>
					))}
				</div>

				{isFeedback && outcome && (
					<div className="flex flex-col items-center gap-3 pt-1">
						<p
							className={`font-display text-sm font-bold uppercase tracking-wide-premium ${
								outcome.correct ? 'text-success' : 'text-error'
							}`}
						>
							{outcome.correct ? t('question.correct') : t('question.wrong')}
						</p>
						{outcome.collectedSpark && (
							<p className="font-hanken text-xs uppercase tracking-wide-premium text-tertiary">
								{t('question.spark_collected')}
							</p>
						)}
						{retryOffered ? (
							<div className="flex gap-2">
								<Button
									variant="primary"
									size="md"
									className="uppercase"
									data-testid="use-second-chance"
									onClick={useSecondChance}
								>
									{t('wildcard.second_chance')}
								</Button>
								<Button
									variant="secondary"
									size="md"
									className="uppercase"
									data-testid="reveal-answer"
									onClick={revealAnswer}
								>
									{t('question.show_answer')}
								</Button>
							</div>
						) : (
							<Button
								variant="primary"
								size="md"
								className="uppercase"
								data-testid="continue-feedback"
								onClick={continueAfterFeedback}
							>
								{outcome.correct
									? t(isConclave ? 'question.claim_victory' : 'question.roll_again')
									: t('question.next_player')}
							</Button>
						)}
					</div>
				)}
			</div>
		</BoardOverlay>
	);
};

export default QuestionOverlay;
