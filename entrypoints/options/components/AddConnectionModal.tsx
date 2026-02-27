import { Steps } from "@ark-ui/react";
import { SyncIcon } from "@primer/octicons-react";
import { useState } from "react";
import type { BookmarkTreeFolder } from "../../../lib/bookmarks/tree.ts";
import { getAncestorIds, getFolderTree } from "../../../lib/bookmarks/tree.ts";
import type { Repository } from "../../../lib/github/schemas.ts";
import type { Connection } from "../../../lib/types/connection.ts";
import { validateSrcDir } from "../../../lib/validation/src-dir.ts";
import { validateTargetFolder } from "../../../lib/validation/target-folder.ts";
import { Button } from "./Button";
import { FolderTree } from "./FolderTree.tsx";
import { RepoCombobox } from "./RepoCombobox.tsx";

type Props = {
	repos: Repository[];
	reposLoading: boolean;
	existingConnections: Connection[];
	onAdd: (connection: Connection) => void;
	onClose: () => void;
};

export const AddConnectionModal = ({
	repos,
	reposLoading,
	existingConnections,
	onAdd,
	onClose,
}: Props) => {
	const [currentStep, setCurrentStep] = useState(0);
	const [repo, setRepo] = useState<Repository | null>(null);
	const [srcDir, setSrcDir] = useState("/");
	const [targetFolderId, setTargetFolderId] = useState("");
	const [targetFolderPath, setTargetFolderPath] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	// Folder tree state for step 2
	const [folders, setFolders] = useState<BookmarkTreeFolder[]>([]);
	const [folderTreeLoading, setFolderTreeLoading] = useState(false);
	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
	const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
	const [hasLoadedFolderTree, setHasLoadedFolderTree] = useState(false);

	const loadFolderTree = () => {
		setFolderTreeLoading(true);
		void getFolderTree()
			.then((tree) => {
				setFolders(tree);
				if (targetFolderId) {
					setSelectedFolderId(targetFolderId);
					const ancestors = getAncestorIds(tree, targetFolderId);
					setExpandedIds(new Set(ancestors.slice(0, -1)));
				} else {
					setSelectedFolderId(null);
				}
			})
			.finally(() => {
				setFolderTreeLoading(false);
				setHasLoadedFolderTree(true);
			});
	};

	const handleStepChange = (details: { step: number }) => {
		setCurrentStep(details.step);
		if (details.step === 1 && !hasLoadedFolderTree) {
			loadFolderTree();
		}
	};

	const handleNext = () => {
		const srcError = validateSrcDir(srcDir);
		if (srcError) {
			setError(srcError);
			return;
		}
		if (!repo) {
			setError("Repository is required");
			return;
		}
		setError(null);
		setCurrentStep(1);
		if (!hasLoadedFolderTree) {
			loadFolderTree();
		}
	};

	const handleBack = () => {
		setCurrentStep(0);
		setError(null);
	};

	const toggleExpand = (id: string) => {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	const handleSelectFolder = (id: string) => {
		setSelectedFolderId(id);

		const findFolder = (
			folderList: BookmarkTreeFolder[],
			targetId: string,
		): BookmarkTreeFolder | null => {
			for (const folder of folderList) {
				if (folder.id === targetId) return folder;
				const found = findFolder(folder.children, targetId);
				if (found) return found;
			}
			return null;
		};

		const selectedFolder = findFolder(folders, id);
		if (selectedFolder) {
			setTargetFolderId(selectedFolder.id);
			setTargetFolderPath(selectedFolder.path);
		}
	};

	const handleRefreshFolders = () => {
		loadFolderTree();
	};

	const handleAdd = async () => {
		if (!targetFolderId) {
			setError("Target folder is required");
			return;
		}
		if (!repo) {
			setError("Repository is required");
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
			<div className="grid grid-rows-[max-content_minmax(0,1fr)_max-content] gap-4 w-full max-w-lg h-120 rounded-md border border-zinc-800 bg-zinc-950 p-6">
				<h2 className="text-base font-semibold text-zinc-100 tracking-tight">
					Add new connection
				</h2>

				<Steps.Root
					count={2}
					step={currentStep}
					onStepChange={handleStepChange}
					linear
					className="flex flex-col gap-4 overflow-hidden"
				>
					<Steps.List className="flex items-center justify-center gap-4">
						<Steps.Item index={0} className="flex items-center gap-4">
							<Steps.Trigger className="group relative flex items-center gap-2">
								<Steps.Indicator className="flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors data-[current]:border-pink-500 data-[current]:bg-pink-500 data-[current]:text-white data-[complete]:border-pink-500 data-[complete]:bg-pink-500 data-[complete]:text-white data-[incomplete]:border-zinc-700 data-[incomplete]:text-zinc-500">
									1
								</Steps.Indicator>
								<span className="text-xs font-medium transition-colors text-zinc-100">
									Repository
								</span>
							</Steps.Trigger>
							<Steps.Separator className="h-0.5 w-10 data-[complete]:bg-pink-500 bg-zinc-600" />
						</Steps.Item>
						<Steps.Item index={1} className="flex items-center">
							<Steps.Trigger className="group relative flex items-center gap-2">
								<Steps.Indicator className="flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors data-[current]:border-pink-500 data-[current]:bg-pink-500 data-[current]:text-white data-[complete]:border-pink-500 data-[complete]:bg-pink-500 data-[complete]:text-white data-[incomplete]:border-zinc-700 data-[incomplete]:text-zinc-500">
									2
								</Steps.Indicator>
								<span className="text-xs font-medium transition-colors text-zinc-100">
									Target Folder
								</span>
							</Steps.Trigger>
						</Steps.Item>
					</Steps.List>

					<Steps.Content index={0} className="min-h-0">
						<div className="mb-3">
							<span className="block mb-1 text-xs text-zinc-500">
								Repository
							</span>
							<RepoCombobox
								repos={repos}
								loading={reposLoading}
								value={repo}
								onChange={setRepo}
							/>
						</div>

						<label className="block mb-3">
							<span className="block mb-1 text-xs text-zinc-500">
								Source directory (on repository)
							</span>
							<input
								type="text"
								value={srcDir}
								placeholder="/"
								onChange={(e) => setSrcDir(e.target.value)}
								className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-sm text-zinc-100 placeholder-zinc-600 transition-colors focus:border-pink-500 focus:outline-none"
							/>
						</label>
					</Steps.Content>

					<Steps.Content index={1} className="min-h-0 flex flex-col">
						<div className="mb-2 flex items-center justify-between flex-shrink-0">
							<span className="block text-xs text-zinc-500">Target folder</span>
							<Button
								kind="text"
								size="sm"
								icon={<SyncIcon size={12} />}
								onClick={handleRefreshFolders}
							>
								Refresh
							</Button>
						</div>

						<div className="overflow-y-auto rounded-md border border-zinc-800 bg-zinc-900/50 p-2 min-h-0">
							{folderTreeLoading ? (
								<p className="px-3 py-2 text-xs text-zinc-500">
									Loading folders...
								</p>
							) : (
								<FolderTree
									folders={folders}
									selectedId={selectedFolderId}
									expandedIds={expandedIds}
									onToggleExpand={toggleExpand}
									onSelectFolder={handleSelectFolder}
								/>
							)}
						</div>
					</Steps.Content>
				</Steps.Root>

				{error && (
					<div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2">
						<p className="text-sm text-red-400">{error}</p>
					</div>
				)}

				<div className="mt-6 flex items-center justify-between">
					<Button kind="secondary" onClick={onClose}>
						Cancel
					</Button>
					{currentStep === 0 ? (
						<Button
							kind="primary"
							size="lg"
							onClick={handleNext}
							disabled={!repo}
						>
							Next
						</Button>
					) : (
						<div className="flex gap-2">
							<Button kind="secondary" onClick={handleBack}>
								Back
							</Button>
							<Button
								kind="primary"
								size="lg"
								onClick={() => void handleAdd()}
								disabled={submitting || !targetFolderId}
							>
								Complete
							</Button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
