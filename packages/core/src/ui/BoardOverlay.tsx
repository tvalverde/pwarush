import type React from 'react';

export interface BoardOverlayProps {
	// When false the layer ignores pointer events, leaving the board underneath inert
	// (for purely decorative overlays). Default true: the overlay hosts interactive UI.
	interactive?: boolean;
	// App-specific surface styling: z-index, background, blur, padding, shape, gaps.
	className?: string;
	children: React.ReactNode;
	'data-testid'?: string;
}

/**
 * Positioning primitive for an overlay laid over a board: an absolutely-positioned
 * layer that fills its (relative) parent and centers its content. It owns only the
 * placement and pointer-event behavior; every app supplies its own surface (panel,
 * badge, animation) and content as children.
 */
const BoardOverlay: React.FC<BoardOverlayProps> = ({
	interactive = true,
	className = '',
	children,
	'data-testid': testId,
}) => (
	<div
		data-testid={testId}
		className={`absolute inset-0 flex flex-col items-center justify-center${
			interactive ? '' : ' pointer-events-none'
		}${className ? ` ${className}` : ''}`}
	>
		{children}
	</div>
);

export default BoardOverlay;
