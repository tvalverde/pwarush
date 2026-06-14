import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Portrait from './Portrait';

function markupFor(personId: string): string {
	const { container } = render(<Portrait personId={personId} />);
	const svg = container.querySelector('svg');
	expect(svg).not.toBeNull();
	return (svg as SVGSVGElement).innerHTML;
}

describe('Portrait', () => {
	it('renders an svg element', () => {
		const { container } = render(<Portrait personId="suspect-1" />);
		expect(container.querySelector('svg')).not.toBeNull();
	});

	it('is deterministic: same personId yields identical markup across renders', () => {
		expect(markupFor('detective-marlowe')).toBe(markupFor('detective-marlowe'));
	});

	it('produces distinct markup for two different personIds', () => {
		expect(markupFor('person-a')).not.toBe(markupFor('person-z'));
	});

	it('does not paint an opaque background (transparent portrait)', () => {
		const { container } = render(<Portrait personId="suspect-1" />);
		expect(container.querySelector('rect')).toBeNull();
	});
});
