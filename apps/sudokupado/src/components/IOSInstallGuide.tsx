import { IosInstallSteps } from '@pwarush/core/pwa/react';
import type React from 'react';
import { useGameStore } from '../store/gameStore';

interface IOSInstallGuideProps {
	isOpen: boolean;
	onClose: () => void;
}

/**
 * Injects i18n into the store-agnostic IosInstallSteps primitive in
 * @pwarush/core/pwa/react.
 */
const IOSInstallGuide: React.FC<IOSInstallGuideProps> = ({ isOpen, onClose }) => {
	const { t } = useGameStore();

	return (
		<IosInstallSteps
			isOpen={isOpen}
			onClose={onClose}
			title={t('install.ios_title')}
			step1={t('install.ios_step1')}
			step2={t('install.ios_step2')}
			closeLabel={t('install.ios_close')}
		/>
	);
};

export default IOSInstallGuide;
