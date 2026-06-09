import type React from 'react';
import { useSFX } from '../../hooks/useSFX';

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'primary' | 'danger' | 'ghost';
	fullWidth?: boolean;
}

export function NeonButton({
	children,
	variant = 'primary',
	fullWidth = false,
	className = '',
	onClick,
	...props
}: NeonButtonProps) {
	const { playTick } = useSFX();

	const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		playTick();
		if (onClick) {
			onClick(e);
		}
	};

	let baseStyles =
		'active:scale-[0.98] transition-all duration-200 pointer-events-auto flex items-center justify-center gap-2 ';

	if (variant === 'primary') {
		baseStyles +=
			'font-h2 text-h2 py-4 rounded-full font-bold tracking-wider bg-primary-container text-background hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] active:shadow-[0_0_20px_rgba(0,229,255,0.6)]';
	} else if (variant === 'danger') {
		baseStyles +=
			'font-h2 text-h2 py-4 rounded-full font-bold tracking-wider bg-neon-red text-white hover:shadow-[0_0_15px_rgba(255,42,95,0.4)] active:shadow-[0_0_20px_rgba(255,42,95,0.6)]';
	} else if (variant === 'ghost') {
		baseStyles +=
			'text-primary-container hover:text-primary transition-colors text-sm font-semibold tracking-wide py-2';
	}

	if (fullWidth) {
		baseStyles += ' w-full max-w-md mx-auto block';
	}

	return (
		<button
			className={`${baseStyles} ${className}`}
			onClick={handleClick}
			aria-disabled={props.disabled}
			{...props}
		>
			{children}
		</button>
	);
}
