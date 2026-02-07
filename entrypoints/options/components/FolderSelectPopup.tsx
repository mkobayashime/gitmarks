import {
	CheckIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	FileDirectoryIcon,
	SyncIcon,
} from "@primer/octicons-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { BookmarkTreeFolder } from "../../../lib/bookmarks/tree.ts";
import {
	findFolderInTree,
	getAncestorIds,
	getFolderTree,
} from "../../../lib/bookmarks/tree.ts";

type Props = {
	open: boolean;
	value: string;
	onSelect: (id: string, path: string) => void;
	onClose: () => void;
	refreshTrigger?: number;
};

type TreeRow = {
	folder: BookmarkTreeFolder;
	hasChildren: boolean;
	expanded: boolean;
	selected: boolean;
};

export const FolderSelectPopup = ({
	open,
	value,
	onSelect,
	onClose,
	refreshTrigger: _refreshTrigger = 0,
}: Props) => {
	const [folders, setFolders] = useState<BookmarkTreeFolder[]>([]);
	const [loading, setLoading] = useState(false);
	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const popupRef = useRef<HTMLDivElement>(null);

	// Close when clicking outside
	useEffect(() => {
		if (!open) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
				onClose();
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [open, onClose]);

	// Load folders when popup opens
	useEffect(() => {
		if (!open) return;
		setLoading(true);
		void getFolderTree()
			.then((tree) => {
				setFolders(tree);
				// Expand ancestors of selected value
				if (value) {
					setSelectedId(value);
					const ancestors = getAncestorIds(tree, value);
					setExpandedIds(new Set(ancestors.slice(0, -1))); // Exclude the selected folder itself
				} else {
					setSelectedId(null);
				}
			})
			.finally(() => setLoading(false));
	}, [open, value]);

	const toggleExpand = useCallback((id: string) => {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	}, []);

	const handleRowClick = useCallback(
		(id: string, hasChildren: boolean) => {
			setSelectedId(id);
			if (hasChildren) {
				toggleExpand(id);
			}
		},
		[toggleExpand],
	);

	const renderTreeRows = (folderList: BookmarkTreeFolder[]): TreeRow[] => {
		const rows: TreeRow[] = [];

		const processFolder = (folder: BookmarkTreeFolder) => {
			const hasChildren = folder.children.length > 0;
			const isExpanded = expandedIds.has(folder.id);
			const isSelected = folder.id === selectedId;

			rows.push({
				folder,
				hasChildren,
				expanded: isExpanded,
				selected: isSelected,
			});

			if (isExpanded && hasChildren) {
				folder.children.forEach(processFolder);
			}
		};

		folderList.forEach(processFolder);
		return rows;
	};

	if (!open) return null;

	const treeRows = renderTreeRows(folders);

	return (
		<div className="absolute z-50 mt-1 w-full min-w-[320px]">
			<div
				ref={popupRef}
				className="rounded-lg border border-zinc-700 bg-zinc-950 shadow-lg"
			>
				<div className="max-h-[min(320px,40vh)] overflow-y-auto py-2 px-2">
					{loading ? (
						<p className="px-3 py-2 text-xs text-zinc-500">
							Loading folders...
						</p>
					) : treeRows.length === 0 ? (
						<p className="px-3 py-2 text-xs text-zinc-500">
							No folders available
						</p>
					) : (
						treeRows.map((row) => {
							const { folder, hasChildren, expanded, selected } = row;

							const paddingLeft = `${12 + folder.depth * 20}px`;
							const bgClass = selected ? "bg-pink-500/10" : "hover:bg-white/5";

							const chevronClass = "text-zinc-500";
							const folderClass = selected ? "text-pink-400" : "text-zinc-500";
							const textClass = selected ? "text-pink-400" : "text-zinc-300";

							return (
								<button
									type="button"
									key={folder.id}
									style={{ paddingLeft }}
									className={`${bgClass} w-full flex h-8 cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent pr-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-pink-500/50`}
									onClick={() => handleRowClick(folder.id, hasChildren)}
								>
									{selected ? (
										<span className="text-pink-400">
											<CheckIcon size={12} />
										</span>
									) : hasChildren ? (
										expanded ? (
											<span className={chevronClass}>
												<ChevronDownIcon size={12} />
											</span>
										) : (
											<span className={chevronClass}>
												<ChevronRightIcon size={12} />
											</span>
										)
									) : (
										<div style={{ width: 12, height: 12 }} />
									)}

									<span className={folderClass}>
										<FileDirectoryIcon size={12} />
									</span>

									<span className={`text-xs ${textClass}`}>{folder.title}</span>
								</button>
							);
						})
					)}
				</div>

				<div className="flex items-center justify-between border-t border-zinc-800 py-3 px-4">
					<div className="flex items-center gap-1.5">
						<button
							type="button"
							className="flex items-center gap-1.5 text-zinc-500 transition-colors hover:text-zinc-400"
							onClick={() => {
								setLoading(true);
								void getFolderTree()
									.then((tree) => {
										setFolders(tree);
										if (selectedId) {
											const ancestors = getAncestorIds(tree, selectedId);
											setExpandedIds(new Set(ancestors.slice(0, -1)));
										}
									})
									.finally(() => setLoading(false));
							}}
						>
							<SyncIcon size={12} />
							<span className="text-xs font-medium">Refresh</span>
						</button>
					</div>

					<button
						type="button"
						onClick={() => {
							if (selectedId) {
								const selectedFolder = findFolderInTree(folders, selectedId);
								if (selectedFolder) {
									onSelect(selectedFolder.id, selectedFolder.path);
								}
							}
							onClose();
						}}
						disabled={!selectedId}
						className="flex items-center gap-1 cursor-pointer rounded-md bg-pink-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-40"
					>
						<CheckIcon size={12} />
						Select
					</button>
				</div>
			</div>
		</div>
	);
};
