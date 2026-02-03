import type { Connection } from "../types/connection.ts";

/**
 * Check if two folder IDs have an ancestor/descendant relationship
 * by walking up from each folder using the Chrome bookmarks API.
 */
const getAncestorIds = async (folderId: string): Promise<Set<string>> => {
	const ancestors = new Set<string>();
	let currentId: string | undefined = folderId;

	while (currentId) {
		const nodes: { id: string; parentId?: string }[] =
			await browser.bookmarks.get(currentId);
		const node = nodes[0];
		if (!node || !node.parentId) break;
		ancestors.add(node.parentId);
		currentId = node.parentId;
	}

	return ancestors;
};

/**
 * Validate that a target folder does not overlap with any existing connection's
 * target folder. Overlap means same folder, or ancestor/descendant relationship.
 * Pass `excludeConnectionId` to skip the connection being edited.
 */
export const validateTargetFolder = async (
	targetFolderId: string,
	connections: Connection[],
	excludeConnectionId?: string,
): Promise<string | null> => {
	const ancestors = await getAncestorIds(targetFolderId);

	for (const conn of connections) {
		if (excludeConnectionId && conn.id === excludeConnectionId) continue;

		// Same folder
		if (conn.targetFolderId === targetFolderId) {
			return "This folder conflicts with another connection. Choose a different folder.";
		}

		// targetFolderId is an ancestor of an existing connection's folder
		const existingAncestors = await getAncestorIds(conn.targetFolderId);
		if (existingAncestors.has(targetFolderId)) {
			return "This folder conflicts with another connection. Choose a different folder.";
		}

		// targetFolderId is a descendant of an existing connection's folder
		if (ancestors.has(conn.targetFolderId)) {
			return "This folder conflicts with another connection. Choose a different folder.";
		}
	}

	return null;
};
