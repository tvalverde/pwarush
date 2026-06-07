import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Info, X } from 'lucide-react';
import type React from 'react';
import { useGameStore } from '../store/gameStore';
import Button from './Button';

const ConfirmDialog: React.FC = () => {
	const { dialog, closeDialog, t } = useGameStore();

	if (!dialog) return null;

	const handleConfirm = () => {
		dialog.onConfirm();
		closeDialog();
	};

	const handleCancel = () => {
		if (dialog.onCancel) dialog.onCancel();
		closeDialog();
	};

	return (
		<AnimatePresence>
			{dialog.isOpen && (
				<div className="fixed inset-0 z-300 flex items-center justify-center p-5">
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={handleCancel}
						className="absolute inset-0 bg-primary/60 backdrop-blur-[2px]"
					/>

					{/* Modal Card - "Zen Pop" style from DESIGN.md */}
					<motion.div
						data-testid="confirm-dialog"
						initial={{ scale: 0.9, opacity: 0, y: 20 }}
						animate={{ scale: 1, opacity: 1, y: 0 }}
						exit={{ scale: 0.9, opacity: 0, y: 20 }}
						className="bg-surface-container-lowest w-full max-w-[340px] rounded-xl border-[3px] border-primary overflow-hidden flex flex-col relative shadow-2xl z-10"
					>
						{/* Header Icon */}
						<div
							className={`h-20 flex items-center justify-center ${dialog.type === 'danger' ? 'bg-error-container' : 'bg-surface-container'}`}
						>
							{dialog.type === 'danger' ? (
								<AlertTriangle className="w-10 h-10 text-error" />
							) : (
								<Info className="w-10 h-10 text-on-surface" />
							)}
						</div>

						<div className="p-6 text-center">
							<h2 className="font-hanken text-lg font-black text-on-surface uppercase tracking-widest-premium mb-2">
								{dialog.title}
							</h2>
							<p className="font-sans text-sm text-secondary leading-relaxed mb-8">
								{dialog.message}
							</p>

							<div className="flex flex-col gap-3">
								<Button
									variant="primary"
									size="md"
									onClick={handleConfirm}
									className={dialog.type === 'danger' ? 'bg-error hover:bg-error' : ''}
								>
									{dialog.confirmText || t('player_menu.create')}
								</Button>
								<Button
									variant="ghost"
									size="md"
									onClick={handleCancel}
									className="text-secondary font-hanken text-xs font-bold tracking-widest uppercase"
								>
									{dialog.cancelText || t('player_menu.cancel')}
								</Button>
							</div>
						</div>

						<button
							type="button"
							onClick={handleCancel}
							className="absolute top-2 right-2 p-1 text-secondary/50 hover:text-on-surface transition-colors"
						>
							<X className="w-5 h-5" />
						</button>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
};

export default ConfirmDialog;
