import { Button } from '@pwarush/core/ui';
import { ArrowLeft, RefreshCw, Trash2 } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { wipeAllData } from '../db/maintenance';
import { clearUsedIds } from '../db/questionUsage';
import { useGameStore } from '../store/gameStore';
import ConfirmOverlay from './ConfirmOverlay';

interface SettingsScreenProps {
	onClose: () => void;
}

type Pending = 'questions' | 'app';

/** Lobby settings: reset the question-usage log, or factory-reset the whole app. */
const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
	const resetQuestionUsage = useGameStore((s) => s.resetQuestionUsage);
	const resetApp = useGameStore((s) => s.resetApp);
	const t = useGameStore((s) => s.t);
	const [pending, setPending] = useState<Pending | null>(null);

	const runPending = async () => {
		if (pending === 'questions') {
			await clearUsedIds();
			resetQuestionUsage();
		} else if (pending === 'app') {
			await wipeAllData();
			resetApp();
		}
		setPending(null);
		onClose();
	};

	return (
		<div data-testid="settings-screen" className="absolute inset-0 z-30 flex flex-col bg-surface">
			<header className="flex items-center gap-3 border-b border-outline-variant bg-surface-container-lowest px-4 py-4">
				<button
					type="button"
					aria-label={t('menu.close')}
					data-testid="settings-back"
					onClick={onClose}
					className="text-on-surface-variant hover:text-on-surface"
				>
					<ArrowLeft className="h-4 w-4" />
				</button>
				<h2 className="font-display text-lg font-bold uppercase tracking-widest-premium text-primary">
					{t('settings.title')}
				</h2>
			</header>

			<main className="flex flex-1 flex-col gap-3 px-5 py-6">
				<button
					type="button"
					data-testid="reset-questions"
					onClick={() => setPending('questions')}
					className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-4 text-left hover:border-primary"
				>
					<RefreshCw className="h-5 w-5 text-primary" />
					<span className="flex flex-col">
						<span className="font-hanken text-sm font-bold text-on-surface">
							{t('settings.reset_questions')}
						</span>
						<span className="font-sans text-xs text-on-surface-variant">
							{t('settings.reset_questions_desc')}
						</span>
					</span>
				</button>

				<button
					type="button"
					data-testid="reset-app"
					onClick={() => setPending('app')}
					className="flex items-center gap-3 rounded-lg border border-error/40 bg-surface-container-low p-4 text-left hover:border-error"
				>
					<Trash2 className="h-5 w-5 text-error" />
					<span className="flex flex-col">
						<span className="font-hanken text-sm font-bold text-error">
							{t('settings.reset_app')}
						</span>
						<span className="font-sans text-xs text-on-surface-variant">
							{t('settings.reset_app_desc')}
						</span>
					</span>
				</button>
			</main>

			{pending && (
				<ConfirmOverlay
					title={t('settings.title')}
					message={
						pending === 'questions'
							? t('settings.reset_questions_confirm')
							: t('settings.reset_app_confirm')
					}
					danger={pending === 'app'}
					confirmText={t('common.confirm')}
					cancelText={t('common.cancel')}
					onConfirm={runPending}
					onCancel={() => setPending(null)}
				/>
			)}

			<div className="border-t border-outline-variant bg-surface-container-lowest p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
				<Button variant="secondary" size="lg" className="w-full uppercase" onClick={onClose}>
					{t('menu.close')}
				</Button>
			</div>
		</div>
	);
};

export default SettingsScreen;
