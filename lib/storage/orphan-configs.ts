import { getOrCreateFolder } from "../bookmarks/api.ts";
import type {
	Connection,
	ConnectionConfig,
	ConnectionState,
	LocalConnectionStateStore,
	SyncConnectionsStore,
} from "../types/connection.ts";

const SYNC_KEY = "sync:gitmarks_connections";
const LOCAL_STATE_KEY = "local:gitmarks_connection_state";

export const getOrphanConfigs = async (): Promise<ConnectionConfig[]> => {
	const [configs, states] = await Promise.all([
		browser.storage.sync
			.get(SYNC_KEY)
			.then((r) => (r[SYNC_KEY] ?? {}) as SyncConnectionsStore),
		browser.storage.local
			.get(LOCAL_STATE_KEY)
			.then((r) => (r[LOCAL_STATE_KEY] ?? {}) as LocalConnectionStateStore),
	]);

	return Object.entries(configs)
		.filter(([id]) => !(id in states))
		.map(([, config]) => config);
};

export const autoResolveOrphanConfigs = async (): Promise<number> => {
	const orphans = await getOrphanConfigs();
	if (orphans.length === 0) return 0;

	let resolved = 0;
	for (const config of orphans) {
		try {
			const targetFolderId = await createFolderAtPath(config.targetFolderPath);
			await resolveOrphanConfig(config.id, targetFolderId);
			resolved++;
		} catch (error) {
			console.error(`Failed to resolve orphan config ${config.id}:`, error);
		}
	}

	return resolved;
};

const createFolderAtPath = async (pathString: string): Promise<string> => {
	const tree = await browser.bookmarks.getTree();

	const parts = pathString.split(" > ").filter(Boolean);
	if (parts.length === 0) throw new Error("Invalid folder path");

	const rootChildren = tree[0].children ?? [];
	const rootFolder = rootChildren.find((c) => c.title === parts[0]);

	if (!rootFolder?.id) {
		throw new Error(`Root folder not found: ${parts[0]}`);
	}

	let currentId = rootFolder.id;

	for (let i = 1; i < parts.length; i++) {
		currentId = await getOrCreateFolder(currentId, parts[i]);
	}

	return currentId;
};

export const resolveOrphanConfig = async (
	id: string,
	targetFolderId: string,
): Promise<Connection> => {
	const { [SYNC_KEY]: configs } = await browser.storage.sync.get(SYNC_KEY);
	const config = (configs as SyncConnectionsStore)?.[id];
	if (!config) throw new Error(`Config not found: ${id}`);

	const state: ConnectionState = {
		targetFolderId,
		lastSyncedAt: null,
		lastSyncedCommitSha: null,
		lastSyncError: null,
	};

	await browser.storage.local.get(LOCAL_STATE_KEY).then((result) => {
		const states = (result[LOCAL_STATE_KEY] ?? {}) as LocalConnectionStateStore;
		states[id] = state;
		return browser.storage.local.set({ [LOCAL_STATE_KEY]: states });
	});

	return { ...config, ...state };
};

export const cleanupDeletedConnections = async (): Promise<void> => {
	const [configs, states] = await Promise.all([
		browser.storage.sync
			.get(SYNC_KEY)
			.then((r) => (r[SYNC_KEY] ?? {}) as SyncConnectionsStore),
		browser.storage.local
			.get(LOCAL_STATE_KEY)
			.then((r) => (r[LOCAL_STATE_KEY] ?? {}) as LocalConnectionStateStore),
	]);

	const orphanStateIds = Object.keys(states).filter((id) => !(id in configs));

	if (orphanStateIds.length > 0) {
		for (const id of orphanStateIds) {
			delete states[id];
		}
		await browser.storage.local.set({ [LOCAL_STATE_KEY]: states });
	}
};
