import { Button } from '@pwarush/core/ui';
import type React from 'react';
import { useTap } from '../hooks/useHaptics';

interface ConfirmOverlayProps {
	title: string;
	message: string;
	confirmText: string;
	cancelText: string;
	danger?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

/** Lightweight confirm dialog (no framer-motion) for destructive game/data actions. */
const ConfirmOverlay: React.FC<ConfirmOverlayProps> = ({
	title,
	message,
	confirmText,
	cancelText,
	danger = false,
	onConfirm,
	onCancel,
}) => {
	const tap = useTap();

	return (
		<div
			data-testid="confirm-overlay"
			className="absolute inset-0 z-50 flex items-center justify-center bg-surface/80 p-6 backdrop-blur-sm"
		>
			<div className="flex w-full max-w-xs flex-col gap-4 rounded-lg border-2 border-primary bg-surface-container-low p-5 text-center">
				<h2 className="font-display text-base font-bold uppercase tracking-wide-premium text-on-surface">
					{title}
				</h2>
				<p className="font-sans text-sm text-on-surface-variant">{message}</p>
				<div className="flex flex-col gap-2 pt-1">
					<Button
						variant={danger ? 'danger' : 'primary'}
						size="md"
						className="uppercase"
						data-testid="confirm-yes"
						onClick={() => {
							tap();
							onConfirm();
						}}
					>
						{confirmText}
					</Button>
					<Button
						variant="ghost"
						size="md"
						className="uppercase"
						data-testid="confirm-no"
						onClick={() => {
							tap();
							onCancel();
						}}
					>
						{cancelText}
					</Button>
				</div>
			</div>
		</div>
	);
};

export default ConfirmOverlay;
