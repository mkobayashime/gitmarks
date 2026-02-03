import { useCallback, useEffect, useState } from "react";
import {
	addConnection,
	getConnections,
	removeConnection,
	updateConnection,
} from "../../../lib/storage/connections.ts";
import type { Connection } from "../../../lib/types/connection.ts";

export const useConnections = () => {
	const [connections, setConnections] = useState<Connection[]>([]);

	const refresh = useCallback(async () => {
		setConnections(await getConnections());
	}, []);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	const add = useCallback(
		async (connection: Connection) => {
			await addConnection(connection);
			await refresh();
		},
		[refresh],
	);

	const update = useCallback(
		async (id: string, updates: Partial<Connection>) => {
			await updateConnection(id, updates);
			await refresh();
		},
		[refresh],
	);

	const remove = useCallback(
		async (id: string) => {
			await removeConnection(id);
			await refresh();
		},
		[refresh],
	);

	return { connections, refresh, add, update, remove };
};
