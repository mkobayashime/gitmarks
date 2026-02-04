import type { ResolvedBookmark } from "../types/manifest.ts";
import { getBookmarksInFolder, getOrCreateFolder } from "./api.ts";

export type SyncTarget = {
	bookmarks: ResolvedBookmark[];
	subfolderPath?: string;
};

/**
 * Sync resolved bookmarks to a Chrome bookmark folder.
 * Deletes all existing bookmarks in the folder, then creates new ones.
 * Returns the number of bookmarks created.
 */
export const syncBookmarksToFolder = async (
	targetFolderId: string,
	bookmarks: ResolvedBookmark[],
): Promise<number> => {
	// Delete existing bookmarks in folder
	const existing = await getBookmarksInFolder(targetFolderId);
	for (const bm of existing) {
		await browser.bookmarks.remove(bm.id);
	}

	// Create new bookmarks
	for (const bm of bookmarks) {
		await browser.bookmarks.create({
			parentId: targetFolderId,
			title: bm.name,
			url: bm.url,
		});
	}

	return bookmarks.length;
};

/**
 * Sync multiple bookmark sets to different subfolders within a target folder.
 * Cleans up old subfolders that are no longer in use.
 */
export const syncBookmarksToSubfolders = async (
	targetFolderId: string,
	syncTargets: SyncTarget[],
): Promise<number> => {
	const allChildren = await browser.bookmarks.getChildren(targetFolderId);
	for (const child of allChildren) {
		await browser.bookmarks.removeTree(child.id);
	}

	let totalBookmarks = 0;
	for (const syncTarget of syncTargets) {
		let folderId = targetFolderId;

		if (syncTarget.subfolderPath && syncTarget.subfolderPath !== "") {
			const pathParts = syncTarget.subfolderPath.split("/");
			for (const part of pathParts) {
				folderId = await getOrCreateFolder(folderId, part);
			}
		}

		for (const bm of syncTarget.bookmarks) {
			await browser.bookmarks.create({
				parentId: folderId,
				title: bm.name,
				url: bm.url,
			});
			totalBookmarks++;
		}
	}

	return totalBookmarks;
};
