import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import InstallPrompt from './InstallPrompt';

const baseProps = {
	isOpen: true,
	onClose: () => {},
	onInstall: () => {},
	title: 'Install SUDOKUPADO',
	message: 'Add it to your home screen.',
	installLabel: 'Install',
	laterLabel: 'Later',
};

describe('InstallPrompt (controlled primitive)', () => {
	it('does not render when closed', () => {
		const { container } = render(<InstallPrompt {...baseProps} isOpen={false} />);
		expect(container.firstChild).toBeNull();
	});

	it('renders title, message and provided labels', () => {
		render(<InstallPrompt {...baseProps} />);
		expect(screen.getByText('Install SUDOKUPADO')).toBeInTheDocument();
		expect(screen.getByText('Add it to your home screen.')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Install' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Later' })).toBeInTheDocument();
	});

	it('fires onInstall and onClose from their buttons', () => {
		const onInstall = vi.fn();
		const onClose = vi.fn();
		render(<InstallPrompt {...baseProps} onInstall={onInstall} onClose={onClose} />);
		fireEvent.click(screen.getByRole('button', { name: 'Install' }));
		fireEvent.click(screen.getByRole('button', { name: 'Later' }));
		expect(onInstall).toHaveBeenCalledOnce();
		expect(onClose).toHaveBeenCalledOnce();
	});
});
