import type React from 'react';

interface LayoutProps {
	children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
	return (
		<div className="h-svh bg-surface-container flex items-center justify-center p-0 md:p-6 overflow-hidden">
			{/*
				Adaptive Container:
				- Mobile: Full width/height, no radius.
				- Tablet (md): Grow up to 700px, full height or slightly less to avoid scroll.
				- Desktop (lg): Fixed phone-like frame.
			*/}
			<div className="w-full h-full md:max-w-[700px] lg:max-w-container md:h-full lg:h-[min(90dvh,900px)] bg-surface-container-lowest relative md:shadow-2xl flex flex-col overflow-hidden md:rounded-[2rem] md:border md:border-outline-variant p-[env(safe-area-inset-top)_env(safe-area-inset-right)_env(safe-area-inset-bottom)_env(safe-area-inset-left)] md:p-0">
				{children}
			</div>
		</div>
	);
};

export default Layout;
