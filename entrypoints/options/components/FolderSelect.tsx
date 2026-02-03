import type { BookmarkFolder } from "../../../lib/bookmarks/api.ts";

type Props = {
	folders: BookmarkFolder[];
	value: string;
	onChange: (id: string, path: string) => void;
	disabled?: boolean;
};

export const FolderSelect = ({ folders, value, onChange, disabled }: Props) => (
	<select
		value={value}
		onChange={(e) => {
			const folder = folders.find((f) => f.id === e.target.value);
			if (folder) onChange(folder.id, folder.path);
		}}
		disabled={disabled}
		className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-white disabled:opacity-40"
	>
		<option value="">Select folder…</option>
		{folders.map((f) => (
			<option key={f.id} value={f.id}>
				{f.path}
			</option>
		))}
	</select>
);
