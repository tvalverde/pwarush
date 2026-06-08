import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import IosInstallSteps from './IosInstallSteps';

const baseProps = {
	isOpen: true,
	onClose: () => {},
	title: 'Install on iOS',
	step1: 'Tap the Share button.',
	step2: 'Tap Add to Home Screen.',
	closeLabel: 'Got it',
};

describe('IosInstallSteps (controlled primitive)', () => {
	it('does not render when closed', () => {
		const { container } = render(<IosInstallSteps {...baseProps} isOpen={false} />);
		expect(container.firstChild).toBeNull();
	});

	it('renders title, steps and close label', () => {
		render(<IosInstallSteps {...baseProps} />);
		expect(screen.getByText('Install on iOS')).toBeInTheDocument();
		expect(screen.getByText('Tap the Share button.')).toBeInTheDocument();
		expect(screen.getByText('Tap Add to Home Screen.')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Got it' })).toBeInTheDocument();
	});

	it('fires onClose from the close button', () => {
		const onClose = vi.fn();
		render(<IosInstallSteps {...baseProps} onClose={onClose} />);
		fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
		expect(onClose).toHaveBeenCalledOnce();
	});
});
