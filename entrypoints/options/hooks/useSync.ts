import { useCallback, useState } from "react";
import { getValidToken } from "../../../lib/github/auth.ts";
import { getConnections } from "../../../lib/storage/connections.ts";
import { syncConnection } from "../../../lib/sync/sync-connection.ts";
import type { Connection } from "../../../lib/types/connection.ts";

export const useSync = (onSynced?: () => void) => {
	const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());

	const pull = useCallback(
		async (connection: Connection) => {
			setSyncingIds((prev) => new Set(prev).add(connection.id));
			try {
				const token = await getValidToken();
				if (!token) throw new Error("Not authenticated");

				// Re-read connection from storage to get latest state
				const connections = await getConnections();
				const fresh =
					connections.find((c) => c.id === connection.id) ?? connection;

				const result = await syncConnection(fresh, token, { force: true });
				return result;
			} finally {
				setSyncingIds((prev) => {
					const next = new Set(prev);
					next.delete(connection.id);
					return next;
				});
				onSynced?.();
			}
		},
		[onSynced],
	);

	return { syncingIds, pull };
};
