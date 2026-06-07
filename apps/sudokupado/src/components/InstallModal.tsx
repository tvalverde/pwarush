import { Button } from '@pwarush/core/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { Download } from 'lucide-react';
import type React from 'react';
import { useGameStore } from '../store/gameStore';

interface InstallModalProps {
	isOpen: boolean;
	onClose: () => void;
}

const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
	const { deferredPrompt, setDeferredPrompt, t } = useGameStore();

	const handleInstall = async () => {
		if (!deferredPrompt) return;

		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;

		if (outcome === 'accepted') {
			console.log('User accepted the A2HS prompt');
		} else {
			console.log('User dismissed the A2HS prompt');
		}

		setDeferredPrompt(null);
		onClose();
	};

	return (
		<AnimatePresence>
			{isOpen && deferredPrompt && (
				<div className="fixed inset-0 z-60 flex items-center justify-center p-5">
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="absolute inset-0 bg-primary/70 backdrop-blur-xs"
					/>
					<motion.div
						initial={{ scale: 0.9, opacity: 0, y: 20 }}
						animate={{ scale: 1, opacity: 1, y: 0 }}
						exit={{ scale: 0.9, opacity: 0, y: 20 }}
						className="bg-surface-container-lowest w-full max-w-container rounded-lg border border-outline-variant overflow-hidden flex flex-col relative shadow-2xl p-6 text-center"
					>
						<div className="bg-surface-container w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
							<Download className="w-8 h-8 text-on-surface" />
						</div>

						<h2 className="font-hanken text-xl font-bold text-on-surface uppercase tracking-widest-premium mb-2">
							{t('install.title')}
						</h2>

						<p className="font-sans text-sm text-secondary mb-6 leading-relaxed">
							{t('install.message')}
						</p>

						<div className="flex flex-col gap-3">
							<Button variant="primary" size="lg" onClick={handleInstall} className="w-full">
								{t('install.button')}
							</Button>
							<Button
								variant="ghost"
								size="md"
								onClick={onClose}
								className="w-full text-secondary uppercase font-hanken text-xs font-bold tracking-widest"
							>
								{t('install.later')}
							</Button>
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
};

export default InstallModal;
