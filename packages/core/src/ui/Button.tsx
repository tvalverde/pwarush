import type React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'primary' | 'secondary' | 'ghost';
	size?: 'sm' | 'md' | 'lg' | 'xl';
	pill?: boolean;
}

const Button: React.FC<ButtonProps> = ({
	children,
	variant = 'primary',
	size = 'md',
	pill = true,
	className = '',
	...props
}) => {
	const baseStyles =
		'inline-flex items-center justify-center font-hanken transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';

	const variants = {
		primary: 'bg-primary text-white hover:bg-primary-container',
		secondary:
			'bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container',
		ghost: 'bg-transparent text-on-surface hover:bg-surface-container',
	};

	const sizes = {
		sm: 'px-3 py-1.5 text-xs',
		md: 'px-6 py-3 text-sm font-bold tracking-wide-premium',
		lg: 'px-8 py-4 text-base font-bold tracking-widest-premium',
		xl: 'px-10 py-5 text-lg font-bold tracking-widest-premium',
	};

	const pillStyle = pill ? 'rounded-full' : 'rounded-md';

	return (
		<button
			className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${pillStyle} ${className}`}
			{...props}
		>
			{children}
		</button>
	);
};

export default Button;
