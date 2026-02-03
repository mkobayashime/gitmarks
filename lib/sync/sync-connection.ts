import { folderExists } from "../bookmarks/api.ts";
import { syncBookmarksToFolder } from "../bookmarks/sync.ts";
import { fetchFileContent, fetchLatestCommitSha } from "../github/api.ts";
import { parseManifest } from "../manifest/parser.ts";
import { updateConnection } from "../storage/connections.ts";
import type { Connection } from "../types/connection.ts";

export type SyncResult = {
	success: boolean;
	bookmarkCount?: number;
	skipped?: boolean;
	error?: string;
};

/**
 * Sync a single connection.
 * - force=true skips the commit hash check and always syncs.
 */
export const syncConnection = async (
	connection: Connection,
	token: string,
	options?: { force?: boolean },
): Promise<SyncResult> => {
	try {
		// 1. Validate target folder exists
		if (!(await folderExists(connection.targetFolderId))) {
			const error = "Target folder does not exist";
			await updateConnection(connection.id, { lastSyncError: error });
			return { success: false, error };
		}

		// Normalize srcDir: strip leading slash for API paths
		const apiPath =
			connection.srcDir === "/" ? "" : connection.srcDir.replace(/^\//, "");

		// 2. Fetch latest commit SHA
		const commitSha = await fetchLatestCommitSha(
			token,
			connection.repoOwner,
			connection.repoName,
			apiPath,
		);

		// 3. Skip check
		if (!options?.force && commitSha === connection.lastSyncedCommitSha) {
			return { success: true, skipped: true };
		}

		// 4. Fetch manifest.json
		const manifestPath = apiPath ? `${apiPath}/manifest.json` : "manifest.json";
		const manifestContent = await fetchFileContent(
			token,
			connection.repoOwner,
			connection.repoName,
			manifestPath,
		);

		if (manifestContent === null) {
			const error = `srcDir "${connection.srcDir}" does not contain manifest.json`;
			await updateConnection(connection.id, { lastSyncError: error });
			return { success: false, error };
		}

		// 5. Parse and resolve bookmarks
		const bookmarks = await parseManifest(
			manifestContent,
			connection.srcDir,
			token,
			connection.repoOwner,
			connection.repoName,
		);

		// 6. Sync to target folder
		const count = await syncBookmarksToFolder(
			connection.targetFolderId,
			bookmarks,
		);

		// 7. Update connection state
		await updateConnection(connection.id, {
			lastSyncedAt: new Date().toISOString(),
			lastSyncedCommitSha: commitSha,
			lastSyncError: null,
		});

		return { success: true, bookmarkCount: count };
	} catch (err) {
		const error = err instanceof Error ? err.message : "Unknown sync error";
		await updateConnection(connection.id, { lastSyncError: error });
		return { success: false, error };
	}
};
