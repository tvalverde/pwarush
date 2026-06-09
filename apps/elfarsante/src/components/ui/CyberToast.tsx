import { type ToastType, useToast } from '../../context/ToastContext';

export function CyberToast() {
	const { toasts, removeToast } = useToast();

	if (toasts.length === 0) return null;

	return (
		<div
			role="status"
			aria-live="polite"
			className="fixed bottom-32 left-0 right-0 z-[100] flex flex-col items-center gap-3 px-6 pointer-events-none"
		>
			{toasts.map((toast) => (
				<ToastItem
					key={toast.id}
					message={toast.message}
					type={toast.type}
					onClose={() => removeToast(toast.id)}
				/>
			))}
		</div>
	);
}

function ToastItem({
	message,
	type,
	onClose,
}: {
	message: string;
	type: ToastType;
	onClose: () => void;
}) {
	const bgColor = {
		info: 'bg-surface-container-high border-primary-container',
		error: 'bg-surface-container-high border-neon-red',
		warning: 'bg-surface-container-high border-tertiary-fixed',
		success: 'bg-surface-container-high border-success',
	}[type];

	const iconColor = {
		info: 'text-primary-container',
		error: 'text-neon-red',
		warning: 'text-tertiary-fixed',
		success: 'text-success',
	}[type];

	const icon = {
		info: 'info',
		error: 'error',
		warning: 'warning',
		success: 'check_circle',
	}[type];

	return (
		<div
			onClick={onClose}
			className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl border-2 ${bgColor} shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-md w-full cursor-pointer active:scale-95 transition-transform`}
		>
			<span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
			<p className="text-on-surface font-medium text-sm flex-grow">{message}</p>
			<span className="material-symbols-outlined text-outline text-sm opacity-50">close</span>
		</div>
	);
}
