import * as v from "valibot";

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
