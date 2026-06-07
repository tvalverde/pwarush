import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import Layout from '../components/Layout';

describe('Regression: Layout outer must use 100svh, not 100dvh', () => {
	it('renders the outer container with h-svh', () => {
		const { container } = render(React.createElement(Layout, null, null));

		const outer = container.firstElementChild;
		expect(outer).not.toBeNull();
		expect(outer?.className).toContain('h-svh');
	});

	it('does NOT use h-dvh on the outer container', () => {
		const { container } = render(React.createElement(Layout, null, null));

		const outer = container.firstElementChild;
		expect(outer?.className).not.toContain('h-dvh');
	});
});
