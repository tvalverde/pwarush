import { RotateDeviceOverlay } from '@pwarush/core/pwa/react';
import type React from 'react';
import { useGameStore } from '../store/gameStore';

/**
 * Injects i18n into the store-agnostic RotateDeviceOverlay primitive in
 * @pwarush/core/pwa/react (landscape detection lives in core).
 */
const OrientationOverlay: React.FC = () => {
	const { t } = useGameStore();

	return <RotateDeviceOverlay title={t('orientation.title')} message={t('orientation.message')} />;
};

export default OrientationOverlay;
