import { Button } from '@pwarush/core/ui';
import { ArrowLeft } from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { setAudienceOverride } from '../db/questionOverrides';
import { useTap } from '../hooks/useHaptics';
import { useGameStore } from '../store/gameStore';
import { CATEGORIES, type Question, type TargetAudience, type TriviaCategory } from '../types';
import { categoryColor } from '../utils/categories';
import { questionKey } from '../utils/questionKey';
import QuestionCardBrowser from './QuestionCardBrowser';

interface QuestionAudienceManagerScreenProps {
	onClose: () => void;
}

const AUDIENCES: TargetAudience[] = ['KID', 'BOTH', 'ADULT'];
const AUDIENCE_KEY: Record<TargetAudience, string> = {
	KID: 'audience.kid',
	ADULT: 'audience.adult',
	BOTH: 'audience.both',
};

/**
 * Lets the player review the questions that have already appeared in matches and reroute any of
 * them between Kids / Both / Adults. A too-hard kids' question can be demoted to adults-only; the
 * change persists (content-keyed override) and takes effect immediately in the live bank.
 */
const QuestionAudienceManagerScreen: React.FC<QuestionAudienceManagerScreenProps> = ({
	onClose,
}) => {
	const t = useGameStore((s) => s.t);
	const bank = useGameStore((s) => s.bank);
	const usedQuestionIds = useGameStore((s) => s.usedQuestionIds);
	const setQuestionAudience = useGameStore((s) => s.setQuestionAudience);
	const tap = useTap();
	const [category, setCategory] = useState<TriviaCategory | 'ALL'>('ALL');
	const [audience, setAudience] = useState<TargetAudience | 'ALL'>('ALL');

	const appeared = useMemo(() => {
		const used = new Set(usedQuestionIds);
		return bank.filter(
			(q) =>
				q.id != null &&
				used.has(q.id) &&
				(category === 'ALL' || q.category === category) &&
				(audience === 'ALL' || q.targetAudience === audience),
		);
	}, [bank, usedQuestionIds, category, audience]);

	const reassign = async (question: Question, audience: TargetAudience) => {
		tap();
		if (question.targetAudience === audience) return;
		setQuestionAudience(question, audience);
		await setAudienceOverride(questionKey(question), audience);
	};

	const handleClose = () => {
		tap();
		onClose();
	};

	const renderAudienceControl = (question: Question): React.ReactNode => (
		<div className="flex gap-2" data-testid="audience-control">
			{AUDIENCES.map((option) => {
				const selected = question.targetAudience === option;
				return (
					<button
						type="button"
						key={option}
						data-testid={`audience-${option}`}
						aria-pressed={selected}
						onClick={() => reassign(question, option)}
						className={`flex-1 rounded-full border px-3 py-2 font-hanken text-[11px] font-bold uppercase tracking-wide-premium transition-colors ${
							selected
								? 'border-primary bg-primary-container text-on-surface'
								: 'border-outline-variant bg-surface-container text-on-surface-variant'
						}`}
					>
						{t(AUDIENCE_KEY[option])}
					</button>
				);
			})}
		</div>
	);

	return (
		<div
			data-testid="audience-manager-screen"
			className="absolute inset-0 z-30 flex flex-col bg-surface"
		>
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
					{t('manage.title')}
				</h2>
				<span className="w-4" />
			</header>

			<div
				className="flex flex-wrap gap-2 border-b border-outline-variant px-4 py-3"
				data-testid="category-filter"
			>
				<button
					type="button"
					data-testid="filter-ALL"
					onClick={() => {
						tap();
						setCategory('ALL');
					}}
					className={`rounded-full border px-3 py-1.5 font-hanken text-[11px] font-bold uppercase tracking-wide-premium transition-colors ${
						category === 'ALL'
							? 'border-primary bg-primary-container text-on-surface'
							: 'border-outline-variant bg-surface-container text-on-surface-variant'
					}`}
				>
					{t('manage.all')}
				</button>
				{CATEGORIES.map((option) => {
					const selected = category === option;
					return (
						<button
							type="button"
							key={option}
							data-testid={`filter-${option}`}
							onClick={() => {
								tap();
								setCategory(option);
							}}
							className="rounded-full border px-3 py-1.5 font-hanken text-[11px] font-bold uppercase tracking-wide-premium transition-colors"
							style={{
								borderColor: selected ? categoryColor(option) : undefined,
								color: categoryColor(option),
								opacity: selected ? 1 : 0.55,
							}}
						>
							{t(`categories.${option}`)}
						</button>
					);
				})}
			</div>

			<div
				className="flex flex-wrap gap-2 border-b border-outline-variant px-4 py-3"
				data-testid="audience-filter"
			>
				<button
					type="button"
					data-testid="afilter-ALL"
					onClick={() => {
						tap();
						setAudience('ALL');
					}}
					className={`rounded-full border px-3 py-1.5 font-hanken text-[11px] font-bold uppercase tracking-wide-premium transition-colors ${
						audience === 'ALL'
							? 'border-primary bg-primary-container text-on-surface'
							: 'border-outline-variant bg-surface-container text-on-surface-variant'
					}`}
				>
					{t('manage.all')}
				</button>
				{AUDIENCES.map((option) => (
					<button
						type="button"
						key={option}
						data-testid={`afilter-${option}`}
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
						{t(AUDIENCE_KEY[option])}
					</button>
				))}
			</div>

			<main className="flex flex-1 flex-col overflow-y-auto">
				{appeared.length === 0 ? (
					<p className="mt-10 text-center font-hanken text-sm text-on-surface-variant">
						{t('manage.empty')}
					</p>
				) : (
					<QuestionCardBrowser
						key={`${category}-${audience}`}
						questions={appeared}
						footer={renderAudienceControl}
					/>
				)}
			</main>

			<div className="border-t border-outline-variant bg-surface-container-lowest p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
				<Button variant="secondary" size="lg" className="w-full uppercase" onClick={handleClose}>
					{t('flashcards.back')}
				</Button>
			</div>
		</div>
	);
};

export default QuestionAudienceManagerScreen;
