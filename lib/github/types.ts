export interface DeviceCodeResponse {
	device_code: string;
	user_code: string;
	verification_uri: string;
	expires_in: number;
	interval: number;
}

export interface AccessTokenResponse {
	access_token: string;
	token_type: string;
	scope: string;
}

export interface AccessTokenErrorResponse {
	error: string;
	error_description?: string;
	error_uri?: string;
}

export interface Repository {
	id: number;
	name: string;
	full_name: string;
	private: boolean;
	owner: {
		login: string;
		avatar_url?: string;
	};
	description?: string | null;
	html_url: string;
}

export interface RepoContent {
	name: string;
	path: string;
	type: "file" | "dir" | "symlink" | "submodule";
	size: number;
	sha: string;
	url: string;
	html_url?: string;
	download_url?: string | null;
	content?: string;
	encoding?: string;
}

export interface CommitListItem {
	sha: string;
}
