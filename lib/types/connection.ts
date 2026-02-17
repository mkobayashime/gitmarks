export type ConnectionConfig = {
	id: string;
	repoFullName: string;
	repoOwner: string;
	repoName: string;
	srcDir: string;
	targetFolderPath: string;
	enabled: boolean;
	createdAt: string;
};

export type ConnectionState = {
	targetFolderId: string;
	lastSyncedAt: string | null;
	lastSyncedCommitSha: string | null;
	lastSyncError: string | null;
	lastSyncSkipped?: boolean;
};

export type Connection = ConnectionConfig & ConnectionState;

export type SyncConnectionsStore = Record<string, ConnectionConfig>;
export type LocalConnectionStateStore = Record<string, ConnectionState>;
