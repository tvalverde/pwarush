import { Button } from '@pwarush/core/ui';
import type React from 'react';
import { useGameStore } from '../store/gameStore';
import { CATEGORIES } from '../types';
import { categoryColor } from '../utils/categories';
import NeonBoard from './board/NeonBoard';
import ShapeGlyph from './board/ShapeGlyph';
import ConclaveHandoffScreen from './ConclaveHandoffScreen';
import ConclaveVoteScreen from './ConclaveVoteScreen';
import Dice from './Dice';
import QuestionOverlay from './QuestionOverlay';
import TurnTransitionScreen from './TurnTransitionScreen';
import VictoryScreen from './VictoryScreen';

const SparkTrack: React.FC<{ collected: string[] }> = ({ collected }) => (
	<div className="flex gap-1.5" data-testid="spark-track">
		{CATEGORIES.map((category) => {
			const has = collected.includes(category);
			return (
				<span
					key={category}
					data-testid={has ? `spark-${category}` : undefined}
					className="h-3 w-3 rounded-full"
					style={{
						backgroundColor: has ? categoryColor(category) : 'transparent',
						border: `1.5px solid ${categoryColor(category)}`,
						opacity: has ? 1 : 0.35,
					}}
				/>
			);
		})}
	</div>
);

const ArenaScreen: React.FC = () => {
	const phase = useGameStore((s) => s.phase);
	const board = useGameStore((s) => s.board);
	const players = useGameStore((s) => s.players);
	const currentPlayerIndex = useGameStore((s) => s.currentPlayerIndex);
	const dice = useGameStore((s) => s.dice);
	const validMoves = useGameStore((s) => s.validMoves);
	const rollDice = useGameStore((s) => s.rollDice);
	const moveTo = useGameStore((s) => s.moveTo);
	const skipTurn = useGameStore((s) => s.skipTurn);
	const t = useGameStore((s) => s.t);

	const player = players[currentPlayerIndex];
	if (!player) return null;

	// Surfaces a dead-end roll (no legal destination) so the turn can still advance.
	const noMoves = phase === 'AWAITING_MOVE' && dice !== null && validMoves.length === 0;

	return (
		<div className="relative flex h-full flex-col">
			<header className="flex items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-4 py-3">
				<span className="flex items-center gap-2">
					<ShapeGlyph shape={player.shape} size={22} color="var(--color-primary)" />
					<span className="flex flex-col">
						<span className="font-display text-[9px] uppercase tracking-widest-premium text-on-surface-variant">
							{t('arena.turn_of')}
						</span>
						<span className="font-hanken text-sm font-bold text-on-surface">{player.name}</span>
					</span>
				</span>
				<SparkTrack collected={player.sparks} />
			</header>

			<main className="relative flex-1 overflow-hidden">
				<NeonBoard board={board} players={players} validMoves={validMoves} onMove={moveTo} />
				{(phase === 'QUESTION_ACTIVE' || phase === 'FEEDBACK' || phase === 'CONCLAVE_QUESTION') && (
					<QuestionOverlay />
				)}
				{phase === 'TURN_TRANSITION' && <TurnTransitionScreen />}
				{phase === 'CONCLAVE_VOTE' && <ConclaveVoteScreen />}
				{phase === 'CONCLAVE_HANDOFF' && <ConclaveHandoffScreen />}
				{phase === 'VICTORY' && <VictoryScreen />}
			</main>

			<footer className="flex min-h-20 items-center justify-center gap-4 border-t border-outline-variant bg-surface-container-lowest px-5 py-4">
				{phase === 'ROLLING_DICE' && (
					<Button
						variant="primary"
						size="lg"
						className="gap-3 uppercase"
						data-testid="roll-dice"
						onClick={() => rollDice()}
					>
						<Dice value={dice} size={32} />
						{t('arena.roll')}
					</Button>
				)}
				{phase === 'AWAITING_MOVE' && !noMoves && (
					<div className="flex items-center gap-3">
						<Dice value={dice} size={44} />
						<span className="font-hanken text-xs uppercase tracking-wide-premium text-on-surface-variant">
							{t('arena.your_move')}
						</span>
					</div>
				)}
				{noMoves && (
					<Button
						variant="secondary"
						size="md"
						className="uppercase"
						data-testid="skip-turn"
						onClick={skipTurn}
					>
						{t('question.next_player')}
					</Button>
				)}
			</footer>
		</div>
	);
};

export default ArenaScreen;
