import { Button } from '@pwarush/core/ui';
import { BookOpen, Plus, X } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { type PlayerDraft, useGameStore } from '../store/gameStore';
import { PLAYER_SHAPES, type PlayerShape } from '../types';
import ShapeGlyph from './board/ShapeGlyph';
import FlashcardsScreen from './FlashcardsScreen';

const MAX_PLAYERS = 6;
const MIN_PLAYERS = 2;

const SetupLobbyScreen: React.FC = () => {
	const startGame = useGameStore((s) => s.startGame);
	const t = useGameStore((s) => s.t);
	const [drafts, setDrafts] = useState<PlayerDraft[]>([]);
	const [name, setName] = useState('');
	const [showFlashcards, setShowFlashcards] = useState(false);

	const usedShapes = new Set(drafts.map((d) => d.shape));
	const availableShapes = PLAYER_SHAPES.filter((shape) => !usedShapes.has(shape));
	const [shape, setShape] = useState<PlayerShape>(PLAYER_SHAPES[0]);
	const activeShape = availableShapes.includes(shape) ? shape : availableShapes[0];

	const canAdd = drafts.length < MAX_PLAYERS && availableShapes.length > 0;
	const canStart = drafts.length >= MIN_PLAYERS;

	const addPlayer = () => {
		if (!canAdd || !activeShape) return;
		const trimmed = name.trim() || `${t('lobby.player_name')} ${drafts.length + 1}`;
		setDrafts([...drafts, { name: trimmed.slice(0, 10), shape: activeShape }]);
		setName('');
	};

	const removePlayer = (index: number) => setDrafts(drafts.filter((_, i) => i !== index));

	if (showFlashcards) return <FlashcardsScreen onClose={() => setShowFlashcards(false)} />;

	return (
		<div className="flex h-full flex-col">
			<header className="relative flex flex-col items-center gap-1 border-b border-outline-variant bg-surface-container-lowest px-5 py-6">
				<h1 className="font-display text-2xl font-bold uppercase tracking-widest-premium text-primary">
					{t('lobby.title')}
				</h1>
				<p className="font-hanken text-xs uppercase tracking-wide-premium text-on-surface-variant">
					{t('lobby.subtitle')}
				</p>
				<button
					type="button"
					data-testid="open-flashcards"
					onClick={() => setShowFlashcards(true)}
					className="absolute right-4 top-4 flex items-center gap-1 rounded-full border border-outline-variant px-3 py-1.5 font-hanken text-[11px] font-bold uppercase tracking-wide-premium text-on-surface-variant hover:text-primary"
				>
					<BookOpen className="h-3.5 w-3.5" />
					{t('flashcards.open')}
				</button>
			</header>

			<main className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-6">
				<ul className="flex flex-col gap-2">
					{drafts.map((draft, index) => (
						<li
							key={draft.shape}
							data-testid={`player-row-${index}`}
							className="flex items-center justify-between rounded-full border border-outline-variant bg-surface-container px-4 py-3"
						>
							<span className="flex items-center gap-3">
								<ShapeGlyph shape={draft.shape} size={22} color="var(--color-primary)" />
								<span className="font-hanken text-sm font-bold text-on-surface">{draft.name}</span>
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
									<ShapeGlyph shape={option} size={20} color="var(--color-on-surface)" />
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
					onClick={() => startGame(drafts)}
				>
					{canStart ? t('lobby.start') : t('lobby.min_players')}
				</Button>
			</div>
		</div>
	);
};

export default SetupLobbyScreen;
