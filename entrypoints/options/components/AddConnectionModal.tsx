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
		// Client-side validation
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
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
			<div className="w-full max-w-md rounded-lg bg-gray-900 p-6 shadow-xl">
				<h2 className="mb-4 text-lg font-semibold text-white">
					Add new connection
				</h2>

				<span className="block mb-1 text-sm text-gray-300">Repository</span>
				<RepoCombobox
					repos={repos}
					loading={reposLoading}
					value={repo}
					onChange={setRepo}
				/>

				<label className="mt-4 block mb-1 text-sm text-gray-300">
					srcDir
					<input
						type="text"
						value={srcDir}
						placeholder="/"
						onChange={(e) => setSrcDir(e.target.value)}
						className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-500"
					/>
				</label>

				<span className="mt-4 block mb-1 text-sm text-gray-300">
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

				{error && <p className="mt-3 text-sm text-red-400">⚠ {error}</p>}

				<div className="mt-6 flex justify-between">
					<button
						type="button"
						onClick={onClose}
						className="rounded px-4 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={() => void handleAdd()}
						disabled={submitting || !repo || !targetFolderId}
						className="rounded bg-indigo-600 px-4 py-1.5 text-sm text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
					>
						Add
					</button>
				</div>
			</div>
		</div>
	);
};
