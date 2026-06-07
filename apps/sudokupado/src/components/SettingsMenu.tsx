import { AnimatePresence, motion } from 'framer-motion';
import {
	AlertCircle,
	CheckCircle2,
	Download,
	Globe,
	Info,
	Smartphone,
	Trash2,
	Upload,
	X,
} from 'lucide-react';
import type React from 'react';
import { useRef, useState } from 'react';
import { db } from '../db/database';
import { type Language, useGameStore } from '../store/gameStore';
import { isIOS, isStandalone } from '../utils/device';
import { exportDatabaseToJson, importDatabaseFromJson } from '../utils/exportImport';
import Button from './Button';
import IOSInstallGuide from './IOSInstallGuide';

interface SettingsMenuProps {
	isOpen: boolean;
	onClose: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ isOpen, onClose }) => {
	const { t, language, setLanguage, showDialog, setActivePlayer } = useGameStore();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
	const [isIOSGuideOpen, setIOSGuideOpen] = useState(false);
	const showIOSInstallButton = isIOS() && !isStandalone();

	const handleExport = async () => {
		const success = await exportDatabaseToJson();
		if (success) {
			showStatus('success', t('settings.export_success'));
		} else {
			showStatus('error', 'Export failed');
		}
	};

	const handleImportClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		showDialog({
			title: t('settings.data_management'),
			message: t('settings.import_prompt_msg'),
			onConfirm: async () => {
				try {
					await importDatabaseFromJson(file);
					showStatus('success', t('settings.import_success'));
					setTimeout(() => window.location.reload(), 2000);
				} catch (_error) {
					showStatus('error', 'Import failed: Invalid file');
				}
			},
			confirmText: t('settings.import_prompt_confirm'),
			type: 'danger',
		});

		if (fileInputRef.current) fileInputRef.current.value = '';
	};

	const handleReset = async () => {
		showDialog({
			title: t('settings.danger_zone'),
			message: t('settings.clear_confirm'),
			onConfirm: async () => {
				await db.transaction(
					'rw',
					[db.players, db.preferences, db.history, db.gameState],
					async () => {
						await db.players.clear();
						await db.preferences.clear();
						await db.history.clear();
						await db.gameState.clear();
					},
				);
				await setActivePlayer(null); // Clear local state immediately
				showStatus('success', t('settings.reset_success'));
				setTimeout(() => window.location.reload(), 1500);
			},
			confirmText: t('settings.delete_all_confirm'),
			type: 'danger',
		});
	};

	const showStatus = (type: 'success' | 'error', message: string) => {
		setStatus({ type, message });
		setTimeout(() => setStatus(null), 4000);
	};

	return (
		<>
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
									{t('settings.title')}
								</h2>
								<button
									type="button"
									data-testid="settings-close"
									onClick={onClose}
									className="p-2 hover:bg-surface-container rounded-full transition-colors"
								>
									<X className="w-6 h-6 text-on-surface" />
								</button>
							</div>

							{/* Content Area */}
							<div className="p-6 flex flex-col gap-8 overflow-y-auto max-h-[70vh]">
								{/* Status Message */}
								{status && (
									<motion.div
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										className={`p-3 rounded-DEFAULT flex items-center gap-3 ${
											status.type === 'success'
												? 'bg-success-container text-on-success-container'
												: 'bg-error-container text-on-error-container'
										}`}
									>
										{status.type === 'success' ? (
											<CheckCircle2 className="w-5 h-5" />
										) : (
											<AlertCircle className="w-5 h-5" />
										)}
										<span className="font-sans text-sm font-medium">{status.message}</span>
									</motion.div>
								)}

								{/* Language Section */}
								<section className="space-y-4">
									<h3 className="font-hanken text-xs font-bold text-secondary uppercase tracking-widest-premium flex items-center gap-2">
										<Globe className="w-4 h-4" />
										Language / Idioma
									</h3>
									<div className="flex gap-2">
										{(['en', 'es'] as Language[]).map((lang) => (
											<button
												type="button"
												key={lang}
												data-testid={`language-toggle-${lang}`}
												onClick={() => setLanguage(lang)}
												className={`flex-1 py-3 rounded-full font-hanken text-xs font-bold uppercase transition-all border ${
													language === lang
														? 'bg-primary text-white border-transparent'
														: 'bg-surface-container-lowest text-on-surface border-outline-variant hover:bg-surface-container'
												}`}
											>
												{lang === 'en' ? 'English' : 'Castellano'}
											</button>
										))}
									</div>
								</section>

								<div className="w-full h-px bg-surface-container" />

								{/* Export/Import Section */}
								<section className="space-y-4">
									<h3 className="font-hanken text-xs font-bold text-secondary uppercase tracking-widest-premium">
										{t('settings.data_management')}
									</h3>
									<div className="grid grid-cols-1 gap-3">
										<Button
											variant="secondary"
											size="md"
											className="w-full gap-3 justify-start px-4"
											onClick={handleExport}
										>
											<Download className="w-5 h-5" />
											{t('settings.export')}
										</Button>
										<Button
											variant="secondary"
											size="md"
											className="w-full gap-3 justify-start px-4"
											onClick={handleImportClick}
										>
											<Upload className="w-5 h-5" />
											{t('settings.import')}
										</Button>
										{showIOSInstallButton && (
											<Button
												variant="secondary"
												size="md"
												className="w-full gap-3 justify-start px-4"
												onClick={() => setIOSGuideOpen(true)}
											>
												<Smartphone className="w-5 h-5" />
												{t('install.ios_button')}
											</Button>
										)}
										<input
											type="file"
											ref={fileInputRef}
											data-testid="settings-import-input"
											className="hidden"
											accept=".json"
											onChange={handleFileChange}
										/>
									</div>
								</section>

								<div className="w-full h-px bg-surface-container" />

								{/* Danger Zone */}
								<section className="space-y-4">
									<h3 className="font-hanken text-xs font-bold text-error uppercase tracking-widest-premium">
										{t('settings.danger_zone')}
									</h3>
									<Button
										variant="ghost"
										size="md"
										className="w-full gap-3 justify-start px-4 text-error hover:bg-error-container"
										onClick={handleReset}
									>
										<Trash2 className="w-5 h-5" />
										{t('settings.clear_data')}
									</Button>
								</section>

								{/* About Section */}
								<section className="space-y-2 mt-4 text-center">
									<div className="flex justify-center gap-1 text-on-surface mb-2">
										<Info className="w-4 h-4" />
										<span className="font-hanken text-[10px] font-bold uppercase tracking-wider">
											{t('settings.about')}
										</span>
									</div>
									<p className="font-sans text-[10px] text-secondary leading-relaxed">
										{t('settings.version').replace('{version}', __APP_VERSION__)}
										<br />
										{t('settings.privacy')}
									</p>
								</section>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
			<IOSInstallGuide isOpen={isIOSGuideOpen} onClose={() => setIOSGuideOpen(false)} />
		</>
	);
};

export default SettingsMenu;
