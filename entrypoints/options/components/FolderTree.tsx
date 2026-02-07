import {
	CheckIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	FileDirectoryIcon,
} from "@primer/octicons-react";
import type { BookmarkTreeFolder } from "../../../lib/bookmarks/tree.ts";

type Props = {
	folders: BookmarkTreeFolder[];
	selectedId: string | null;
	expandedIds: Set<string>;
	onToggleExpand: (id: string) => void;
	onSelectFolder: (id: string) => void;
};

type TreeRow = {
	folder: BookmarkTreeFolder;
	hasChildren: boolean;
	expanded: boolean;
	selected: boolean;
};

export const FolderTree = ({
	folders,
	selectedId,
	expandedIds,
	onToggleExpand,
	onSelectFolder,
}: Props) => {
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

	const treeRows = renderTreeRows(folders);

	const handleRowClick = (id: string, hasChildren: boolean) => {
		onSelectFolder(id);
		if (hasChildren) {
			onToggleExpand(id);
		}
	};

	return (
		<>
			{treeRows.length === 0 ? (
				<p className="px-3 py-2 text-xs text-zinc-500">No folders available</p>
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
		</>
	);
};
