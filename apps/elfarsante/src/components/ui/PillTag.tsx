import type React from 'react';

interface PillTagProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	active?: boolean;
	icon?: string;
}

export function PillTag({
	children,
	active = false,
	icon,
	className = '',
	...props
}: PillTagProps) {
	const baseStyles =
		'px-5 py-3 rounded-full border font-label-pill text-label-pill transition-all inline-flex items-center justify-center gap-2';
	const activeStyles =
		'border-primary-container bg-primary-container/10 text-on-surface shadow-[0_0_15px_rgba(0,229,255,0.2)]';
	const inactiveStyles =
		'border-outline-variant text-on-surface-variant hover:border-outline hover:text-on-surface';

	return (
		<button
			className={`${baseStyles} ${active ? activeStyles : inactiveStyles} ${className}`}
			{...props}
		>
			{icon && <span className="material-symbols-outlined text-[18px]">{icon}</span>}
			{children}
		</button>
	);
}
