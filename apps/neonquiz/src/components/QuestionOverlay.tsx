import { BoardOverlay, Button } from '@pwarush/core/ui';
import type React from 'react';
import { useGameStore } from '../store/gameStore';
import { categoryColor } from '../utils/categories';

const QuestionOverlay: React.FC = () => {
	const phase = useGameStore((s) => s.phase);
	const question = useGameStore((s) => s.activeQuestion);
	const outcome = useGameStore((s) => s.lastOutcome);
	const answerQuestion = useGameStore((s) => s.answerQuestion);
	const continueAfterFeedback = useGameStore((s) => s.continueAfterFeedback);
	const t = useGameStore((s) => s.t);

	if (!question) return null;

	const color = categoryColor(question.category);
	const options = [question.option0, question.option1, question.option2, question.option3];
	const isFeedback = phase === 'FEEDBACK';

	const optionClass = (index: number): string => {
		if (!isFeedback) {
			return 'border-outline-variant bg-surface-container-high text-on-surface hover:border-primary';
		}
		if (index === question.correctAnswerIndex)
			return 'border-success bg-success-container text-on-success-container';
		if (index === outcome?.selectedIndex)
			return 'border-error bg-error-container text-on-error-container';
		return 'border-outline-variant bg-surface-container text-on-surface-variant opacity-60';
	};

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

				<div className="flex flex-col gap-2">
					{options.map((option, index) => (
						<button
							type="button"
							key={option}
							disabled={isFeedback}
							data-testid={`answer-${index}`}
							onClick={() => answerQuestion(index)}
							className={`rounded-full border px-4 py-3 text-left font-sans text-sm transition-colors ${optionClass(index)}`}
						>
							{option}
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
						<Button
							variant="primary"
							size="md"
							className="uppercase"
							data-testid="continue-feedback"
							onClick={continueAfterFeedback}
						>
							{outcome.correct ? t('question.roll_again') : t('question.next_player')}
						</Button>
					</div>
				)}
			</div>
		</BoardOverlay>
	);
};

export default QuestionOverlay;
