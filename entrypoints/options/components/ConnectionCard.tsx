import { useState } from "react";
import type { BookmarkFolder } from "../../../lib/bookmarks/api.ts";
import type { Connection } from "../../../lib/types/connection.ts";
import { validateSrcDir } from "../../../lib/validation/src-dir.ts";
import { validateTargetFolder } from "../../../lib/validation/target-folder.ts";
import { DisconnectConfirmModal } from "./DisconnectConfirmModal.tsx";
import { ErrorSection } from "./ErrorSection.tsx";
import { FolderSelect } from "./FolderSelect.tsx";
import { SyncButton } from "./SyncButton.tsx";

type Props = {
	connection: Connection;
	folders: BookmarkFolder[];
	allConnections: Connection[];
	syncing: boolean;
	authenticated: boolean;
	onUpdate: (id: string, updates: Partial<Connection>) => Promise<void>;
	onRemove: (id: string) => Promise<void>;
	onPull: (
		connection: Connection,
	) => Promise<{ success: boolean; bookmarkCount?: number; error?: string }>;
	onSignIn: () => void;
	onToast: (message: string, type: "success" | "error" | "info") => void;
};

const formatDate = (iso: string | null): string => {
	if (!iso) return "Never synced";
	return new Date(iso).toLocaleString();
};

export const ConnectionCard = ({
	connection,
	folders,
	allConnections,
	syncing,
	authenticated,
	onUpdate,
	onRemove,
	onPull,
	onSignIn,
	onToast,
}: Props) => {
	const [expanded, setExpanded] = useState(false);
	const [disconnectOpen, setDisconnectOpen] = useState(false);
	const [srcDir, setSrcDir] = useState(connection.srcDir);
	const [targetFolderId, setTargetFolderId] = useState(
		connection.targetFolderId,
	);
	const [targetFolderPath, setTargetFolderPath] = useState(
		connection.targetFolderPath,
	);
	const [validationError, setValidationError] = useState<string | null>(null);

	const disabled = !authenticated || syncing;

	const statusColor = connection.lastSyncError
		? "bg-red-500"
		: connection.enabled
			? "bg-green-500"
			: "bg-gray-500";

	const statusLabel = connection.lastSyncError
		? "Error"
		: connection.enabled
			? "Active"
			: "Disabled";

	const handleToggle = () => {
		void onUpdate(connection.id, { enabled: !connection.enabled });
	};

	const handleSave = async () => {
		setValidationError(null);

		const srcError = validateSrcDir(srcDir);
		if (srcError) {
			setValidationError(srcError);
			return;
		}

		const folderError = await validateTargetFolder(
			targetFolderId,
			allConnections,
			connection.id,
		);
		if (folderError) {
			setValidationError(folderError);
			return;
		}

		try {
			await onUpdate(connection.id, {
				srcDir,
				targetFolderId,
				targetFolderPath,
			});
			onToast("Settings saved", "success");
		} catch (err) {
			setValidationError(err instanceof Error ? err.message : "Failed to save");
		}
	};

	const handlePull = async () => {
		const result = await onPull(connection);
		if (result.success) {
			onToast(`Synced ${result.bookmarkCount ?? 0} bookmarks`, "success");
		} else {
			onToast("Sync failed", "error");
		}
	};

	const handleDisconnect = async () => {
		await onRemove(connection.id);
		setDisconnectOpen(false);
		onToast("Connection removed", "info");
	};

	const displayError = validationError ?? connection.lastSyncError;

	return (
		<>
			<div
				className={`rounded-lg border bg-gray-800 ${
					connection.lastSyncError ? "border-red-700" : "border-gray-700"
				}`}
			>
				{/* Compact header — always visible, clickable to toggle */}
				<button
					type="button"
					onClick={() => setExpanded(!expanded)}
					className="w-full px-4 py-3 text-left"
				>
					<div className="flex items-center gap-2">
						<span className="text-gray-400">{expanded ? "▼" : "▶"}</span>
						<span className="font-medium text-white">
							{connection.repoFullName}
						</span>
					</div>
					<div className="mt-1 flex items-center gap-2 ml-5">
						<span
							className={`inline-block h-2 w-2 rounded-full ${statusColor}`}
						/>
						<span className="text-xs text-gray-400">{statusLabel}</span>
						<span className="text-xs text-gray-500">·</span>
						<span className="text-xs text-gray-500">
							Last synced: {formatDate(connection.lastSyncedAt)}
						</span>
					</div>
				</button>

				{/* Expanded body */}
				{expanded && (
					<div className="border-t border-gray-700 px-4 py-3">
						{/* Sign in required chip */}
						{!authenticated && (
							<button
								type="button"
								onClick={onSignIn}
								className="mb-3 rounded-full bg-yellow-600/20 px-3 py-0.5 text-xs text-yellow-300 hover:bg-yellow-600/30"
							>
								Sign in required
							</button>
						)}

						{/* Toggle */}
						<div className="flex items-center gap-2 mb-3">
							<button
								type="button"
								onClick={handleToggle}
								disabled={!authenticated}
								className={`relative h-5 w-9 rounded-full transition-colors disabled:opacity-40 ${
									connection.enabled ? "bg-indigo-600" : "bg-gray-600"
								}`}
							>
								<span
									className={`absolute top-0.5 left-0.5 inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
										connection.enabled ? "translate-x-4" : ""
									}`}
								/>
							</button>
							<span className="text-sm text-gray-300">
								{connection.enabled ? "Enabled" : "Disabled"}
							</span>
						</div>

						{/* srcDir */}
						<label className="block mb-1 text-sm text-gray-300">
							srcDir
							<input
								type="text"
								value={srcDir}
								placeholder="/"
								onChange={(e) => setSrcDir(e.target.value)}
								disabled={disabled || !connection.enabled}
								className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-1.5 text-sm text-white placeholder-gray-500 disabled:opacity-40"
							/>
						</label>

						{/* Target folder */}
						<span className="mt-3 block mb-1 text-sm text-gray-300">
							Target folder
						</span>
						<FolderSelect
							folders={folders}
							value={targetFolderId}
							onChange={(id, path) => {
								setTargetFolderId(id);
								setTargetFolderPath(path);
							}}
							disabled={disabled || !connection.enabled}
						/>

						{/* Action buttons */}
						<div className="mt-4 flex items-center justify-between">
							<div className="flex gap-2">
								<SyncButton
									syncing={syncing}
									disabled={disabled || !connection.enabled}
									onPull={() => void handlePull()}
								/>
								<button
									type="button"
									onClick={() => void handleSave()}
									disabled={disabled || !connection.enabled}
									className="rounded border border-gray-600 px-4 py-1.5 text-sm text-gray-200 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
								>
									Save
								</button>
							</div>
							<button
								type="button"
								onClick={() => setDisconnectOpen(true)}
								disabled={disabled}
								className="rounded px-3 py-1.5 text-sm text-red-400 hover:text-red-300 disabled:opacity-40"
							>
								Disconnect
							</button>
						</div>

						{/* Error section */}
						<ErrorSection
							error={displayError}
							onRetry={() => void handlePull()}
						/>
					</div>
				)}
			</div>

			<DisconnectConfirmModal
				open={disconnectOpen}
				repoFullName={connection.repoFullName}
				onConfirm={() => void handleDisconnect()}
				onClose={() => setDisconnectOpen(false)}
			/>
		</>
	);
};
