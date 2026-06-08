import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import UpdateBanner from './UpdateBanner';

const baseProps = {
	offlineReady: false,
	needRefresh: false,
	onUpdate: () => {},
	onClose: () => {},
	readyLabel: 'App Ready Offline',
	readyMessage: 'Works without internet.',
	newVersionLabel: 'New Version Available',
	newVersionMessage: 'A new update is available.',
	updateLabel: 'Update',
	closeLabel: 'Close',
};

describe('UpdateBanner (controlled primitive)', () => {
	it('does not render when neither offlineReady nor needRefresh', () => {
		const { container } = render(<UpdateBanner {...baseProps} />);
		expect(container.firstChild).toBeNull();
	});

	it('shows the offline-ready message and a close button', () => {
		const onClose = vi.fn();
		render(<UpdateBanner {...baseProps} offlineReady onClose={onClose} />);
		expect(screen.getByText('App Ready Offline')).toBeInTheDocument();
		expect(screen.getByText('Works without internet.')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Close' }));
		expect(onClose).toHaveBeenCalledOnce();
	});

	it('shows the new-version message and fires onUpdate from the update button', () => {
		const onUpdate = vi.fn();
		render(<UpdateBanner {...baseProps} needRefresh onUpdate={onUpdate} />);
		expect(screen.getByText('New Version Available')).toBeInTheDocument();
		expect(screen.getByText('A new update is available.')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Update' }));
		expect(onUpdate).toHaveBeenCalledOnce();
	});
});
