import { ConfirmDialog } from '@pwarush/core/ui';
import type React from 'react';
import { useGameStore } from '../store/gameStore';

/**
 * Connects the app's gameStore dialog state to the store-agnostic ConfirmDialog
 * primitive in @pwarush/core/ui (texts resolved via i18n here, not in core).
 */
const AppConfirmDialog: React.FC = () => {
	const { dialog, closeDialog, t } = useGameStore();

	if (!dialog) return null;

	return (
		<ConfirmDialog
			isOpen={dialog.isOpen}
			type={dialog.type}
			title={dialog.title}
			message={dialog.message}
			confirmText={dialog.confirmText || t('player_menu.create')}
			cancelText={dialog.cancelText || t('player_menu.cancel')}
			onConfirm={() => {
				dialog.onConfirm();
				closeDialog();
			}}
			onCancel={() => {
				dialog.onCancel?.();
				closeDialog();
			}}
		/>
	);
};

export default AppConfirmDialog;
