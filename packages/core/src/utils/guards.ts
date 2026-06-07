export const isOneOf =
	<T>(values: readonly T[]) =>
	(v: unknown): v is T =>
		(values as readonly unknown[]).includes(v);

export const isArrayOf =
	<T>(itemGuard: (value: unknown) => value is T) =>
	(v: unknown): v is T[] =>
		Array.isArray(v) && v.every(itemGuard);

export const isNumberGrid =
	(size: number, min: number, max: number) =>
	(v: unknown): v is number[][] =>
		Array.isArray(v) &&
		v.length === size &&
		v.every(
			(row) =>
				Array.isArray(row) &&
				row.length === size &&
				row.every((cell) => typeof cell === 'number' && cell >= min && cell <= max),
		);

export const isNotesGrid =
	(size: number, min: number, max: number) =>
	(v: unknown): v is number[][][] =>
		Array.isArray(v) &&
		v.length === size &&
		v.every(
			(row) =>
				Array.isArray(row) &&
				row.length === size &&
				row.every(
					(cell) =>
						Array.isArray(cell) && cell.every((n) => typeof n === 'number' && n >= min && n <= max),
				),
		);

type GuardMap = Record<string, (value: unknown) => boolean>;

interface BackupGuardConfig {
	appName: string;
	required: GuardMap;
	optional?: GuardMap;
}

const isValidArrayField = (value: unknown, guard: (value: unknown) => boolean): boolean =>
	Array.isArray(value) && value.every(guard);

export const createBackupGuard =
	({ appName, required, optional = {} }: BackupGuardConfig) =>
	(v: unknown): boolean => {
		if (typeof v !== 'object' || v === null) return false;
		const d = v as Record<string, unknown>;
		if (d.appName !== appName) return false;
		for (const [key, guard] of Object.entries(required)) {
			if (!isValidArrayField(d[key], guard)) return false;
		}
		for (const [key, guard] of Object.entries(optional)) {
			if (d[key] !== undefined && !isValidArrayField(d[key], guard)) return false;
		}
		return true;
	};
