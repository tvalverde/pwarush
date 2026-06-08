import { InstallPrompt } from '@pwarush/core/pwa/react';
import type React from 'react';
import { useGameStore } from '../store/gameStore';

interface InstallModalProps {
	isOpen: boolean;
	onClose: () => void;
}

/**
 * Connects the app's deferredPrompt/i18n to the store-agnostic InstallPrompt
 * primitive in @pwarush/core/pwa/react (the A2HS flow stays here).
 */
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
		<InstallPrompt
			isOpen={isOpen && !!deferredPrompt}
			onClose={onClose}
			onInstall={handleInstall}
			title={t('install.title')}
			message={t('install.message')}
			installLabel={t('install.button')}
			laterLabel={t('install.later')}
		/>
	);
};

export default InstallModal;
