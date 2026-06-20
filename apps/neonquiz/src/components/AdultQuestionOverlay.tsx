import { BoardOverlay, Button } from '@pwarush/core/ui';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { categoryColor } from '../utils/categories';

const TIMER_SECONDS = 30;

/**
 * ADULT question flow: read the question against a 30s clock, reveal the correct answer,
 * then self-grade. Running out of time before revealing counts as a failure. The timer lives
 * here in an effect (rule 16), never in the store.
 */
const AdultQuestionOverlay: React.FC = () => {
	const phase = useGameStore((s) => s.phase);
	const question = useGameStore((s) => s.activeQuestion);
	const outcome = useGameStore((s) => s.lastOutcome);
	const answerRevealed = useGameStore((s) => s.answerRevealed);
	const revealAdultAnswer = useGameStore((s) => s.revealAdultAnswer);
	const gradeAdultAnswer = useGameStore((s) => s.gradeAdultAnswer);
	const continueAfterFeedback = useGameStore((s) => s.continueAfterFeedback);
	const isConclave = useGameStore((s) => s.isConclave);
	const t = useGameStore((s) => s.t);

	const isFeedback = phase === 'FEEDBACK';
	const isReading =
		(phase === 'QUESTION_ACTIVE' || phase === 'CONCLAVE_QUESTION') && !answerRevealed;
	const isGrading =
		(phase === 'QUESTION_ACTIVE' || phase === 'CONCLAVE_QUESTION') && answerRevealed;

	const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);

	useEffect(() => {
		if (!isReading) return;
		setTimeLeft(TIMER_SECONDS);
		const start = Date.now();
		const id = setInterval(() => {
			const left = TIMER_SECONDS - Math.floor((Date.now() - start) / 1000);
			if (left <= 0) {
				clearInterval(id);
				setTimeLeft(0);
				gradeAdultAnswer(false); // time out → automatic fail
			} else {
				setTimeLeft(left);
			}
		}, 250);
		return () => clearInterval(id);
		// isReading toggles false→true on every new question, so the timer resets per question.
	}, [isReading, gradeAdultAnswer]);

	if (!question) return null;

	const color = categoryColor(question.category);
	const correctAnswer = [question.option0, question.option1, question.option2, question.option3][
		question.correctAnswerIndex
	];

	return (
		<BoardOverlay
			data-testid="adult-question-overlay"
			className="z-20 bg-surface/85 p-5 backdrop-blur-sm"
		>
			<div
				className="flex w-full max-w-sm flex-col gap-4 rounded-lg border-2 bg-surface-container-low p-5"
				style={{ borderColor: color }}
			>
				<div className="flex items-center justify-between">
					<span
						className="font-display text-[10px] font-bold uppercase tracking-widest-premium"
						style={{ color }}
					>
						{t(`categories.${question.category}`)}
					</span>
					{isReading && (
						<span
							data-testid="adult-timer"
							className={`font-display text-sm font-bold tabular-nums ${
								timeLeft <= 5 ? 'text-error' : 'text-on-surface-variant'
							}`}
						>
							{timeLeft}s
						</span>
					)}
				</div>

				<p className="font-hanken text-base font-bold text-on-surface">{question.questionText}</p>

				{(isGrading || isFeedback) && (
					<p
						className="rounded-md border px-4 py-3 font-sans text-sm text-on-surface"
						style={{ borderColor: color }}
					>
						<span className="text-on-surface-variant">{t('adult.answer')}: </span>
						{correctAnswer}
					</p>
				)}

				{isReading && (
					<Button
						variant="primary"
						size="md"
						className="uppercase"
						data-testid="adult-reveal"
						onClick={revealAdultAnswer}
					>
						{t('adult.reveal')}
					</Button>
				)}

				{isGrading && (
					<div className="flex gap-2">
						<Button
							variant="primary"
							size="md"
							className="flex-1 uppercase"
							data-testid="adult-correct"
							onClick={() => gradeAdultAnswer(true)}
						>
							{t('adult.i_was_right')}
						</Button>
						<Button
							variant="secondary"
							size="md"
							className="flex-1 uppercase"
							data-testid="adult-failed"
							onClick={() => gradeAdultAnswer(false)}
						>
							{t('adult.i_failed')}
						</Button>
					</div>
				)}

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
							{outcome.correct
								? t(isConclave ? 'question.claim_victory' : 'question.roll_again')
								: t('question.next_player')}
						</Button>
					</div>
				)}
			</div>
		</BoardOverlay>
	);
};

export default AdultQuestionOverlay;
