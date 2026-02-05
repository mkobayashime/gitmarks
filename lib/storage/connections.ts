import type {
	Connection,
	ConnectionConfig,
	ConnectionState,
	LocalConnectionStateStore,
	SyncConnectionsStore,
} from "../types/connection.ts";

const SYNC_KEY = "sync:gitmarks_connections";
const LOCAL_STATE_KEY = "local:gitmarks_connection_state";

export const getConnections = async (): Promise<Connection[]> => {
	const [configs, states] = await Promise.all([
		browser.storage.sync
			.get(SYNC_KEY)
			.then((r) => (r[SYNC_KEY] ?? {}) as SyncConnectionsStore),
		browser.storage.local
			.get(LOCAL_STATE_KEY)
			.then((r) => (r[LOCAL_STATE_KEY] ?? {}) as LocalConnectionStateStore),
	]);

	return Object.entries(configs)
		.filter(([id]) => id in states)
		.map(([id, config]) => ({ ...config, ...states[id] }));
};

export const saveConnection = async (connection: Connection): Promise<void> => {
	const {
		targetFolderId,
		lastSyncedAt,
		lastSyncedCommitSha,
		lastSyncError,
		...config
	} = connection;

	const state: ConnectionState = {
		targetFolderId,
		lastSyncedAt,
		lastSyncedCommitSha,
		lastSyncError,
	};

	await Promise.all([
		browser.storage.sync.get(SYNC_KEY).then((result) => {
			const configs = (result[SYNC_KEY] ?? {}) as SyncConnectionsStore;
			configs[connection.id] = config;
			return browser.storage.sync.set({ [SYNC_KEY]: configs });
		}),
		browser.storage.local.get(LOCAL_STATE_KEY).then((result) => {
			const states = (result[LOCAL_STATE_KEY] ??
				{}) as LocalConnectionStateStore;
			states[connection.id] = state;
			return browser.storage.local.set({ [LOCAL_STATE_KEY]: states });
		}),
	]);
};

export const updateConnection = async (
	id: string,
	updates: Partial<Connection>,
): Promise<void> => {
	const configKeys: (keyof ConnectionConfig)[] = [
		"id",
		"repoFullName",
		"repoOwner",
		"repoName",
		"srcDir",
		"targetFolderPath",
		"enabled",
		"createdAt",
	];

	const configUpdates = pickKeys(updates, configKeys);
	const stateUpdates = omitKeys(updates, configKeys);

	const promises: Promise<void>[] = [];

	if (Object.keys(configUpdates).length > 0) {
		promises.push(updateSyncConfig(id, configUpdates));
	}
	if (Object.keys(stateUpdates).length > 0) {
		promises.push(updateLocalState(id, stateUpdates));
	}

	await Promise.all(promises);
};

export const addConnection = async (connection: Connection): Promise<void> => {
	await saveConnection(connection);
};

export const removeConnection = async (id: string): Promise<void> => {
	await Promise.all([deleteFromSync(id), deleteFromLocal(id)]);
};

const pickKeys = <T extends Record<string, unknown>, K extends keyof T>(
	obj: T,
	keys: K[],
): Pick<T, K> => {
	const result = {} as Pick<T, K>;
	for (const key of keys) {
		if (key in obj) {
			result[key] = obj[key];
		}
	}
	return result;
};

const omitKeys = <T extends Record<string, unknown>, K extends keyof T>(
	obj: T,
	keys: K[],
): Omit<T, K> => {
	const result = { ...obj };
	for (const key of keys) {
		delete result[key];
	}
	return result as Omit<T, K>;
};

const updateSyncConfig = async (
	id: string,
	updates: Partial<ConnectionConfig>,
): Promise<void> => {
	await browser.storage.sync.get(SYNC_KEY).then((result) => {
		const configs = (result[SYNC_KEY] ?? {}) as SyncConnectionsStore;
		if (!(id in configs)) return;
		configs[id] = { ...configs[id], ...updates };
		return browser.storage.sync.set({ [SYNC_KEY]: configs });
	});
};

const updateLocalState = async (
	id: string,
	updates: Partial<ConnectionState>,
): Promise<void> => {
	await browser.storage.local.get(LOCAL_STATE_KEY).then((result) => {
		const states = (result[LOCAL_STATE_KEY] ?? {}) as LocalConnectionStateStore;
		if (!(id in states)) return;
		states[id] = { ...states[id], ...updates };
		return browser.storage.local.set({ [LOCAL_STATE_KEY]: states });
	});
};

const deleteFromSync = async (id: string): Promise<void> => {
	await browser.storage.sync.get(SYNC_KEY).then((result) => {
		const configs = (result[SYNC_KEY] ?? {}) as SyncConnectionsStore;
		delete configs[id];
		return browser.storage.sync.set({ [SYNC_KEY]: configs });
	});
};

const deleteFromLocal = async (id: string): Promise<void> => {
	await browser.storage.local.get(LOCAL_STATE_KEY).then((result) => {
		const states = (result[LOCAL_STATE_KEY] ?? {}) as LocalConnectionStateStore;
		delete states[id];
		return browser.storage.local.set({ [LOCAL_STATE_KEY]: states });
	});
};

export const getSyncConfigs = async (): Promise<SyncConnectionsStore> => {
	return ((await browser.storage.sync.get(SYNC_KEY))[SYNC_KEY] ??
		{}) as SyncConnectionsStore;
};

export const getLocalStates = async (): Promise<LocalConnectionStateStore> => {
	return ((await browser.storage.local.get(LOCAL_STATE_KEY))[LOCAL_STATE_KEY] ??
		{}) as LocalConnectionStateStore;
};
