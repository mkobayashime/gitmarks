import { folderExists } from "../bookmarks/api.ts";
import {
	type SyncTarget,
	syncBookmarksToSubfolders,
} from "../bookmarks/sync.ts";
import {
	fetchFileContent,
	fetchLatestCommitSha,
	findManifestFiles,
} from "../github/api.ts";
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
		if (!(await folderExists(connection.targetFolderId))) {
			const error = "Target folder does not exist";
			await updateConnection(connection.id, { lastSyncError: error });
			return { success: false, error };
		}

		const apiPath =
			connection.srcDir === "/" ? "" : connection.srcDir.replace(/^\//, "");

		const commitSha = await fetchLatestCommitSha(
			token,
			connection.repoOwner,
			connection.repoName,
			apiPath,
		);

		if (!options?.force && commitSha === connection.lastSyncedCommitSha) {
			return { success: true, skipped: true };
		}

		const manifestLocations = await findManifestFiles(
			token,
			connection.repoOwner,
			connection.repoName,
			apiPath,
		);

		if (manifestLocations.length === 0) {
			const error = `No manifest.json files found in srcDir "${connection.srcDir}"`;
			await updateConnection(connection.id, { lastSyncError: error });
			return { success: false, error };
		}

		const syncTargets: SyncTarget[] = [];
		for (const manifestLoc of manifestLocations) {
			const manifestContent = await fetchFileContent(
				token,
				connection.repoOwner,
				connection.repoName,
				manifestLoc.path,
			);

			if (manifestContent === null) {
				continue;
			}

			const manifestDir = `/${manifestLoc.path.replace(/\/manifest\.json$/, "")}`;

			const bookmarks = await parseManifest(
				manifestContent,
				manifestDir,
				token,
				connection.repoOwner,
				connection.repoName,
			);

			syncTargets.push({
				bookmarks,
				subfolderPath: manifestLoc.relativePath,
			});
		}

		const count = await syncBookmarksToSubfolders(
			connection.targetFolderId,
			syncTargets,
		);

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
