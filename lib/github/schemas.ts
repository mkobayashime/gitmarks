import * as v from "valibot";

export const DeviceCodeResponseSchema = v.object({
	device_code: v.string(),
	user_code: v.string(),
	verification_uri: v.string(),
	expires_in: v.number(),
	interval: v.number(),
});

export type DeviceCodeResponse = v.InferOutput<typeof DeviceCodeResponseSchema>;

export const AccessTokenResponseSchema = v.object({
	access_token: v.string(),
	token_type: v.string(),
	scope: v.string(),
});

export type AccessTokenResponse = v.InferOutput<
	typeof AccessTokenResponseSchema
>;

export const AccessTokenErrorResponseSchema = v.object({
	error: v.string(),
	error_description: v.optional(v.string()),
	error_uri: v.optional(v.string()),
});

export type AccessTokenErrorResponse = v.InferOutput<
	typeof AccessTokenErrorResponseSchema
>;

const RepositoryOwnerSchema = v.object({
	login: v.string(),
	avatar_url: v.optional(v.string()),
});

export const RepositorySchema = v.object({
	id: v.number(),
	name: v.string(),
	full_name: v.string(),
	private: v.boolean(),
	owner: RepositoryOwnerSchema,
	description: v.optional(v.nullable(v.string())),
	html_url: v.string(),
});

export type Repository = v.InferOutput<typeof RepositorySchema>;

export const RepoContentSchema = v.object({
	name: v.string(),
	path: v.string(),
	type: v.union([
		v.literal("file"),
		v.literal("dir"),
		v.literal("symlink"),
		v.literal("submodule"),
	]),
	size: v.number(),
	sha: v.string(),
	url: v.string(),
	html_url: v.optional(v.string()),
	download_url: v.optional(v.nullable(v.string())),
	content: v.optional(v.string()),
	encoding: v.optional(v.string()),
});

export type RepoContent = v.InferOutput<typeof RepoContentSchema>;

export const CommitListItemSchema = v.object({
	sha: v.string(),
});

export type CommitListItem = v.InferOutput<typeof CommitListItemSchema>;

export const GitHubUserSchema = v.object({
	login: v.string(),
	avatar_url: v.string(),
	name: v.nullable(v.string()),
});

export type GitHubUser = v.InferOutput<typeof GitHubUserSchema>;
