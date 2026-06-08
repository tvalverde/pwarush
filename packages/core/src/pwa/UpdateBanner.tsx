import { AnimatePresence, motion } from 'framer-motion';
import { Check, RefreshCw } from 'lucide-react';
import type React from 'react';

interface UpdateBannerProps {
	offlineReady: boolean;
	needRefresh: boolean;
	onUpdate: () => void;
	onClose: () => void;
	readyLabel: string;
	readyMessage: string;
	newVersionLabel: string;
	newVersionMessage: string;
	updateLabel: string;
	closeLabel: string;
}

const UpdateBanner: React.FC<UpdateBannerProps> = ({
	offlineReady,
	needRefresh,
	onUpdate,
	onClose,
	readyLabel,
	readyMessage,
	newVersionLabel,
	newVersionMessage,
	updateLabel,
	closeLabel,
}) => {
	return (
		<AnimatePresence>
			{(offlineReady || needRefresh) && (
				<motion.div
					initial={{ y: 100, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: 100, opacity: 0 }}
					className="absolute bottom-20 left-4 right-4 z-100 mx-auto max-w-[400px]"
				>
					<div className="bg-primary text-white p-4 rounded-2xl shadow-2xl flex flex-col items-center justify-between gap-4 border border-white/10 overflow-hidden">
						<div className="flex flex-col gap-1 flex-1 text-center w-full">
							<span className="font-hanken text-xs font-black uppercase tracking-widest-premium">
								{offlineReady ? readyLabel : newVersionLabel}
							</span>
							<p className="font-sans text-[10px] opacity-80 leading-tight">
								{offlineReady ? readyMessage : newVersionMessage}
							</p>
						</div>
						<div className="flex gap-2 shrink-0 w-full">
							{needRefresh ? (
								<button
									type="button"
									onClick={onUpdate}
									className="bg-surface-container-lowest text-on-surface px-4 py-2 rounded-full font-hanken text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 flex-1 shadow-xs active:scale-95 transition-transform"
								>
									<RefreshCw className="w-3 h-3" />
									{updateLabel}
								</button>
							) : (
								<button
									type="button"
									onClick={onClose}
									className="bg-surface-container-lowest text-on-surface px-4 py-2 rounded-full font-hanken text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 flex-1 shadow-xs active:scale-95 transition-transform"
								>
									<Check className="w-3 h-3" />
									{closeLabel}
								</button>
							)}
						</div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default UpdateBanner;
