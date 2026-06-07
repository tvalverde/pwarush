import { describe, expect, it } from 'vitest';
import { formatDate, formatDuration } from './formatters';

describe('formatDuration', () => {
	it('formats zero as 00:00', () => {
		expect(formatDuration(0)).toBe('00:00');
	});

	it('pads minutes and seconds below ten', () => {
		expect(formatDuration(65)).toBe('01:05');
	});

	it('formats durations under a minute', () => {
		expect(formatDuration(42)).toBe('00:42');
	});

	it('formats durations spanning many minutes', () => {
		expect(formatDuration(6005)).toBe('100:05');
	});
});

describe('formatDate', () => {
	const timestamp = Date.UTC(2024, 0, 15, 12);

	it('renders a short month, two-digit day and numeric year', () => {
		expect(formatDate(timestamp, 'en-US')).toMatch(/^[A-Za-z]{3,4} \d{2}, \d{4}$/);
	});

	it('honours the provided locale', () => {
		expect(formatDate(timestamp, 'en-US')).not.toBe(formatDate(timestamp, 'es-ES'));
	});
});
