import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Info } from 'lucide-react';
import type React from 'react';
import { useGameStore } from '../store/gameStore';

const RulesScreen: React.FC = () => {
	const { setScreen, t } = useGameStore();

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			className="flex flex-col h-full bg-white overflow-hidden"
		>
			{/* Header */}
			<header className="sticky top-0 w-full z-50 bg-white border-b border-border flex justify-between items-center h-16 px-5">
				<button
					type="button"
					data-testid="rules-back"
					onClick={() => setScreen('main')}
					className="p-2 -ml-2 hover:bg-subtle-bg rounded-full transition-colors text-primary-text"
				>
					<ArrowLeft className="w-6 h-6" />
				</button>
				<h1 className="font-hanken text-lg font-bold text-primary-text tracking-widest-premium uppercase">
					{t('rules.title')}
				</h1>
				<div className="w-10"></div>
			</header>

			{/* Content */}
			<main className="flex-1 overflow-y-auto px-5 py-8 flex flex-col gap-8 pb-32">
				<section className="space-y-4">
					<div className="flex items-center gap-2 text-primary-text">
						<BookOpen className="w-6 h-6" />
						<h2 className="font-hanken text-lg font-bold uppercase tracking-wide-premium">
							{t('rules.basic_rules_title')}
						</h2>
					</div>
					<p className="font-sans text-sm text-secondary leading-relaxed">
						{t('rules.basic_rules_text')}
					</p>
				</section>

				<section className="space-y-4">
					<div className="flex items-center gap-2 text-primary-text">
						<Info className="w-6 h-6" />
						<h2 className="font-hanken text-lg font-bold uppercase tracking-wide-premium">
							{t('rules.techniques_title')}
						</h2>
					</div>
					<div className="space-y-4">
						<article className="border-l-2 border-primary-text pl-4">
							<h3 className="font-hanken text-sm font-bold text-primary-text uppercase">
								{t('rules.naked_pairs')}
							</h3>
							<p className="font-sans text-xs text-secondary mt-1">{t('rules.naked_pairs_text')}</p>
						</article>
						<article className="border-l-2 border-primary-text pl-4">
							<h3 className="font-hanken text-sm font-bold text-primary-text uppercase">
								{t('rules.x_wing')}
							</h3>
							<p className="font-sans text-xs text-secondary mt-1">{t('rules.x_wing_text')}</p>
						</article>
						<article className="border-l-2 border-primary-text pl-4">
							<h3 className="font-hanken text-sm font-bold text-primary-text uppercase">
								{t('rules.hidden_singles')}
							</h3>
							<p className="font-sans text-xs text-secondary mt-1">
								{t('rules.hidden_singles_text')}
							</p>
						</article>
					</div>
				</section>

				<section className="bg-subtle-bg p-6 rounded-DEFAULT border border-border">
					<h3 className="font-hanken text-sm font-bold text-primary-text uppercase mb-2">
						{t('rules.scoring_title')}
					</h3>
					<ul className="font-sans text-xs text-secondary space-y-2 list-disc pl-4">
						<li>{t('rules.scoring_base')}</li>
						<li>{t('rules.scoring_time')}</li>
						<li>{t('rules.scoring_mistakes')}</li>
						<li>{t('rules.scoring_hints')}</li>
						<li>{t('rules.scoring_min')}</li>
					</ul>
				</section>
			</main>
		</motion.div>
	);
};

export default RulesScreen;
