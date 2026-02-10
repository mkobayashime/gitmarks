import { getValidToken } from "../github/auth.ts";
import { getConnections } from "../storage/connections.ts";
import { type SyncResult, syncConnection } from "./sync-connection.ts";

export type SyncAllResult = {
	connectionId: string;
	result: SyncResult;
};

/**
 * Sync all enabled connections. Uses default (non-forced) sync,
 * allowing the commit-hash skip optimization.
 */
export const syncAllConnections = async (): Promise<SyncAllResult[]> => {
	const token = await getValidToken();
	if (!token) return [];

	const connections = await getConnections();
	const results: SyncAllResult[] = [];

	for (const conn of connections) {
		if (!conn.enabled) continue;
		const result = await syncConnection(conn, token);
		results.push({ connectionId: conn.id, result });
	}

	return results;
};
