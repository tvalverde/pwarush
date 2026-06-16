import { BoardOverlay, Button } from '@pwarush/core/ui';
import { ShieldAlert } from 'lucide-react';
import type React from 'react';

interface CaseSolvedOverlayProps {
	title: string;
	murdererLabel: string;
	murdererName: string;
	victimLabel: string;
	victimName: string;
	continueLabel: string;
	onContinue: () => void;
}

/**
 * Case-file reveal superimposed on the board: the solved scene (with the murderer
 * ringed) stays visible, blurred, behind a paper panel naming the culprit and the
 * victim. Button-driven so the player reads the verdict before the summary.
 */
const CaseSolvedOverlay: React.FC<CaseSolvedOverlayProps> = ({
	title,
	murdererLabel,
	murdererName,
	victimLabel,
	victimName,
	continueLabel,
	onContinue,
}) => (
	<BoardOverlay
		data-testid="case-solved-overlay"
		className="z-40 gap-5 rounded-DEFAULT bg-surface/85 p-6 text-center backdrop-blur-sm"
	>
		<ShieldAlert className="h-12 w-12 text-tertiary" />
		<h2 className="font-display text-2xl font-bold uppercase tracking-widest-premium text-on-surface">
			{title}
		</h2>
		<div className="flex flex-col gap-3">
			<div className="flex flex-col gap-0.5">
				<span className="font-display text-[10px] font-bold uppercase tracking-wide-premium text-secondary">
					{murdererLabel}
				</span>
				<span data-testid="overlay-murderer" className="font-display text-3xl font-bold text-error">
					{murdererName}
				</span>
			</div>
			<div className="flex flex-col gap-0.5">
				<span className="font-display text-[10px] font-bold uppercase tracking-wide-premium text-secondary">
					{victimLabel}
				</span>
				<span className="font-display text-lg font-bold text-on-surface">{victimName}</span>
			</div>
		</div>
		<Button
			variant="primary"
			size="lg"
			className="gap-2 uppercase"
			data-testid="reveal-continue"
			onClick={onContinue}
		>
			{continueLabel}
		</Button>
	</BoardOverlay>
);

export default CaseSolvedOverlay;
