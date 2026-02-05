import { useEffect, useMemo, useRef, useState } from "react";
import type { Repository } from "../../../lib/github/types.ts";

type Props = {
	repos: Repository[];
	loading: boolean;
	value: Repository | null;
	onChange: (repo: Repository) => void;
};

export const RepoCombobox = ({ repos, loading, value, onChange }: Props) => {
	const [query, setQuery] = useState("");
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const filtered = useMemo(() => {
		if (!query) return repos;
		const q = query.toLowerCase();
		return repos.filter((r) => r.full_name.toLowerCase().includes(q));
	}, [repos, query]);

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
			<div
				className={`flex items-center rounded-md border bg-zinc-800 ${open ? "border-indigo-500" : "border-zinc-700"}`}
			>
				<input
					type="text"
					value={query}
					placeholder={value ? value.full_name : "Search repositories…"}
					onChange={(e) => {
						setQuery(e.target.value);
						setOpen(true);
					}}
					onFocus={() => setOpen(true)}
					className="flex-1 bg-transparent px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none"
				/>
				<span className="pr-3 text-xs text-zinc-600">▾</span>
			</div>

			{open && (
				<div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-zinc-700 bg-zinc-800">
					{loading ? (
						<p className="px-3 py-2 text-xs text-zinc-500">Loading…</p>
					) : filtered.length === 0 ? (
						<p className="px-3 py-2 text-xs text-zinc-500">
							{repos.length === 0
								? "No repositories found. Create one on GitHub."
								: "No matches"}
						</p>
					) : (
						filtered.map((repo) => (
							<button
								key={repo.id}
								type="button"
								onClick={() => {
									onChange(repo);
									setQuery("");
									setOpen(false);
								}}
								className="w-full px-3 py-1.5 text-left text-sm text-zinc-400 hover:bg-zinc-700"
							>
								<span className="font-mono">{repo.full_name}</span>
							</button>
						))
					)}
				</div>
			)}
		</div>
	);
};
