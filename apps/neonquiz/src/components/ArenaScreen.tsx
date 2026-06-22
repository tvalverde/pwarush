import { Button } from '@pwarush/core/ui';
import { Menu } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useHapticEvent, useTap } from '../hooks/useHaptics';
import { useGameStore } from '../store/gameStore';
import { type Board, CATEGORIES, type Player, type TriviaCategory } from '../types';
import { categoryColor } from '../utils/categories';
import type { HapticEvent } from '../utils/haptics';
import { playerColor } from '../utils/players';
import AdultQuestionOverlay from './AdultQuestionOverlay';
import ArenaMenu from './ArenaMenu';
import NeonBoard from './board/NeonBoard';
import ShapeGlyph from './board/ShapeGlyph';
import ConclaveHandoffScreen from './ConclaveHandoffScreen';
import ConclaveVoteScreen from './ConclaveVoteScreen';
import Dice from './Dice';
import DiceRollOverlay from './DiceRollOverlay';
import MatchClock from './MatchClock';
import QuestionOverlay from './QuestionOverlay';
import SparkFlyOverlay from './SparkFlyOverlay';
import TurnTransitionScreen from './TurnTransitionScreen';
import VictoryScreen from './VictoryScreen';

/**
 * Decides which post-roll haptic, if any, best matches the freshly-computed `validMoves`:
 * a Spark candidate beats a plain move, and an empty `validMoves` is a dead end. Pure and
 * exported so it can be unit-tested without mounting the full screen.
 */
export const decideRollHaptic = (
	board: Board,
	validMoves: number[],
	player: Player,
): HapticEvent | null => {
	if (validMoves.length === 0) return 'deadEnd';
	const hasSparkCandidate = validMoves.some((nodeId) => {
		const node = board.nodes.find((n) => n.id === nodeId);
		return node?.type === 'SPARK_NODE' && node.category && !player.sparks.includes(node.category);
	});
	return hasSparkCandidate ? 'sparkCandidate' : null;
};

interface SparkTrackProps {
	collected: string[];
	/** Withheld until its fly animation docks, so the slot lights up on arrival. */
	pending?: string | null;
	/** Plays a one-shot dock pop on the slot that just arrived. */
	docked?: string | null;
}

const SparkTrack: React.FC<SparkTrackProps> = ({ collected, pending, docked }) => (
	<div className="flex gap-1.5" data-testid="spark-track">
		{CATEGORIES.map((category) => {
			const has = collected.includes(category) && category !== pending;
			return (
				<span
					key={category}
					data-spark-slot={category}
					data-testid={has ? `spark-${category}` : undefined}
					className={`h-3 w-3 rounded-full ${has && category === docked ? 'nq-spark-dock' : ''}`}
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
	const [showMenu, setShowMenu] = useState(false);
	const [rolling, setRolling] = useState(false);
	const [flyingSpark, setFlyingSpark] = useState<TriviaCategory | null>(null);
	const [withheldSpark, setWithheldSpark] = useState<TriviaCategory | null>(null);
	const [dockedSpark, setDockedSpark] = useState<TriviaCategory | null>(null);
	const pendingSparkRef = useRef<TriviaCategory | null>(null);
	const tap = useTap();
	const fireHaptic = useHapticEvent();

	// A Spark is awarded the instant FEEDBACK opens, while the board is hidden. Withhold it from
	// the HUD track from that instant so it doesn't pre-light behind the feedback; once feedback
	// closes and the board is visible again, let it fly from its node into the track and dock.
	useEffect(() => {
		return useGameStore.subscribe((state, prev) => {
			if (
				state.phase === 'FEEDBACK' &&
				prev.phase !== 'FEEDBACK' &&
				state.lastOutcome?.collectedSpark
			) {
				pendingSparkRef.current = state.lastOutcome.collectedSpark;
				setWithheldSpark(state.lastOutcome.collectedSpark);
			}
			if (prev.phase === 'FEEDBACK' && state.phase !== 'FEEDBACK' && pendingSparkRef.current) {
				setFlyingSpark(pendingSparkRef.current);
				pendingSparkRef.current = null;
			}
		});
	}, []);

	useEffect(() => {
		if (!dockedSpark) return;
		const id = setTimeout(() => setDockedSpark(null), 480);
		return () => clearTimeout(id);
	}, [dockedSpark]);

	const handleSparkDocked = useCallback((category: TriviaCategory) => {
		setFlyingSpark(null);
		setWithheldSpark(null);
		setDockedSpark(category);
	}, []);

	const player = players[currentPlayerIndex];
	if (!player) return null;

	// Surfaces a dead-end roll (no legal destination) so the turn can still advance.
	const noMoves = phase === 'AWAITING_MOVE' && dice !== null && validMoves.length === 0;

	const handleRoll = (): void => {
		if (rolling) return;
		tap();
		rollDice();
		setRolling(true);
	};

	const handleRollSettled = (): void => {
		const haptic = decideRollHaptic(board, validMoves, player);
		if (haptic) fireHaptic(haptic);
		setRolling(false);
	};

	const handleMove = (nodeId: number): void => {
		fireHaptic('move');
		moveTo(nodeId);
	};

	const handleSkipTurn = (): void => {
		tap();
		skipTurn();
	};

	const handleOpenMenu = (): void => {
		tap();
		setShowMenu(true);
	};

	return (
		<div className="relative flex h-full flex-col">
			<header className="flex items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-4 py-3">
				<span className="flex items-center gap-2">
					<ShapeGlyph
						shape={player.shape}
						size={22}
						color={playerColor(player, currentPlayerIndex)}
					/>
					<span className="flex flex-col">
						<span className="font-display text-[9px] uppercase tracking-widest-premium text-on-surface-variant">
							{t('arena.turn_of')}
						</span>
						<span className="font-hanken text-sm font-bold text-on-surface">{player.name}</span>
					</span>
				</span>
				<span className="flex items-center gap-3">
					<MatchClock />
					<SparkTrack collected={player.sparks} pending={withheldSpark} docked={dockedSpark} />
					<button
						type="button"
						aria-label={t('menu.open')}
						data-testid="open-menu"
						onClick={handleOpenMenu}
						className="text-on-surface-variant hover:text-primary"
					>
						<Menu className="h-5 w-5" />
					</button>
				</span>
			</header>

			<main className="relative flex-1 overflow-hidden">
				<NeonBoard
					board={board}
					players={players}
					validMoves={validMoves}
					onMove={handleMove}
					nexusActive={player.sparks.length === CATEGORIES.length}
				/>
				{rolling && <DiceRollOverlay value={dice} onDone={handleRollSettled} />}
				{(phase === 'QUESTION_ACTIVE' || phase === 'FEEDBACK' || phase === 'CONCLAVE_QUESTION') &&
					(player.level === 'ADULT' ? <AdultQuestionOverlay /> : <QuestionOverlay />)}
				{phase === 'TURN_TRANSITION' && <TurnTransitionScreen />}
				{phase === 'CONCLAVE_VOTE' && <ConclaveVoteScreen />}
				{phase === 'CONCLAVE_HANDOFF' && <ConclaveHandoffScreen />}
				{phase === 'VICTORY' && <VictoryScreen />}
			</main>

			<footer className="flex min-h-20 items-center justify-center gap-4 border-t border-outline-variant bg-surface-container-lowest px-5 py-4">
				{phase === 'ROLLING_DICE' && !rolling && (
					<Button
						variant="primary"
						size="lg"
						className="gap-3 uppercase"
						data-testid="roll-dice"
						onClick={handleRoll}
					>
						<Dice value={dice} size={32} />
						{t('arena.roll')}
					</Button>
				)}
				{phase === 'AWAITING_MOVE' && !rolling && !noMoves && (
					<div className="flex items-center gap-3">
						<Dice value={dice} size={44} />
						<span className="font-hanken text-xs uppercase tracking-wide-premium text-on-surface-variant">
							{t('arena.your_move')}
						</span>
					</div>
				)}
				{noMoves && !rolling && (
					<Button
						variant="secondary"
						size="md"
						className="uppercase"
						data-testid="skip-turn"
						onClick={handleSkipTurn}
					>
						{t('question.next_player')}
					</Button>
				)}
			</footer>

			{showMenu && <ArenaMenu onClose={() => setShowMenu(false)} />}
			{flyingSpark && (
				<SparkFlyOverlay category={flyingSpark} onDone={() => handleSparkDocked(flyingSpark)} />
			)}
		</div>
	);
};

export default ArenaScreen;
