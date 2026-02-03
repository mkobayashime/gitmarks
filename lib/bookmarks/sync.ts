import type { ResolvedBookmark } from "../types/manifest.ts";
import { getBookmarksInFolder } from "./api.ts";

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
