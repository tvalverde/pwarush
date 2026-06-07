import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Button from './Button';

describe('Button', () => {
	it('renders children and fires onClick', () => {
		const onClick = vi.fn();
		render(<Button onClick={onClick}>Play</Button>);
		const btn = screen.getByRole('button', { name: 'Play' });
		fireEvent.click(btn);
		expect(onClick).toHaveBeenCalledOnce();
	});

	it('applies the primary variant and pill shape by default', () => {
		render(<Button>X</Button>);
		const btn = screen.getByRole('button');
		expect(btn.className).toContain('bg-primary');
		expect(btn.className).toContain('rounded-full');
	});

	it('applies secondary variant with outline border', () => {
		render(<Button variant="secondary">X</Button>);
		expect(screen.getByRole('button').className).toContain('border-outline-variant');
	});

	it('does not fire onClick when disabled', () => {
		const onClick = vi.fn();
		render(
			<Button disabled onClick={onClick}>
				X
			</Button>,
		);
		fireEvent.click(screen.getByRole('button'));
		expect(onClick).not.toHaveBeenCalled();
	});
});
