import type React from 'react';

interface CyberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	icon?: string;
	onRemove?: () => void;
}

export function CyberInput({
	icon = 'person',
	onRemove,
	className = '',
	...props
}: CyberInputProps) {
	return (
		<div className={`relative flex items-center group ${className}`}>
			<span className="material-symbols-outlined absolute left-0 ml-0 text-outline-variant group-focus-within:text-primary-container transition-colors duration-200 pb-2">
				{icon}
			</span>
			<input
				className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary-container focus:ring-0 text-on-surface pl-8 pr-8 pb-2 transition-colors duration-200 placeholder-outline focus:placeholder-transparent outline-none"
				type="text"
				{...props}
			/>
			{onRemove && (
				<button
					type="button"
					onClick={onRemove}
					className="absolute right-0 text-outline-variant group-focus-within:text-primary-container hover:text-error transition-colors pb-2"
				>
					<span className="material-symbols-outlined text-lg">close</span>
				</button>
			)}
		</div>
	);
}
