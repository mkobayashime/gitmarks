import { useMemo, useState } from "react";
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

	const filtered = useMemo(() => {
		if (!query) return repos;
		const q = query.toLowerCase();
		return repos.filter((r) => r.full_name.toLowerCase().includes(q));
	}, [repos, query]);

	return (
		<div className="relative">
			<div className="flex items-center rounded border border-gray-600 bg-gray-800">
				<input
					type="text"
					value={query}
					placeholder={value ? value.full_name : "Search repositories…"}
					onChange={(e) => {
						setQuery(e.target.value);
						setOpen(true);
					}}
					onFocus={() => setOpen(true)}
					className="flex-1 bg-transparent px-3 py-1.5 text-sm text-white placeholder-gray-500 outline-none"
				/>
				<span className="pr-3 text-gray-500">▼</span>
			</div>

			{open && (
				<div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded border border-gray-600 bg-gray-800 shadow-lg">
					{loading ? (
						<p className="px-3 py-2 text-sm text-gray-400">Loading…</p>
					) : filtered.length === 0 ? (
						<p className="px-3 py-2 text-sm text-gray-400">
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
								className="w-full px-3 py-1.5 text-left text-sm text-white hover:bg-gray-700"
							>
								{repo.full_name}
							</button>
						))
					)}
				</div>
			)}
		</div>
	);
};
