import { Button } from '@pwarush/core/ui';
import { BookOpen, Plus, Settings, Trophy, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { getProfiles, upsertProfile } from '../db/profiles';
import { type PlayerDraft, useGameStore } from '../store/gameStore';
import { PLAYER_SHAPES, type PlayerLevel, type PlayerProfile, type PlayerShape } from '../types';
import { PLAYER_ACCENTS, playerAccent } from '../utils/players';
import ShapeGlyph from './board/ShapeGlyph';
import FlashcardsScreen from './FlashcardsScreen';
import HistoryScreen from './HistoryScreen';
import SettingsScreen from './SettingsScreen';

const LEVELS: PlayerLevel[] = ['KID', 'ADULT'];

const MAX_PLAYERS = 6;
const MIN_PLAYERS = 2;

const SetupLobbyScreen: React.FC = () => {
	const startGame = useGameStore((s) => s.startGame);
	const t = useGameStore((s) => s.t);
	const [drafts, setDrafts] = useState<PlayerDraft[]>([]);
	const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
	const [name, setName] = useState('');
	const [level, setLevel] = useState<PlayerLevel>('KID');
	const [showFlashcards, setShowFlashcards] = useState(false);
	const [showHistory, setShowHistory] = useState(false);
	const [showSettings, setShowSettings] = useState(false);

	useEffect(() => {
		let cancelled = false;
		getProfiles().then((loaded) => {
			if (!cancelled) setProfiles(loaded);
		});
		return () => {
			cancelled = true;
		};
	}, []);

	const usedShapes = new Set(drafts.map((d) => d.shape));
	const availableShapes = PLAYER_SHAPES.filter((shape) => !usedShapes.has(shape));
	const [shape, setShape] = useState<PlayerShape>(PLAYER_SHAPES[0]);
	const activeShape = availableShapes.includes(shape) ? shape : availableShapes[0];

	const usedAccents = new Set(drafts.map((d, index) => d.accentColor ?? playerAccent(index)));
	const freeAccent = PLAYER_ACCENTS.find((accent) => !usedAccents.has(accent));

	const canAdd = drafts.length < MAX_PLAYERS && availableShapes.length > 0;
	const canStart = drafts.length >= MIN_PLAYERS;

	// Adding a player only builds a local draft — no profile is persisted yet, so adding then
	// removing someone before playing never leaves an orphan profile behind. Profiles for
	// brand-new players are created when the match actually starts (see `startMatch`).
	const addPlayer = () => {
		if (!canAdd || !activeShape || !freeAccent) return;
		const trimmed = name.trim() || `${t('lobby.player_name')} ${drafts.length + 1}`;
		const finalName = trimmed.slice(0, 10);
		setDrafts([...drafts, { name: finalName, shape: activeShape, level, accentColor: freeAccent }]);
		setName('');
	};

	// Persists a profile for every roster entry that is not already backed by a saved one,
	// then starts the game with the resolved profile ids so wins are attributed correctly.
	const startMatch = async () => {
		if (!canStart) return;
		const now = Date.now();
		const resolved: PlayerDraft[] = [];
		for (const draft of drafts) {
			if (draft.profileId != null) {
				resolved.push(draft);
				continue;
			}
			const accentColor = draft.accentColor ?? playerAccent(resolved.length);
			const profileId = await upsertProfile({
				name: draft.name,
				shape: draft.shape,
				accentColor,
				preferredLevel: draft.level,
				gamesPlayed: 0,
				gamesWon: 0,
				totalCorrect: 0,
				totalWrong: 0,
				totalPlayMs: 0,
				currentStreak: 0,
				bestStreak: 0,
				createdAt: now,
				lastPlayedAt: now,
			});
			resolved.push({ ...draft, accentColor, profileId });
		}
		startGame(resolved);
	};

	const addSavedProfile = (profile: PlayerProfile) => {
		if (!canAdd || profile.id == null || usedAccents.has(profile.accentColor)) return;
		setDrafts([
			...drafts,
			{
				name: profile.name,
				shape: profile.shape,
				level: profile.preferredLevel,
				accentColor: profile.accentColor,
				profileId: profile.id,
			},
		]);
	};

	const removePlayer = (index: number) => setDrafts(drafts.filter((_, i) => i !== index));

	if (showFlashcards) return <FlashcardsScreen onClose={() => setShowFlashcards(false)} />;
	if (showHistory) return <HistoryScreen onClose={() => setShowHistory(false)} />;
	if (showSettings) return <SettingsScreen onClose={() => setShowSettings(false)} />;

	return (
		<div className="flex h-full flex-col">
			<header className="relative flex flex-col items-center gap-1 border-b border-outline-variant bg-surface-container-lowest px-5 py-6">
				<h1 className="font-display text-2xl font-bold uppercase tracking-widest-premium text-primary">
					{t('lobby.title')}
				</h1>
				<p className="font-hanken text-xs uppercase tracking-wide-premium text-on-surface-variant">
					{t('lobby.subtitle')}
				</p>
				<div className="absolute right-4 top-4 flex items-center gap-3">
					<button
						type="button"
						aria-label={t('history.open')}
						data-testid="open-history"
						onClick={() => setShowHistory(true)}
						className="text-on-surface-variant hover:text-tertiary"
					>
						<Trophy className="h-5 w-5" />
					</button>
					<button
						type="button"
						aria-label={t('flashcards.open')}
						data-testid="open-flashcards"
						onClick={() => setShowFlashcards(true)}
						className="text-on-surface-variant hover:text-primary"
					>
						<BookOpen className="h-5 w-5" />
					</button>
				</div>
				<button
					type="button"
					aria-label={t('settings.open')}
					data-testid="open-settings"
					onClick={() => setShowSettings(true)}
					className="absolute left-4 top-4 text-on-surface-variant hover:text-primary"
				>
					<Settings className="h-5 w-5" />
				</button>
			</header>

			<main className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-6">
				<ul className="flex flex-col gap-2">
					{drafts.map((draft, index) => (
						<li
							key={`${draft.profileId ?? 'new'}-${index}`}
							data-testid={`player-row-${index}`}
							className="flex items-center justify-between rounded-full border border-outline-variant bg-surface-container px-4 py-3"
						>
							<span className="flex items-center gap-3">
								<ShapeGlyph
									shape={draft.shape}
									size={22}
									color={draft.accentColor ?? playerAccent(index)}
								/>
								<span className="font-hanken text-sm font-bold text-on-surface">{draft.name}</span>
								<span className="font-hanken text-[10px] uppercase tracking-wide-premium text-on-surface-variant">
									{t(`lobby.level_${draft.level.toLowerCase()}`)}
								</span>
							</span>
							<button
								type="button"
								aria-label={t('lobby.remove')}
								onClick={() => removePlayer(index)}
								className="text-on-surface-variant hover:text-error"
							>
								<X className="h-4 w-4" />
							</button>
						</li>
					))}
				</ul>

				{profiles.length > 0 && (
					<div className="flex flex-col gap-2">
						<span className="font-hanken text-[10px] uppercase tracking-wide-premium text-on-surface-variant">
							{t('lobby.saved_players')}
						</span>
						<div className="flex flex-wrap gap-2" data-testid="saved-profiles">
							{profiles.map((profile) => {
								const colorTaken = usedAccents.has(profile.accentColor);
								const alreadyAdded = drafts.some((d) => d.profileId === profile.id);
								const disabled = !canAdd || colorTaken || alreadyAdded;
								return (
									<button
										type="button"
										key={profile.id}
										data-testid={`saved-profile-${profile.id}`}
										disabled={disabled}
										title={colorTaken ? t('lobby.color_taken') : undefined}
										onClick={() => addSavedProfile(profile)}
										className={`flex items-center gap-2 rounded-full border px-3 py-2 transition-colors ${
											disabled
												? 'cursor-not-allowed border-outline-variant bg-surface-container opacity-40'
												: 'border-outline-variant bg-surface-container hover:border-primary'
										}`}
									>
										<ShapeGlyph shape={profile.shape} size={18} color={profile.accentColor} />
										<span className="font-hanken text-xs font-bold text-on-surface">
											{profile.name}
										</span>
									</button>
								);
							})}
						</div>
					</div>
				)}
				{profiles.length === 0 && (
					<p className="font-hanken text-xs text-on-surface-variant">
						{t('lobby.no_saved_players')}
					</p>
				)}

				{canAdd && (
					<div className="flex flex-col gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-4">
						<input
							value={name}
							maxLength={10}
							placeholder={t('lobby.player_name')}
							onChange={(e) => setName(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
							data-testid="player-name-input"
							className="rounded-full border border-outline-variant bg-surface-container-high px-4 py-2.5 font-sans text-sm text-on-surface outline-none focus:border-primary"
						/>
						<div className="flex flex-wrap gap-2">
							{availableShapes.map((option) => (
								<button
									type="button"
									key={option}
									aria-label={option}
									data-testid={`shape-${option}`}
									onClick={() => setShape(option)}
									className={`rounded-full border p-2 transition-colors ${
										activeShape === option
											? 'border-primary bg-primary-container'
											: 'border-outline-variant bg-surface-container'
									}`}
								>
									<ShapeGlyph
										shape={option}
										size={20}
										color={freeAccent ?? playerAccent(drafts.length)}
									/>
								</button>
							))}
						</div>
						<div className="flex gap-2" data-testid="level-toggle">
							{LEVELS.map((option) => (
								<button
									type="button"
									key={option}
									data-testid={`level-${option}`}
									onClick={() => setLevel(option)}
									className={`flex-1 rounded-full border px-4 py-2 font-hanken text-xs font-bold uppercase tracking-wide-premium transition-colors ${
										level === option
											? 'border-primary bg-primary-container text-on-surface'
											: 'border-outline-variant bg-surface-container text-on-surface-variant'
									}`}
								>
									{t(`lobby.level_${option.toLowerCase()}`)}
								</button>
							))}
						</div>
						<Button
							variant="secondary"
							size="md"
							className="gap-2 uppercase"
							data-testid="add-player"
							onClick={addPlayer}
						>
							<Plus className="h-4 w-4" />
							{t('lobby.add_player')}
						</Button>
					</div>
				)}
			</main>

			<div className="border-t border-outline-variant bg-surface-container-lowest p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
				<Button
					variant="primary"
					size="xl"
					className="w-full uppercase shadow-lg"
					disabled={!canStart}
					data-testid="start-game"
					onClick={startMatch}
				>
					{canStart ? t('lobby.start') : t('lobby.min_players')}
				</Button>
			</div>
		</div>
	);
};

export default SetupLobbyScreen;
