# Cross-Browser Connection Settings Sync

## Overview

Migrate connection storage from `chrome.storage.local` to a split approach:
- **Configuration** (repo settings, enabled status) → `chrome.storage.sync`
- **State** (sync timestamps, folder IDs, errors) → `chrome.storage.local`

This allows connection settings to sync across browsers while keeping per-browser sync state independent.

---

## Data Structure Changes

### Type Definitions (`lib/types/connection.ts`)

Add new types while keeping the merged `Connection` type for backward compatibility:

```typescript
/**
 * Configuration synced across browsers via chrome.storage.sync
 */
export type ConnectionConfig = {
	id: string;
	repoFullName: string;
	repoOwner: string;
	repoName: string;
	srcDir: string;
	targetFolderPath: string;  // Synced for folder identification
	enabled: boolean;
	createdAt: string;
};

/**
 * Browser-specific state stored in chrome.storage.local
 */
export type ConnectionState = {
	targetFolderId: string;  // Chrome folder IDs are browser-specific
	lastSyncedAt: string | null;
	lastSyncedCommitSha: string | null;
	lastSyncError: string | null;
};

// Keep existing merged type for compatibility
export type Connection = ConnectionConfig & ConnectionState;

// Storage types (Record for O(1) lookups)
export type SyncConnectionsStore = Record<string, ConnectionConfig>;
export type LocalConnectionStateStore = Record<string, ConnectionState>;
```

---

## Implementation

### 1. Storage Layer Rewrite (`lib/storage/connections.ts`)

Replace array-based operations with dual-storage approach:

**Keys:**
- `sync:gitmarks_connections` - Connection configs (synced)
- `local:gitmarks_connection_state` - Per-browser state (local)

**Core operations:**

```typescript
const SYNC_KEY = "sync:gitmarks_connections";
const LOCAL_STATE_KEY = "local:gitmarks_connection_state";

// Get all connections (merge sync config + local state)
export const getConnections = async (): Promise<Connection[]> => {
	const [configs, states] = await Promise.all([
		browser.storage.sync.get(SYNC_KEY).then(r => r[SYNC_KEY] ?? {}),
		browser.storage.local.get(LOCAL_STATE_KEY).then(r => r[LOCAL_STATE_KEY] ?? {}),
	]);

	// Only return connections with BOTH config AND state
	return Object.entries(configs)
		.filter(([id]) => id in states)
		.map(([id, config]) => ({ ...config, ...states[id] }));
};

// Save/update connection (writes to both storage areas)
export const saveConnection = async (connection: Connection): Promise<void> => {
	const { targetFolderId, lastSyncedAt, lastSyncedCommitSha, lastSyncError, ...config } = connection;

	const state: ConnectionState = {
		targetFolderId,
		lastSyncedAt,
		lastSyncedCommitSha,
		lastSyncError,
	};

	await Promise.all([
		browser.storage.sync.get(SYNC_KEY).then(result => {
			const configs = result[SYNC_KEY] ?? {};
			configs[connection.id] = config;
			return browser.storage.sync.set({ [SYNC_KEY]: configs });
		}),
		browser.storage.local.get(LOCAL_STATE_KEY).then(result => {
			const states = result[LOCAL_STATE_KEY] ?? {};
			states[connection.id] = state;
			return browser.storage.local.set({ [LOCAL_STATE_KEY]: states });
		}),
	]);
};

// Update connection (auto-detects sync vs local fields)
export const updateConnection = async (id: string, updates: Partial<Connection>): Promise<void> => {
	const configKeys: (keyof ConnectionConfig)[] = [
		"id", "repoFullName", "repoOwner", "repoName",
		"srcDir", "targetFolderPath", "enabled", "createdAt",
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

// Remove connection from both storage areas
export const removeConnection = async (id: string): Promise<void> => {
	await Promise.all([
		deleteFromSync(id),
		deleteFromLocal(id),
	]);
};
```

---

### 2. Migration (`lib/storage/migrations.ts`)

One-time migration from legacy array storage to split storage:

```typescript
const LEGACY_KEY = "local:gitmarks_connections";
const MIGRATION_FLAG = "local:migration_v1_split_storage";

export const migrateToSplitStorage = async (): Promise<void> => {
	// Skip if already migrated
	const { [MIGRATION_FLAG]: completed } = await browser.storage.local.get(MIGRATION_FLAG);
	if (completed) return;

	// Get legacy data
	const { [LEGACY_KEY]: legacy } = await browser.storage.local.get(LEGACY_KEY);
	if (!legacy || !Array.isArray(legacy)) {
		await browser.storage.local.set({ [MIGRATION_FLAG]: true });
		return;
	}

	// Split each connection
	const syncConfigs: SyncConnectionsStore = {};
	const localStates: LocalConnectionStateStore = {};

	for (const conn of legacy) {
		const { targetFolderId, lastSyncedAt, lastSyncedCommitSha, lastSyncError, ...config } = conn;
		syncConfigs[conn.id] = config;
		localStates[conn.id] = { targetFolderId, lastSyncedAt, lastSyncedCommitSha, lastSyncError };
	}

	// Save to new locations
	await Promise.all([
		browser.storage.sync.set({ [SYNC_KEY]: syncConfigs }),
		browser.storage.local.set({ [LOCAL_STATE_KEY]: localStates }),
	]);

	// Cleanup and flag
	await browser.storage.local.remove(LEGACY_KEY);
	await browser.storage.local.set({ [MIGRATION_FLAG]: true });
};
```

**Trigger migration:** Call in `entrypoints/options/App.tsx` on mount.

---

### 3. Orphan Config Handling (`lib/storage/orphan-configs.ts`)

When Browser B receives a synced connection with no local state, auto-create the folder at the synced path:

```typescript
import { getOrCreateFolder } from "../bookmarks/api.ts";

/**
 * Get configs that exist in sync but not in local storage
 */
export const getOrphanConfigs = async (): Promise<ConnectionConfig[]> => {
	const [configs, states] = await Promise.all([
		browser.storage.sync.get(SYNC_KEY).then(r => r[SYNC_KEY] ?? {}),
		browser.storage.local.get(LOCAL_STATE_KEY).then(r => r[LOCAL_STATE_KEY] ?? {}),
	]);

	return Object.entries(configs)
		.filter(([id]) => !(id in states))
		.map(([, config]) => config);
};

/**
 * Auto-resolve all orphan configs by creating folders at synced paths
 * Returns the number of newly resolved connections
 */
export const autoResolveOrphanConfigs = async (): Promise<number> => {
	const orphans = await getOrphanConfigs();
	if (orphans.length === 0) return 0;

	let resolved = 0;
	for (const config of orphans) {
		const targetFolderId = await createFolderAtPath(config.targetFolderPath);
		await resolveOrphanConfig(config.id, targetFolderId);
		resolved++;
	}

	return resolved;
};

/**
 * Create a folder hierarchy from a path string like "Bookmarks Bar > Dev > GitMarks"
 * Assumes separator is " > " based on current implementation in lib/bookmarks/api.ts
 */
const createFolderAtPath = async (pathString: string): Promise<string> => {
	// Get bookmarks tree
	const tree = await browser.bookmarks.getTree();

	// Find root (Bookmarks Bar is typically ID "1")
	// Parse the path and create hierarchy
	const parts = pathString.split(" > ").filter(Boolean);
	if (parts.length === 0) throw new Error("Invalid folder path");

	// Start from Bookmarks Bar root
	const bookmarksBar = tree[0].children?.find(c => c.id === "1");
	if (!bookmarksBar?.id) throw new Error("Bookmarks Bar not found");

	let currentId = bookmarksBar.id;

	// Create or navigate through each folder level
	for (const folderName of parts) {
		currentId = await getOrCreateFolder(currentId, folderName);
	}

	return currentId;
};

/**
 * Create local state for an orphan config
 */
export const resolveOrphanConfig = async (
	id: string,
	targetFolderId: string,
): Promise<Connection> => {
	const { [SYNC_KEY]: configs } = await browser.storage.sync.get(SYNC_KEY);
	const config = configs?.[id];
	if (!config) throw new Error(`Config not found: ${id}`);

	const state: ConnectionState = {
		targetFolderId,
		lastSyncedAt: null,
		lastSyncedCommitSha: null,
		lastSyncError: null,
	};

	await browser.storage.local.get(LOCAL_STATE_KEY).then(result => {
		const states = result[LOCAL_STATE_KEY] ?? {};
		states[id] = state;
		return browser.storage.local.set({ [LOCAL_STATE_KEY]: states });
	});

	return { ...config, ...state };
};
```

---

### 4. Background Orphan Resolution

Silent auto-resolution in the options page - no UI notification needed:

```typescript
// entrypoints/options/App.tsx (or main entrypoint)

useEffect(() => {
	// Silently auto-resolve orphans on mount and when sync storage changes
	const resolveOrphans = async () => {
		await autoResolveOrphanConfigs();
	};

	void resolveOrphans();

	const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
		if (SYNC_KEY in changes) void resolveOrphans();
	};

	browser.storage.onChanged.addListener(listener);
	return () => browser.storage.onChanged.removeListener(listener);
}, []);
```

**Note:** When orphan configs are resolved, bookmarks are NOT synced immediately. The next periodic sync (60 min interval) will handle syncing these connections.

---

### 5. Cleanup for Deleted Connections

When a connection is deleted on Browser A, Browser B should clean up its orphaned local state:

```typescript
export const cleanupDeletedConnections = async (): Promise<void> => {
	const [configs, states] = await Promise.all([
		browser.storage.sync.get(SYNC_KEY).then(r => r[SYNC_KEY] ?? {}),
		browser.storage.local.get(LOCAL_STATE_KEY).then(r => r[LOCAL_STATE_KEY] ?? {}),
	]);

	// Find local states without corresponding configs
	const orphanStateIds = Object.keys(states).filter(id => !(id in configs));

	if (orphanStateIds.length > 0) {
		for (const id of orphanStateIds) {
			delete states[id];
		}
		await browser.storage.local.set({ [LOCAL_STATE_KEY]: states });
	}
};
```

Call this on app mount and when sync storage changes.

---

## Files to Modify

| File | Action |
|------|--------|
| `lib/types/connection.ts` | Add `ConnectionConfig`, `ConnectionState`, store types |
| `lib/storage/connections.ts` | Rewrite for dual-storage (sync + local) |
| `lib/storage/migrations.ts` | **CREATE** - One-time migration from array to split storage |
| `lib/storage/orphan-configs.ts` | **CREATE** - Orphan detection and auto-resolution |
| `entrypoints/options/App.tsx` | Add migration trigger, silent orphan resolution, cleanup |

---

## Key Implementation Notes

1. **WXT Storage API:** Use `sync:` prefix for `chrome.storage.sync` (e.g., `sync:gitmarks_connections`)

2. **User data remains local:** GitHub user profile (`local:gitmarks_user`) and access token (`local:github_access_token`) stay in `chrome.storage.local`. Each browser requires separate authentication.

3. **chrome.storage.sync limits:** 100KB quota per item, 8KB per key. Connection configs are small JSON objects (~200 bytes each), so ~500 connections would fit.

4. **Conflict resolution:** Last-write-wins is acceptable for connection settings since users typically configure on one browser at a time.

5. **targetFolderPath:** Included in sync storage to enable auto-creation of folder hierarchies across browsers, even though `targetFolderId` is local-only.

6. **Backward compatibility:** Keep the merged `Connection` type so existing code continues to work with minimal changes.

---

## Verification Plan

1. **Test migration:** Load extension with existing connections, verify they migrate correctly
2. **Test sync flow:**
   - Add connection on Browser A → verify appears on Browser B (auto-resolved with folder created)
   - Verify folder was created at the synced path on Browser B
   - Verify NO notification is shown on Browser B
   - Verify bookmarks are NOT synced immediately on Browser B (wait for next periodic sync)
   - Disable connection on Browser A → verify disabled on Browser B
   - Delete connection on Browser A → verify removed from Browser B after cleanup
3. **Test state independence:**
   - Sync on Browser A → verify `lastSyncedAt` on Browser B remains unchanged
4. **Test auto-creation:**
   - Create connection with path "Bookmarks Bar > Dev > GitMarks" on Browser A
   - Verify the folder hierarchy is created on Browser B (silent, no notification)
