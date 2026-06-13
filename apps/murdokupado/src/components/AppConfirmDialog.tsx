import { ConfirmDialog } from '@pwarush/core/ui';
import type React from 'react';
import { useGameStore } from '../store/gameStore';

const AppConfirmDialog: React.FC = () => {
	const { dialog, closeDialog, t } = useGameStore();

	return (
		<ConfirmDialog
			isOpen={dialog.isOpen}
			type={dialog.type}
			title={dialog.title}
			message={dialog.message}
			confirmText={dialog.confirmText ?? t('main_menu.resume_prompt_confirm')}
			cancelText={dialog.cancelText ?? t('main_menu.resume_prompt_cancel')}
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
