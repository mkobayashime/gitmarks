import { PlusIcon } from "@primer/octicons-react";
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
	<div className="flex flex-col gap-2">
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

		<button
			type="button"
			onClick={onAddClick}
			className="cursor-pointer flex items-center justify-center gap-2 rounded-md border border-dashed border-zinc-700 px-4 py-4 text-sm text-zinc-500 transition-colors hover:border-pink-500 hover:text-pink-400"
		>
			<PlusIcon />
			Add repository
		</button>
	</div>
);
