import type { RepoContent, Repository } from "./types";

const API_BASE = "https://api.github.com";

const createAuthHeaders = (token: string) => ({
	Authorization: `Bearer ${token}`,
	Accept: "application/vnd.github+json",
	"X-GitHub-Api-Version": "2022-11-28",
});

/**
 * Fetch user's repositories
 */
export const fetchUserRepos = async (token: string): Promise<Repository[]> => {
	const response = await fetch(
		`${API_BASE}/user/repos?per_page=100&sort=updated`,
		{
			headers: createAuthHeaders(token),
		},
	);

	if (!response.ok) {
		throw new Error(
			`Failed to fetch repositories: ${response.status} ${response.statusText}`,
		);
	}

	return (await response.json()) as Repository[];
};

/**
 * Fetch repository contents at a specific path
 */
export const fetchRepoContents = async (
	token: string,
	owner: string,
	repo: string,
	path = "",
): Promise<RepoContent[]> => {
	const url = `${API_BASE}/repos/${owner}/${repo}/contents/${path}`;
	const response = await fetch(url, {
		headers: createAuthHeaders(token),
	});

	if (!response.ok) {
		throw new Error(
			`Failed to fetch repo contents: ${response.status} ${response.statusText}`,
		);
	}

	const data = (await response.json()) as RepoContent | RepoContent[];

	// GitHub API returns an array for directories, or a single object for files
	return Array.isArray(data) ? data : [data];
};
