import { AnimatePresence, motion } from 'framer-motion';
import { Download } from 'lucide-react';
import type React from 'react';
import { Button } from '../ui';

interface InstallPromptProps {
	isOpen: boolean;
	onClose: () => void;
	onInstall: () => void;
	title: string;
	message: string;
	installLabel: string;
	laterLabel: string;
}

const InstallPrompt: React.FC<InstallPromptProps> = ({
	isOpen,
	onClose,
	onInstall,
	title,
	message,
	installLabel,
	laterLabel,
}) => {
	return (
		<AnimatePresence>
			{isOpen && (
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
							{title}
						</h2>

						<p className="font-sans text-sm text-secondary mb-6 leading-relaxed">{message}</p>

						<div className="flex flex-col gap-3">
							<Button variant="primary" size="lg" onClick={onInstall} className="w-full">
								{installLabel}
							</Button>
							<Button
								variant="ghost"
								size="md"
								onClick={onClose}
								className="w-full text-secondary uppercase font-hanken text-xs font-bold tracking-widest"
							>
								{laterLabel}
							</Button>
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
};

export default InstallPrompt;
