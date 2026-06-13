import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import PersonToken, { accentTokenForPerson } from './PersonToken';

afterEach(() => {
	cleanup();
});

describe('PersonToken', () => {
	it('shows the uppercase initial of the name', () => {
		const { getByText } = render(<PersonToken name="mara" personId="mara" variant="suspect" />);
		expect(getByText('M')).toBeInTheDocument();
	});

	it('distinguishes the victim variant from the suspect variant', () => {
		const { container: suspect } = render(
			<PersonToken name="Bo" personId="bo" variant="suspect" />,
		);
		const { container: victim } = render(
			<PersonToken name="Mara" personId="mara" variant="victim" />,
		);

		expect(suspect.querySelector('svg')?.getAttribute('data-variant')).toBe('suspect');
		expect(victim.querySelector('svg')?.getAttribute('data-variant')).toBe('victim');
	});

	it('marks selection and murderer reveal via data attributes', () => {
		const { container } = render(
			<PersonToken name="Bo" personId="bo" variant="suspect" selected murderer />,
		);
		const svg = container.querySelector('svg');
		expect(svg?.getAttribute('data-selected')).toBe('true');
		expect(svg?.getAttribute('data-murderer')).toBe('true');
	});
});

describe('accentTokenForPerson', () => {
	it('is deterministic for the same id', () => {
		expect(accentTokenForPerson('gemma')).toBe(accentTokenForPerson('gemma'));
	});

	it('always returns a known palette token', () => {
		const known = [
			'--color-secondary',
			'--color-outline',
			'--color-tertiary',
			'--color-warning',
			'--color-info',
		];
		for (const id of ['mara', 'bo', 'gemma', 'dee']) {
			expect(known).toContain(accentTokenForPerson(id));
		}
	});

	it('maps fixed ids to their expected tokens', () => {
		expect(accentTokenForPerson('mara')).toBe('--color-tertiary');
		expect(accentTokenForPerson('bo')).toBe('--color-info');
	});

	it('distributes distinct ids across the palette', () => {
		expect(accentTokenForPerson('mara')).not.toBe(accentTokenForPerson('bo'));
	});
});
