import { ChevronDownIcon, ChevronRightIcon } from "@primer/octicons-react";
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
	if (!iso) return "Never";
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

	const hasError = !!connection.lastSyncError;

	const statusDotClass = hasError
		? "bg-red-400"
		: connection.enabled
			? "bg-emerald-400"
			: "bg-zinc-500";

	const statusTextClass = hasError
		? "text-red-400"
		: connection.enabled
			? "text-emerald-400"
			: "text-zinc-500";

	const statusLabel = hasError
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
				className={`rounded-md border bg-zinc-900 ${hasError ? "border-red-500/30" : "border-zinc-800"}`}
			>
				{/* Compact header row */}
				<button
					type="button"
					onClick={() => setExpanded(!expanded)}
					className="w-full px-4 py-3 text-left"
				>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<span className="text-sm font-mono text-zinc-100">
								{connection.repoFullName}
							</span>
						</div>
						{expanded ? (
							<ChevronDownIcon className="text-zinc-600" />
						) : (
							<ChevronRightIcon className="text-zinc-600" />
						)}
					</div>
					<div className="mt-1 flex flex-col gap-1">
						<div
							className={`flex items-center gap-1 text-xs ${statusTextClass}`}
						>
							<span
								className={`inline-block h-1.5 w-1.5 rounded-full ${statusDotClass}`}
							/>
							{statusLabel}
						</div>
						<span className="font-mono text-xs text-zinc-600">
							Last sync {formatDate(connection.lastSyncedAt)}
						</span>
					</div>
				</button>

				{/* Expanded body */}
				{expanded && (
					<div className="border-t border-zinc-800 px-4 pb-4 pt-3">
						{/* Auth required */}
						{!authenticated && (
							<button
								type="button"
								onClick={onSignIn}
								className="mb-3 rounded border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-0.5 text-sm text-yellow-400"
							>
								Sign in required
							</button>
						)}

						{/* Toggle row */}
						<div className="mb-3 flex items-center gap-2">
							<button
								type="button"
								onClick={handleToggle}
								disabled={!authenticated}
								className={`relative h-5 w-9 rounded-full transition-colors disabled:opacity-50 ${connection.enabled ? "bg-indigo-600" : "bg-zinc-700"}`}
							>
								<span
									className="absolute top-0.5 inline-block h-4 w-4 rounded-full bg-white shadow shadow-black/40 transition-all"
									style={{
										left: connection.enabled ? "calc(100% - 18px)" : "2px",
									}}
								/>
							</button>
							<span className="text-xs text-zinc-400">
								{connection.enabled ? "Enabled" : "Disabled"}
							</span>
						</div>

						{/* srcDir */}
						<label className="block mb-3">
							<span className="block mb-1 text-xs text-zinc-500">
								Source directory (on repository)
							</span>
							<input
								type="text"
								value={srcDir}
								placeholder="/"
								onChange={(e) => setSrcDir(e.target.value)}
								disabled={disabled || !connection.enabled}
								className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none disabled:opacity-40"
							/>
						</label>

						{/* Target folder */}
						<div className="mb-4">
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
								disabled={disabled || !connection.enabled}
							/>
						</div>

						{/* Actions */}
						<div className="flex items-center justify-between">
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
									className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-400 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
								>
									Save
								</button>
							</div>
							<button
								type="button"
								onClick={() => setDisconnectOpen(true)}
								disabled={disabled}
								className="rounded-md px-2.5 py-1.5 text-sm text-red-400 hover:text-red-300 disabled:opacity-40"
							>
								Disconnect
							</button>
						</div>

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
