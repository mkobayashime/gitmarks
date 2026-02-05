import { ChevronDownIcon } from "@primer/octicons-react";
import { useEffect, useRef, useState } from "react";
import type { BookmarkFolder } from "../../../lib/bookmarks/api.ts";

type Props = {
	folders: BookmarkFolder[];
	value: string;
	onChange: (id: string, path: string) => void;
	disabled?: boolean;
};

export const FolderSelect = ({ folders, value, onChange, disabled }: Props) => {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const selected = folders.find((f) => f.id === value);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		};
		if (open) document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [open]);

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				onClick={() => !disabled && setOpen(!open)}
				disabled={disabled}
				className={`inline-flex w-full items-center justify-between rounded-md border bg-zinc-900 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 focus:border-pink-500 focus:outline-none ${open ? "border-pink-500" : "border-zinc-700"} ${selected ? "text-zinc-100" : "text-zinc-500"}`}
			>
				<span className="truncate">
					{selected ? selected.path : "Select folder…"}
				</span>
				<span className="ml-2 text-zinc-600">
					<ChevronDownIcon />
				</span>
			</button>

			{open && (
				<div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-zinc-700 bg-zinc-900">
					{folders.length === 0 ? (
						<p className="px-3 py-2 text-xs text-zinc-500">
							No folders available
						</p>
					) : (
						folders.map((f) => (
							<button
								key={f.id}
								type="button"
								onClick={() => {
									onChange(f.id, f.path);
									setOpen(false);
								}}
								className={`w-full px-3 py-1.5 text-left text-sm ${f.id === value ? "bg-pink-500/10 text-pink-400" : "text-zinc-400 hover:bg-zinc-800"}`}
							>
								{f.path}
							</button>
						))
					)}
				</div>
			)}
		</div>
	);
};
