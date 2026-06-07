import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ConfirmDialog, { type ConfirmDialogProps } from './ConfirmDialog';

const baseProps: ConfirmDialogProps = {
	isOpen: true,
	title: 'Danger Zone',
	message: 'This will delete everything.',
	confirmText: 'Delete',
	cancelText: 'Cancel',
	onConfirm: () => {},
	onCancel: () => {},
};

describe('ConfirmDialog (controlled primitive)', () => {
	it('does not render when closed', () => {
		const { container } = render(<ConfirmDialog {...baseProps} isOpen={false} />);
		expect(container.firstChild).toBeNull();
	});

	it('renders title, message and the provided button texts', () => {
		render(<ConfirmDialog {...baseProps} />);
		expect(screen.getByText('Danger Zone')).toBeInTheDocument();
		expect(screen.getByText('This will delete everything.')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
	});

	it('fires onConfirm and onCancel from their buttons', () => {
		const onConfirm = vi.fn();
		const onCancel = vi.fn();
		render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} onCancel={onCancel} />);
		fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
		fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
		expect(onConfirm).toHaveBeenCalledOnce();
		expect(onCancel).toHaveBeenCalledOnce();
	});

	it('is store/i18n agnostic: shows exactly the texts passed as props', () => {
		render(<ConfirmDialog {...baseProps} confirmText="Sí, borrar" cancelText="No" />);
		expect(screen.getByRole('button', { name: 'Sí, borrar' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument();
	});
});
