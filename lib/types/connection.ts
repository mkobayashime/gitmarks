export type Connection = {
	id: string;
	repoFullName: string;
	repoOwner: string;
	repoName: string;
	srcDir: string;
	targetFolderId: string;
	targetFolderPath: string;
	enabled: boolean;
	lastSyncedAt: string | null;
	lastSyncedCommitSha: string | null;
	lastSyncError: string | null;
	createdAt: string;
};
