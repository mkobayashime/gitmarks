export type BookmarkFolder = {
	id: string;
	title: string;
	path: string;
};

/**
 * Recursively collect all folders from a bookmark tree node.
 */
const collectFolders = (
	nodes: chrome.bookmarks.BookmarkTreeNode[],
	parentPath: string,
): BookmarkFolder[] => {
	const folders: BookmarkFolder[] = [];

	for (const node of nodes) {
		if (node.url) continue; // skip bookmarks, only folders
		const path = parentPath ? `${parentPath} > ${node.title}` : node.title;
		folders.push({ id: node.id, title: node.title, path });
		if (node.children) {
			folders.push(...collectFolders(node.children, path));
		}
	}

	return folders;
};

/**
 * Get all bookmark folders with hierarchical paths.
 */
export const getAllFolders = async (): Promise<BookmarkFolder[]> => {
	const tree = await browser.bookmarks.getTree();
	// The tree root contains children: "Bookmarks Menu" (id 1), "Other Bookmarks" (id 2), "Synced Bookmarks" (id 3)
	// We expose them all starting from their title as root path
	return collectFolders(tree, "");
};

/**
 * Get a single folder by ID. Returns null if not found.
 */
export const getFolderById = async (id: string): Promise<BookmarkFolder | null> => {
	try {
		const nodes = await browser.bookmarks.get(id);
		if (nodes.length === 0 || nodes[0].url) return null;
		return { id: nodes[0].id, title: nodes[0].title, path: nodes[0].title };
	} catch {
		return null;
	}
};

/**
 * Check if a bookmark folder still exists.
 */
export const folderExists = async (id: string): Promise<boolean> => {
	try {
		const nodes = await browser.bookmarks.get(id);
		return nodes.length > 0 && !nodes[0].url;
	} catch {
		return false;
	}
};

/**
 * Get direct child bookmarks (non-folder) in a folder.
 */
export const getBookmarksInFolder = async (
	folderId: string,
): Promise<chrome.bookmarks.BookmarkTreeNode[]> => {
	const children = await browser.bookmarks.getChildren(folderId);
	return children.filter((c) => c.url !== undefined);
};
