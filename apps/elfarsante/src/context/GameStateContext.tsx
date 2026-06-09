import React, {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useReducer,
	useRef,
	useState,
} from 'react';
import {
	arrayUnion,
	collection,
	db,
	deleteField,
	doc,
	onSnapshot,
	serverTimestamp,
	setDoc,
} from '@/firebase';
import { useAuth } from './AuthContext';

export type Phase =
	| 'HOME'
	| 'REPARTO'
	| 'DEBATE'
	| 'VOTACION'
	| 'RESULTADO'
	| 'PUNTUACIONES'
	| 'RESTORE_PROMPT';

export interface Player {
	id: string;
	name: string;
	score: number;
	farsanteCount: number;
	wronglyEliminatedCount: number;
	roundsSurvivedCount: number;
	farsanteWinsCount: number;
	isAlive: boolean;
	role: 'normal' | 'farsante' | null;
}

export interface GameConfig {
	timerDuration: number;
	selectedCategories: string[];
	farsantesCount: number;
	penaltyOnFail: boolean;
	scoreLimit: number | null;
	blindTimer: boolean;
	language: 'es' | 'en' | 'ca';
}

export interface RoundData {
	word: string;
	category: string;
	farsanteIds: string[];
	remainingTime: number;
	accusedId: string | null;
	currentPlayerIndex: number;
	startingPlayerId: string | null;
	hasShownStartNotice: boolean;
}

export interface GameState {
	players: Player[];
	currentPhase: Phase;
	config: GameConfig;
	round: RoundData;
	usedWords: Record<string, string[]>;
	updatedAt: number;
	localMutationCount: number;
	lastMutatedBy?: string;
}

export type SyncStatus = 'synced' | 'pending' | 'error';

const initialState: GameState = {
	players: [],
	currentPhase: 'HOME',
	config: {
		timerDuration: 300,
		selectedCategories: ['animales'],
		farsantesCount: 1,
		penaltyOnFail: false,
		scoreLimit: null,
		blindTimer: false,
		language: 'es',
	},
	round: {
		word: '',
		category: '',
		farsanteIds: [],
		remainingTime: 300,
		accusedId: null,
		currentPlayerIndex: 0,
		startingPlayerId: null,
		hasShownStartNotice: false,
	},
	usedWords: {},
	updatedAt: 0,
	localMutationCount: 0,
};

type Action =
	| { type: 'START_GAME'; payload: { players: Player[]; config: GameConfig; round: RoundData } }
	| { type: 'NEXT_PHASE'; payload: Phase }
	| { type: 'NEXT_PLAYER' }
	| { type: 'UPDATE_ROUND'; payload: Partial<RoundData> }
	| { type: 'UPDATE_PLAYERS'; payload: Player[] }
	| { type: 'RESET_SCORES' }
	| { type: 'ACCUSE_PLAYER'; payload: { accusedId: string } }
	| { type: 'END_DEBATE'; payload: { remainingTime: number } }
	| { type: 'FORCE_VOTING'; payload: { remainingTime: number } }
	| { type: 'NEW_ROUND'; payload: { players: Player[]; round: RoundData } }
	| { type: 'UPDATE_CONFIG'; payload: Partial<GameConfig> }
	| { type: 'HARD_RESET' }
	| { type: 'LOAD_STATE'; payload: GameState }
	| { type: 'CLEAR_CATEGORY_WORDS'; payload: string }
	| { type: 'MERGE_USED_WORDS'; payload: Record<string, string[]> };

export function gameReducer(state: GameState, action: Action): GameState {
	// If loading from cloud, we accept it as is without updating the timestamp
	if (action.type === 'LOAD_STATE') {
		return {
			...action.payload,
			// Retain local usedWords as it's now synced via a separate subcollection
			usedWords: { ...state.usedWords },
		};
	}

	if (action.type === 'MERGE_USED_WORDS') {
		const newUsedWords = { ...state.usedWords };
		let changed = false;
		for (const [cat, words] of Object.entries(action.payload)) {
			const existing = new Set(newUsedWords[cat] || []);
			const beforeSize = existing.size;
			for (const w of words) {
				existing.add(w);
			}
			if (existing.size !== beforeSize) {
				newUsedWords[cat] = Array.from(existing);
				changed = true;
			}
		}
		if (!changed) return state;
		return { ...state, usedWords: newUsedWords }; // Don't bump local mutation count for cloud updates
	}

	let newState: GameState;

	switch (action.type) {
		case 'START_GAME':
			newState = {
				...state,
				players: action.payload.players,
				config: action.payload.config,
				round: action.payload.round,
				currentPhase: 'REPARTO',
			};
			break;
		case 'NEXT_PHASE': {
			newState = { ...state, currentPhase: action.payload };
			// If we move to PUNTUACIONES, the round is over, save the word
			if (action.payload === 'PUNTUACIONES') {
				const cat = state.round.category;
				const word = state.round.word;
				const currentUsed = state.usedWords[cat] || [];
				if (!currentUsed.includes(word)) {
					newState.usedWords = {
						...state.usedWords,
						[cat]: [...currentUsed, word],
					};
				}
			}
			break;
		}
		case 'NEXT_PLAYER':
			newState = {
				...state,
				round: { ...state.round, currentPlayerIndex: state.round.currentPlayerIndex + 1 },
			};
			break;
		case 'UPDATE_ROUND':
			newState = {
				...state,
				round: { ...state.round, ...action.payload },
			};
			break;
		case 'ACCUSE_PLAYER':
			newState = {
				...state,
				round: { ...state.round, accusedId: action.payload.accusedId },
				currentPhase: 'RESULTADO',
			};
			break;
		case 'END_DEBATE':
			newState = {
				...state,
				round: { ...state.round, remainingTime: action.payload.remainingTime },
				currentPhase: 'VOTACION',
			};
			break;
		case 'FORCE_VOTING':
			newState = {
				...state,
				round: { ...state.round, remainingTime: action.payload.remainingTime },
				currentPhase: 'VOTACION',
			};
			break;
		case 'UPDATE_PLAYERS':
			newState = {
				...state,
				players: action.payload,
			};
			break;
		case 'NEW_ROUND':
			newState = {
				...state,
				players: action.payload.players,
				round: action.payload.round,
				currentPhase: 'REPARTO',
			};
			break;
		case 'UPDATE_CONFIG':
			newState = {
				...state,
				config: { ...state.config, ...action.payload },
			};
			break;
		case 'RESET_SCORES':
			newState = {
				...state,
				currentPhase: 'HOME',
				players: state.players.map((p) => ({
					...p,
					score: 0,
					isAlive: true,
					role: null,
				})),
			};
			break;
		case 'HARD_RESET':
			if (typeof window !== 'undefined') {
				localStorage.removeItem('elfarsante_state');
				localStorage.removeItem('elfarsante_draft_players');
				localStorage.removeItem('elfarsante_draft_config');
				localStorage.removeItem('elfarsante_sync_uid');
			}
			return initialState;
		case 'CLEAR_CATEGORY_WORDS':
			newState = {
				...state,
				usedWords: {
					...state.usedWords,
					[action.payload]: [],
				},
			};
			break;
		default:
			return state;
	}

	// If state hasn't changed, don't update to avoid redundant triggers
	if (newState === state) return state;

	// For any local action that changed the state, increment the logical clock.
	// We stop updating updatedAt locally and rely on Firebase's serverTimestamp.
	return { ...newState, localMutationCount: state.localMutationCount + 1 };
}

const GameStateContext = createContext<
	{ state: GameState; dispatch: React.Dispatch<Action>; syncStatus: SyncStatus } | undefined
>(undefined);

function initGameState(initial: GameState): GameState {
	if (typeof window === 'undefined') return initial; // For SSR/tests if applicable
	try {
		const savedState = localStorage.getItem('elfarsante_state');
		if (savedState) {
			const parsed = JSON.parse(savedState);
			if (parsed?.currentPhase) {
				// Ensure all players have the new stats fields if they come from an older version
				if (parsed.players) {
					parsed.players = parsed.players.map((p: Player) => ({
						...p,
						farsanteCount: p.farsanteCount ?? 0,
						wronglyEliminatedCount: p.wronglyEliminatedCount ?? 0,
						roundsSurvivedCount: p.roundsSurvivedCount ?? 0,
						farsanteWinsCount: p.farsanteWinsCount ?? 0,
					}));
				}
				const stateToReturn = {
					...parsed,
					usedWords: parsed.usedWords || {},
					updatedAt: parsed.updatedAt || 0,
					localMutationCount: parsed.localMutationCount || 0,
				};

				// Anti-poison check: If the local timestamp is in the future (> 5s skew),
				// reset it to 0 so we don't ignore cloud updates.
				if (stateToReturn.updatedAt > Date.now() + 5000) {
					stateToReturn.updatedAt = 0;
				}

				if (
					parsed.currentPhase !== 'HOME' &&
					parsed.currentPhase !== 'PUNTUACIONES' &&
					parsed.currentPhase !== 'RESTORE_PROMPT'
				) {
					stateToReturn.currentPhase = 'RESTORE_PROMPT';
				}
				return stateToReturn;
			}
		}
	} catch (e) {
		console.error('Failed to parse saved state', e);
	}
	return initial;
}

export function GameStateProvider({ children }: { children: ReactNode }) {
	const [state, dispatch] = useReducer(gameReducer, initialState, initGameState);
	const { activeUid } = useAuth();
	const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
	const lastActiveUidRef = useRef<string | null>(activeUid);

	const [sessionId] = useState(() => Math.random().toString(36).substring(2, 10));
	const lastPushedMutationCountRef = useRef<number>(state.localMutationCount);
	const stateRef = useRef<GameState>(state);
	const prevUsedWordsRef = useRef<Record<string, string[]>>(state.usedWords);

	// Keep stateRef up to date for listeners
	useEffect(() => {
		stateRef.current = state;
	}, [state]);

	// Cloud Listener: Update local state when Cloud changes (from other devices or manual edits)
	useEffect(() => {
		if (!activeUid) return;

		const docRef = doc(db, 'users', activeUid);
		const unsubscribe = onSnapshot(docRef, (snap) => {
			if (snap.exists() && !snap.metadata.hasPendingWrites) {
				const cloudState = snap.data() as GameState;
				const currentState = stateRef.current;

				// Normalize Firestore Timestamp to milliseconds
				const updatedAt = cloudState.updatedAt as unknown;
				if (updatedAt && typeof updatedAt === 'object' && 'toMillis' in updatedAt) {
					cloudState.updatedAt = (updatedAt as { toMillis: () => number }).toMillis();
				}

				// 1. Echo Check: If this change was made by US in this session, ignore the payload.
				// This prevents UI jitter/rollback while keeping local state optimistic.
				if (cloudState.lastMutatedBy === sessionId) {
					// Still update our tracker to match the server's mutation count
					lastPushedMutationCountRef.current = cloudState.localMutationCount;
					setSyncStatus('synced');
					return;
				}

				// 2. External Truth: If it's from another device or manual edit, accept it.
				// We accept inconditionally because Firestore guarantees delivery order.
				if (currentState.currentPhase !== 'RESTORE_PROMPT') {
					// Legacy usedWords cleanup/migration
					const cloudData = cloudState as unknown as Record<string, unknown>;
					if (cloudData.usedWords) {
						const legacyUsedWords = cloudData.usedWords as Record<string, string[]>;
						delete cloudData.usedWords;

						// Delete from main document
						setDoc(docRef, { usedWords: deleteField() }, { merge: true }).catch(console.error);

						// Migrate to subcollection
						Object.entries(legacyUsedWords).forEach(([cat, words]) => {
							if (Array.isArray(words) && words.length > 0) {
								const catRef = doc(db, 'users', activeUid, 'usedWords', cat);
								setDoc(catRef, { words: arrayUnion(...words) }, { merge: true }).catch(
									console.error,
								);
							}
						});
					}

					// Update tracker so we don't echo this back
					lastPushedMutationCountRef.current = cloudState.localMutationCount;
					dispatch({ type: 'LOAD_STATE', payload: cloudState });
					setSyncStatus('synced');
				}
			}
		});

		return unsubscribe;
	}, [activeUid, sessionId]);

	// Cloud Listener for usedWords Subcollection
	useEffect(() => {
		if (!activeUid) return;

		const usedWordsRef = collection(db, 'users', activeUid, 'usedWords');
		const unsubscribe = onSnapshot(usedWordsRef, (snap) => {
			// Avoid reacting immediately to our own local updates that we just sent
			if (snap.metadata.hasPendingWrites) return;

			const wordsToMerge: Record<string, string[]> = {};
			snap.docs.forEach((d) => {
				const data = d.data();
				if (data && Array.isArray(data.words)) {
					wordsToMerge[d.id] = data.words;
				}
			});
			if (Object.keys(wordsToMerge).length > 0) {
				dispatch({ type: 'MERGE_USED_WORDS', payload: wordsToMerge });
			}
		});

		return unsubscribe;
	}, [activeUid]);

	// Network listener to handle offline status
	useEffect(() => {
		const handleOnline = () => setSyncStatus('synced');
		const handleOffline = () => setSyncStatus('pending');

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, []);

	// Local & Cloud Persister: Update LocalStorage and Cloud when state changes locally
	useEffect(() => {
		if (state.currentPhase !== 'RESTORE_PROMPT') {
			// 1. Sync to LocalStorage (Immediate fallback)
			localStorage.setItem('elfarsante_state', JSON.stringify(state));

			// 2. Sync to Cloud (If authenticated)
			if (activeUid) {
				// If the UID has changed (linking/unlinking), skip pushing until first snapshot arrives
				if (lastActiveUidRef.current !== activeUid) {
					lastActiveUidRef.current = activeUid;
					return;
				}

				// Diff and sync usedWords to subcollection
				const currentUsed = state.usedWords;
				const prevUsed = prevUsedWordsRef.current;
				Object.entries(currentUsed).forEach(([cat, words]) => {
					const prevWords = prevUsed[cat] || [];
					const newWords = words.filter((w) => !prevWords.includes(w));
					if (newWords.length > 0) {
						const catRef = doc(db, 'users', activeUid, 'usedWords', cat);
						setDoc(catRef, { words: arrayUnion(...newWords) }, { merge: true }).catch(
							console.error,
						);
					}
				});
				prevUsedWordsRef.current = currentUsed;

				// Only push if we have new local mutations not yet sent to the server.
				if (state.localMutationCount > lastPushedMutationCountRef.current) {
					lastPushedMutationCountRef.current = state.localMutationCount;

					// Defer pending status to avoid cascading render warning in effect
					setTimeout(() => setSyncStatus((prev) => (prev !== 'pending' ? 'pending' : prev)), 0);

					const docRef = doc(db, 'users', activeUid);

					// Inject authorship and server time during transport, and remove usedWords
					const { usedWords: _usedWords, ...stateWithoutUsedWords } = state;
					const payload = {
						...stateWithoutUsedWords,
						lastMutatedBy: sessionId,
						updatedAt: serverTimestamp(),
					};

					setDoc(docRef, payload, { merge: true })
						.then(() => {
							setSyncStatus((prev) => (prev !== 'synced' ? 'synced' : prev));
						})
						.catch((err) => {
							console.error('Failed to sync to Cloud:', err);
							setSyncStatus('error');
						});
				}
			}
		}
	}, [state, activeUid, sessionId]);

	return (
		<GameStateContext.Provider value={{ state, dispatch, syncStatus }}>
			{children}
		</GameStateContext.Provider>
	);
}

export function useGameState() {
	const context = useContext(GameStateContext);
	if (context === undefined) {
		throw new Error('useGameState must be used within a GameStateProvider');
	}
	return context;
}
