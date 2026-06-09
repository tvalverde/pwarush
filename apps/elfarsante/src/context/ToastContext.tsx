import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';

export type ToastType = 'info' | 'error' | 'warning' | 'success';

interface Toast {
	id: string;
	message: string;
	type: ToastType;
}

interface ToastContextType {
	showToast: (message: string, type?: ToastType) => void;
	toasts: Toast[];
	removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const showToast = useCallback((message: string, type: ToastType = 'info') => {
		const id = Math.random().toString(36).substring(2, 9);
		setToasts((prev) => [...prev, { id, message, type }]);

		// Auto remove after 4 seconds
		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, 4000);
	}, []);

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	return (
		<ToastContext.Provider value={{ showToast, toasts, removeToast }}>
			{children}
		</ToastContext.Provider>
	);
}

export function useToast() {
	const context = useContext(ToastContext);
	if (context === undefined) {
		throw new Error('useToast must be used within a ToastProvider');
	}
	return context;
}
