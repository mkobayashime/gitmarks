import { useCallback, useEffect, useState } from "react";
import { fetchUserRepos } from "../../../lib/github/api.ts";
import type { Repository } from "../../../lib/github/types.ts";
import { getToken } from "../../../lib/storage/index.ts";

export const useRepositories = (authenticated: boolean) => {
	const [repos, setRepos] = useState<Repository[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetch = useCallback(async () => {
		if (!authenticated) return;
		setLoading(true);
		setError(null);
		try {
			const token = await getToken();
			if (!token) return;
			setRepos(await fetchUserRepos(token));
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to fetch repositories",
			);
		} finally {
			setLoading(false);
		}
	}, [authenticated]);

	useEffect(() => {
		void fetch();
	}, [fetch]);

	return { repos, loading, error };
};
