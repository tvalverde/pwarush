import { Button } from '@pwarush/core/ui';
import { ArrowLeft, RefreshCw, Trash2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { wipeAllData } from '../db/maintenance';
import { clearProfiles, deleteProfile, getProfiles } from '../db/profiles';
import { clearUsedIds } from '../db/questionUsage';
import { useGameStore } from '../store/gameStore';
import type { PlayerProfile } from '../types';
import ShapeGlyph from './board/ShapeGlyph';
import ConfirmOverlay from './ConfirmOverlay';

interface SettingsScreenProps {
	onClose: () => void;
}

type Pending = 'questions' | 'app' | 'profiles';

/** Lobby settings: reset the question-usage log, manage saved player profiles, or factory-reset the whole app. */
const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
	const resetQuestionUsage = useGameStore((s) => s.resetQuestionUsage);
	const resetApp = useGameStore((s) => s.resetApp);
	const soundEnabled = useGameStore((s) => s.soundEnabled);
	const setSoundEnabled = useGameStore((s) => s.setSoundEnabled);
	const t = useGameStore((s) => s.t);
	const [pending, setPending] = useState<Pending | null>(null);
	const [profiles, setProfiles] = useState<PlayerProfile[]>([]);

	useEffect(() => {
		let cancelled = false;
		getProfiles().then((loaded) => {
			if (!cancelled) setProfiles(loaded);
		});
		return () => {
			cancelled = true;
		};
	}, []);

	const handleDeleteProfile = async (id?: number) => {
		if (id == null) return;
		await deleteProfile(id);
		setProfiles(await getProfiles());
	};

	const runPending = async () => {
		if (pending === 'questions') {
			await clearUsedIds();
			resetQuestionUsage();
		} else if (pending === 'profiles') {
			await clearProfiles();
			setProfiles([]);
		} else if (pending === 'app') {
			await wipeAllData();
			resetApp();
		}
		setPending(null);
		if (pending !== 'profiles') onClose();
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
				<div className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-low p-4">
					<span className="font-hanken text-sm font-bold text-on-surface">
						{t('settings.sound')}
					</span>
					<button
						type="button"
						data-testid="toggle-sound"
						aria-pressed={soundEnabled}
						onClick={() => setSoundEnabled(!soundEnabled)}
						className={`rounded-full border px-4 py-1.5 font-hanken text-xs font-bold uppercase tracking-wide-premium ${
							soundEnabled
								? 'border-primary bg-primary-container text-on-surface'
								: 'border-outline-variant bg-surface-container text-on-surface-variant'
						}`}
					>
						{soundEnabled ? t('settings.sound_on') : t('settings.sound_off')}
					</button>
				</div>

				<div className="flex flex-col gap-2 rounded-lg border border-outline-variant bg-surface-container-low p-4">
					<span className="font-hanken text-sm font-bold text-on-surface">
						{t('settings.profiles_title')}
					</span>
					{profiles.length === 0 && (
						<p className="font-sans text-xs text-on-surface-variant">
							{t('settings.profiles_empty')}
						</p>
					)}
					{profiles.length > 0 && (
						<ul className="flex flex-col gap-2" data-testid="settings-profiles">
							{profiles.map((profile) => (
								<li
									key={profile.id}
									className="flex items-center justify-between rounded-full border border-outline-variant bg-surface-container px-3 py-2"
								>
									<span className="flex items-center gap-2">
										<ShapeGlyph shape={profile.shape} size={18} color={profile.accentColor} />
										<span className="font-hanken text-xs font-bold text-on-surface">
											{profile.name}
										</span>
									</span>
									<button
										type="button"
										aria-label={t('settings.delete_profile')}
										data-testid={`delete-profile-${profile.id}`}
										onClick={() => handleDeleteProfile(profile.id)}
										className="text-on-surface-variant hover:text-error"
									>
										<Trash2 className="h-3.5 w-3.5" />
									</button>
								</li>
							))}
						</ul>
					)}
					{profiles.length > 0 && (
						<button
							type="button"
							data-testid="clear-profiles"
							onClick={() => setPending('profiles')}
							className="flex items-center gap-2 self-start font-hanken text-xs font-bold uppercase tracking-wide-premium text-error hover:underline"
						>
							<Trash2 className="h-3.5 w-3.5" />
							{t('settings.clear_profiles')}
						</button>
					)}
				</div>

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
							: pending === 'profiles'
								? t('settings.clear_profiles_confirm')
								: t('settings.reset_app_confirm')
					}
					danger={pending === 'app' || pending === 'profiles'}
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
