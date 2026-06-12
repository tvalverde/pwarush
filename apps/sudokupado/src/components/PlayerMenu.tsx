import { Button } from '@pwarush/core/ui';
import { useLiveQuery } from 'dexie-react-hooks';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Plus, Trash2, User, X } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { db } from '../db/database';
import { useGameStore } from '../store/gameStore';

interface PlayerMenuProps {
	isOpen: boolean;
	onClose: () => void;
}

const PlayerMenu: React.FC<PlayerMenuProps> = ({ isOpen, onClose }) => {
	const { t, activePlayerId, setActivePlayer, showDialog } = useGameStore();
	const players = useLiveQuery(() => db.players.where('isDeleted').equals(0).toArray());
	const [newPlayerName, setNewPlayerName] = useState('');
	const [isCreating, setIsCreating] = useState(false);

	const handleCreatePlayer = async () => {
		if (!newPlayerName.trim()) return;
		const id = await db.players.add({
			name: newPlayerName.trim(),
			createdAt: Date.now(),
			isDeleted: 0,
		});
		setActivePlayer(id as number);
		setNewPlayerName('');
		setIsCreating(false);
		onClose(); // Auto-close after creation
	};

	const handleDeletePlayer = async (id: number, name: string) => {
		showDialog({
			title: t('player_menu.delete_prompt_title'),
			message: t('player_menu.delete_prompt_msg').replace('{name}', name),
			onConfirm: async () => {
				await db.players.update(id, { isDeleted: 1 });

				// Cleanup related data
				await db.preferences.where('playerId').equals(id).delete();
				await db.gameState.where('playerId').equals(id).delete();
				await db.history.where('playerId').equals(id).delete();

				if (activePlayerId === id) {
					setActivePlayer(null);
				}
			},
			confirmText: t('player_menu.delete_prompt_confirm'),
			type: 'danger',
		});
	};

	const activePlayer = players?.find((p) => p.id === activePlayerId);
	const otherPlayers = players?.filter((p) => p.id !== activePlayerId);

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-5">
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="absolute inset-0 bg-primary/70"
					/>
					<motion.div
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.9, opacity: 0 }}
						className="bg-surface-container-lowest w-full max-w-container rounded-lg border border-outline-variant overflow-hidden flex flex-col relative shadow-xl"
					>
						{/* Header */}
						<div className="flex items-center justify-between p-4 border-b border-surface-container bg-surface-container-lowest">
							<h2 className="font-hanken text-lg font-bold text-on-surface tracking-widest-premium uppercase">
								{t('player_menu.title')}
							</h2>
							<button
								type="button"
								onClick={onClose}
								className="p-2 hover:bg-surface-container rounded-full transition-colors"
							>
								<X className="w-6 h-6 text-on-surface" />
							</button>
						</div>

						{/* Content Area */}
						<div className="p-4 flex flex-col gap-6 overflow-y-auto max-h-[60vh]">
							{/* Active Player Section */}
							<div className="flex flex-col gap-2">
								<span className="font-hanken text-[10px] font-bold text-secondary uppercase tracking-wider">
									{t('player_menu.active_player')}
								</span>
								{activePlayer ? (
									<button
										type="button"
										onClick={onClose} // Closing if clicking current active is also a good QoL
										className="bg-primary text-on-primary rounded-DEFAULT p-4 flex items-center justify-between shadow-xs cursor-pointer w-full text-left"
									>
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 rounded-full bg-surface-container-lowest/20 flex items-center justify-center">
												<User className="w-6 h-6" />
											</div>
											<span className="font-hanken text-lg font-bold">{activePlayer.name}</span>
										</div>
										<CheckCircle className="w-6 h-6 text-on-primary" />
									</button>
								) : (
									<div className="p-4 border-2 border-dashed border-outline-variant rounded-DEFAULT text-center text-secondary font-sans text-sm">
										{t('player_menu.no_active')}
									</div>
								)}
							</div>

							<div className="w-full h-px bg-surface-container" />

							{/* Switch Player Section */}
							<div className="flex flex-col gap-2">
								<span className="font-hanken text-[10px] font-bold text-secondary uppercase tracking-wider">
									{t('player_menu.switch_player')}
								</span>
								<div className="flex flex-col gap-2">
									{/* Guest (Anonymous) Option */}
									{activePlayerId !== null && (
										<button
											type="button"
											data-testid="player-switch-guest"
											onClick={() => {
												setActivePlayer(null);
												onClose();
											}}
											className="bg-surface-container border border-outline-variant rounded-DEFAULT p-3 flex items-center justify-between hover:bg-surface-container-high transition-colors cursor-pointer group w-full text-left"
										>
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-secondary">
													<User className="w-6 h-6" />
												</div>
												<span className="font-sans text-base text-on-surface font-medium">
													{t('main_menu.guest')}
												</span>
											</div>
										</button>
									)}

									{otherPlayers?.map((player) => (
										<button
											key={player.id}
											type="button"
											data-testid={`player-switch-${player.id}`}
											onClick={() => {
												setActivePlayer(player.id!);
												onClose(); // Auto-close on selection
											}}
											className="bg-surface-container border border-outline-variant rounded-DEFAULT p-3 flex items-center justify-between hover:bg-surface-container-high transition-colors cursor-pointer group w-full text-left"
										>
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-secondary">
													<User className="w-6 h-6" />
												</div>
												<span className="font-sans text-base text-on-surface font-medium">
													{player.name}
												</span>
											</div>
											<button
												type="button"
												data-testid={`player-delete-${player.id}`}
												onClick={(e) => {
													e.stopPropagation();
													handleDeletePlayer(player.id!, player.name);
												}}
												className="p-2 hover:bg-error-container hover:text-error rounded-full transition-colors text-secondary"
											>
												<Trash2 className="w-5 h-5" />
											</button>
										</button>
									))}
								</div>
							</div>

							{isCreating && (
								<div className="flex flex-col gap-2 mt-2">
									<input
										type="text"
										data-testid="player-name-input"
										value={newPlayerName}
										onChange={(e) => setNewPlayerName(e.target.value)}
										placeholder={t('player_menu.enter_name')}
										className="w-full p-3 border border-outline-variant rounded-DEFAULT focus:outline-hidden focus:border-primary font-sans text-sm"
										onKeyDown={(e) => e.key === 'Enter' && handleCreatePlayer()}
									/>
									<div className="flex gap-2">
										<Button
											variant="primary"
											size="sm"
											data-testid="player-create-confirm"
											onClick={handleCreatePlayer}
											className="flex-1"
										>
											{t('player_menu.create')}
										</Button>
										<Button
											variant="secondary"
											size="sm"
											data-testid="player-create-cancel"
											onClick={() => setIsCreating(false)}
											className="flex-1"
										>
											{t('player_menu.cancel')}
										</Button>
									</div>
								</div>
							)}
						</div>

						{/* Footer Action Area */}
						{!isCreating && (
							<div className="p-4 border-t border-surface-container bg-surface-container">
								<button
									type="button"
									data-testid="player-create-button"
									onClick={() => setIsCreating(true)}
									className="w-full bg-primary text-on-primary rounded-full py-4 px-6 flex items-center justify-center gap-2 hover:bg-primary-container transition-colors active:scale-95 shadow-xs"
								>
									<Plus className="w-5 h-5" />
									<span className="font-hanken text-sm font-bold tracking-widest-premium uppercase">
										{t('player_menu.create_button')}
									</span>
								</button>
							</div>
						)}
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
};

export default PlayerMenu;
