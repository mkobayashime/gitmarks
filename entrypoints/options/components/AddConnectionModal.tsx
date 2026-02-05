import { useState } from "react";
import type { BookmarkFolder } from "../../../lib/bookmarks/api.ts";
import type { Repository } from "../../../lib/github/types.ts";
import type { Connection } from "../../../lib/types/connection.ts";
import { validateSrcDir } from "../../../lib/validation/src-dir.ts";
import { validateTargetFolder } from "../../../lib/validation/target-folder.ts";
import { FolderSelect } from "./FolderSelect.tsx";
import { RepoCombobox } from "./RepoCombobox.tsx";

type Props = {
	open: boolean;
	repos: Repository[];
	reposLoading: boolean;
	folders: BookmarkFolder[];
	existingConnections: Connection[];
	onAdd: (connection: Connection) => void;
	onClose: () => void;
};

export const AddConnectionModal = ({
	open,
	repos,
	reposLoading,
	folders,
	existingConnections,
	onAdd,
	onClose,
}: Props) => {
	const [repo, setRepo] = useState<Repository | null>(null);
	const [srcDir, setSrcDir] = useState("/");
	const [targetFolderId, setTargetFolderId] = useState("");
	const [targetFolderPath, setTargetFolderPath] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	if (!open) return null;

	const handleAdd = async () => {
		const srcError = validateSrcDir(srcDir);
		if (srcError) {
			setError(srcError);
			return;
		}
		if (!repo) {
			setError("Repository is required");
			return;
		}
		if (!targetFolderId) {
			setError("Target folder is required");
			return;
		}

		setSubmitting(true);
		setError(null);

		try {
			const folderError = await validateTargetFolder(
				targetFolderId,
				existingConnections,
			);
			if (folderError) {
				setError(folderError);
				return;
			}

			const connection: Connection = {
				id: crypto.randomUUID(),
				repoFullName: repo.full_name,
				repoOwner: repo.owner.login,
				repoName: repo.name,
				srcDir,
				targetFolderId,
				targetFolderPath,
				enabled: true,
				lastSyncedAt: null,
				lastSyncedCommitSha: null,
				lastSyncError: null,
				createdAt: new Date().toISOString(),
			};

			onAdd(connection);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-md rounded-md border border-zinc-800 bg-zinc-950 p-6">
				<h2 className="mb-4 text-sm font-semibold text-zinc-100 tracking-tight">
					Add new connection
				</h2>

				<div className="mb-3">
					<span className="block mb-1 text-xs text-zinc-500">Repository</span>
					<RepoCombobox
						repos={repos}
						loading={reposLoading}
						value={repo}
						onChange={setRepo}
					/>
				</div>

				<label className="block mb-3">
					<span className="block mb-1 text-xs text-zinc-500">srcDir</span>
					<input
						type="text"
						value={srcDir}
						placeholder="/"
						onChange={(e) => setSrcDir(e.target.value)}
						className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-sm text-zinc-100 placeholder-zinc-600 focus:border-pink-500 focus:outline-none"
					/>
				</label>

				<div className="mb-3">
					<span className="block mb-1 text-xs text-zinc-500">
						Target folder
					</span>
					<FolderSelect
						folders={folders}
						value={targetFolderId}
						onChange={(id, path) => {
							setTargetFolderId(id);
							setTargetFolderPath(path);
						}}
					/>
				</div>

				{error && (
					<div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2">
						<p className="text-sm text-red-400">{error}</p>
					</div>
				)}

				<div className="mt-6 flex items-center justify-between">
					<button
						type="button"
						onClick={onClose}
						className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-400"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={() => void handleAdd()}
						disabled={submitting || !repo || !targetFolderId}
						className="rounded-md bg-pink-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-40"
					>
						Add
					</button>
				</div>
			</div>
		</div>
	);
};
