import type { Browser } from "@wxt-dev/browser";

export type BookmarkTreeFolder = {
	id: string;
	title: string;
	path: string;
	depth: number;
	children: BookmarkTreeFolder[];
};

/**
 * Build a tree structure from Chrome bookmark tree nodes.
 */
const buildTree = (
	nodes: Browser.bookmarks.BookmarkTreeNode[],
	parentPath: string,
	depth: number,
): BookmarkTreeFolder[] => {
	const folders: BookmarkTreeFolder[] = [];

	for (const node of nodes) {
		if (node.url) continue;
		const path = parentPath ? `${parentPath} > ${node.title}` : node.title;
		const folder: BookmarkTreeFolder = {
			id: node.id,
			title: node.title,
			path,
			depth,
			children: node.children ? buildTree(node.children, path, depth + 1) : [],
		};
		folders.push(folder);
	}

	return folders;
};

/**
 * Get all bookmark folders as a tree structure.
 */
export const getFolderTree = async (): Promise<BookmarkTreeFolder[]> => {
	const tree = await browser.bookmarks.getTree();
	const rootChildren = tree[0]?.children ?? [];
	return buildTree(rootChildren, "", 0);
};

/**
 * Find a folder in the tree by ID.
 */
export const findFolderInTree = (
	folders: BookmarkTreeFolder[],
	id: string,
): BookmarkTreeFolder | null => {
	for (const folder of folders) {
		if (folder.id === id) return folder;
		const found = findFolderInTree(folder.children, id);
		if (found) return found;
	}
	return null;
};

/**
 * Get all ancestor IDs for a folder.
 */
export const getAncestorIds = (
	folders: BookmarkTreeFolder[],
	targetId: string,
): string[] => {
	const findPath = (
		node: BookmarkTreeFolder,
		targetId: string,
		path: string[],
	): string[] | null => {
		if (node.id === targetId) return [...path, node.id];
		for (const child of node.children) {
			const result = findPath(child, targetId, [...path, node.id]);
			if (result) return result;
		}
		return null;
	};

	for (const folder of folders) {
		const result = findPath(folder, targetId, []);
		if (result) return result;
	}
	return [];
};
