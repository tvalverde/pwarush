import { Button } from '@pwarush/core/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { Share2, X } from 'lucide-react';
import type React from 'react';
import { useGameStore } from '../store/gameStore';

interface IOSInstallGuideProps {
	isOpen: boolean;
	onClose: () => void;
}

const IOSInstallGuide: React.FC<IOSInstallGuideProps> = ({ isOpen, onClose }) => {
	const { t } = useGameStore();

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
						className="bg-surface-container-lowest w-full max-w-container rounded-lg border border-outline-variant overflow-hidden flex flex-col relative shadow-2xl p-6"
					>
						<button
							type="button"
							onClick={onClose}
							className="absolute top-4 right-4 p-2 hover:bg-surface-container rounded-full transition-colors"
						>
							<X className="w-5 h-5 text-on-surface" />
						</button>

						<div className="bg-surface-container w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
							<Share2 className="w-8 h-8 text-on-surface" />
						</div>

						<h2 className="font-hanken text-xl font-bold text-on-surface uppercase tracking-widest-premium mb-4">
							{t('install.ios_title')}
						</h2>

						<ol className="space-y-3 mb-6">
							<li className="flex items-start gap-3">
								<span className="shrink-0 w-6 h-6 rounded-full bg-primary text-white font-hanken text-xs font-bold flex items-center justify-center">
									1
								</span>
								<p className="font-sans text-sm text-secondary leading-relaxed">
									{t('install.ios_step1')}
								</p>
							</li>
							<li className="flex items-start gap-3">
								<span className="shrink-0 w-6 h-6 rounded-full bg-primary text-white font-hanken text-xs font-bold flex items-center justify-center">
									2
								</span>
								<p className="font-sans text-sm text-secondary leading-relaxed">
									{t('install.ios_step2')}
								</p>
							</li>
						</ol>

						<Button variant="primary" size="lg" onClick={onClose} className="w-full">
							{t('install.ios_close')}
						</Button>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
};

export default IOSInstallGuide;
