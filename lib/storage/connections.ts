import type { Connection } from "../types/connection.ts";

const CONNECTIONS_KEY = "local:gitmarks_connections";

export const getConnections = async (): Promise<Connection[]> => {
	return (await storage.getItem<Connection[]>(CONNECTIONS_KEY)) ?? [];
};

export const saveConnections = async (
	connections: Connection[],
): Promise<void> => {
	await storage.setItem(CONNECTIONS_KEY, connections);
};

export const addConnection = async (connection: Connection): Promise<void> => {
	const connections = await getConnections();
	connections.push(connection);
	await saveConnections(connections);
};

export const updateConnection = async (
	id: string,
	updates: Partial<Connection>,
): Promise<void> => {
	const connections = await getConnections();
	const index = connections.findIndex((c) => c.id === id);
	if (index === -1) return;
	connections[index] = { ...connections[index], ...updates };
	await saveConnections(connections);
};

export const removeConnection = async (id: string): Promise<void> => {
	const connections = await getConnections();
	await saveConnections(connections.filter((c) => c.id !== id));
};
