import type { BookmarkFolder } from "../../../lib/bookmarks/api.ts";
import type { Connection } from "../../../lib/types/connection.ts";
import { ConnectionCard } from "./ConnectionCard.tsx";

type Props = {
	connections: Connection[];
	folders: BookmarkFolder[];
	syncingIds: Set<string>;
	authenticated: boolean;
	onUpdate: (id: string, updates: Partial<Connection>) => Promise<void>;
	onRemove: (id: string) => Promise<void>;
	onPull: (
		connection: Connection,
	) => Promise<{ success: boolean; bookmarkCount?: number; error?: string }>;
	onSignIn: () => void;
	onAddClick: () => void;
	onToast: (message: string, type: "success" | "error" | "info") => void;
};

export const ConnectionList = ({
	connections,
	folders,
	syncingIds,
	authenticated,
	onUpdate,
	onRemove,
	onPull,
	onSignIn,
	onAddClick,
	onToast,
}: Props) => (
	<div className="flex flex-col gap-3">
		{connections.map((conn) => (
			<ConnectionCard
				key={conn.id}
				connection={conn}
				folders={folders}
				allConnections={connections}
				syncing={syncingIds.has(conn.id)}
				authenticated={authenticated}
				onUpdate={onUpdate}
				onRemove={onRemove}
				onPull={onPull}
				onSignIn={onSignIn}
				onToast={onToast}
			/>
		))}

		{/* Add placeholder */}
		<button
			type="button"
			onClick={onAddClick}
			className="rounded-lg border border-dashed border-gray-600 bg-gray-800 px-4 py-6 text-center text-sm text-gray-400 hover:border-gray-500 hover:text-gray-300"
		>
			+ Add repository
		</button>
	</div>
);
