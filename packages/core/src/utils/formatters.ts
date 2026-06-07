export const formatDuration = (seconds: number): string => {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatDate = (timestamp: number, locale?: string): string =>
	new Date(timestamp).toLocaleDateString(locale, {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	});
