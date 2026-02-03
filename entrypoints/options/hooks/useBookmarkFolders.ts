import { useEffect, useState } from "react";
import {
	type BookmarkFolder,
	getAllFolders,
} from "../../../lib/bookmarks/api.ts";

export const useBookmarkFolders = () => {
	const [folders, setFolders] = useState<BookmarkFolder[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const load = async () => {
			setFolders(await getAllFolders());
			setLoading(false);
		};
		void load();
	}, []);

	return { folders, loading };
};
