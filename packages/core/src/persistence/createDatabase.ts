import Dexie from 'dexie';

type UpgradeCallback = Parameters<ReturnType<Dexie['version']>['upgrade']>[0];

export interface DatabaseVersion {
	stores: Record<string, string>;
	upgrade?: UpgradeCallback;
}

export interface CreateDatabaseConfig {
	name: string;
	versions: DatabaseVersion[];
	exposeAs?: { key: string; enabled: boolean };
}

export function createDatabase<TTables>(config: CreateDatabaseConfig): Dexie & TTables {
	const db = new Dexie(config.name);

	config.versions.forEach((version, index) => {
		const builder = db.version(index + 1).stores(version.stores);
		if (version.upgrade) builder.upgrade(version.upgrade);
	});

	if (config.exposeAs?.enabled && typeof window !== 'undefined') {
		(window as unknown as Record<string, unknown>)[config.exposeAs.key] = db;
	}

	return db as Dexie & TTables;
}
