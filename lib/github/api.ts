import type { GitHubUser } from "../types/user.ts";
import type { CommitListItem, RepoContent, Repository } from "./types";

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

/**
 * Fetch authenticated user info
 */
export const fetchUser = async (token: string): Promise<GitHubUser> => {
	const response = await fetch(`${API_BASE}/user`, {
		headers: createAuthHeaders(token),
	});

	if (!response.ok) {
		throw new Error(
			`Failed to fetch user: ${response.status} ${response.statusText}`,
		);
	}

	return (await response.json()) as GitHubUser;
};

/**
 * Fetch file content and decode from base64
 * Returns null if the file does not exist (404)
 */
export const fetchFileContent = async (
	token: string,
	owner: string,
	repo: string,
	path: string,
): Promise<string | null> => {
	const url = `${API_BASE}/repos/${owner}/${repo}/contents/${path}`;
	const response = await fetch(url, {
		headers: createAuthHeaders(token),
	});

	if (response.status === 404) return null;

	if (!response.ok) {
		throw new Error(
			`Failed to fetch file content: ${response.status} ${response.statusText}`,
		);
	}

	const data = (await response.json()) as RepoContent;
	if (!data.content) return null;

	// Decode base64 to binary string, then convert to Uint8Array, then decode as UTF-8
	const binaryString = atob(data.content);
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return new TextDecoder().decode(bytes);
};

/**
 * Fetch latest commit SHA for a given path (for skip-if-unchanged optimization)
 */
export const fetchLatestCommitSha = async (
	token: string,
	owner: string,
	repo: string,
	path: string,
): Promise<string> => {
	const url = `${API_BASE}/repos/${owner}/${repo}/commits?path=${encodeURIComponent(path)}&per_page=1`;
	const response = await fetch(url, {
		headers: createAuthHeaders(token),
	});

	if (!response.ok) {
		throw new Error(
			`Failed to fetch latest commit: ${response.status} ${response.statusText}`,
		);
	}

	const commits = (await response.json()) as CommitListItem[];
	if (commits.length === 0) {
		throw new Error("No commits found for the specified path");
	}

	return commits[0].sha;
};

export type ManifestLocation = {
	path: string;
	relativePath: string;
};

/**
 * Recursively find all manifest.json files within a directory.
 */
export const findManifestFiles = async (
	token: string,
	owner: string,
	repo: string,
	path: string,
): Promise<ManifestLocation[]> => {
	const results: ManifestLocation[] = [];

	const traverse = async (
		currentPath: string,
		relativePath: string,
	): Promise<void> => {
		const contents = await fetchRepoContents(token, owner, repo, currentPath);

		for (const item of contents) {
			const itemRelativePath = relativePath
				? `${relativePath}/${item.name}`
				: item.name;

			if (item.type === "dir") {
				await traverse(item.path, itemRelativePath);
			} else if (item.name === "manifest.json") {
				results.push({
					path: item.path,
					relativePath: relativePath,
				});
			}
		}
	};

	const initialPath = path || "";
	await traverse(initialPath, "");

	return results;
};
