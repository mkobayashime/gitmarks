import * as v from "valibot";

export const ManifestBookmarkSchema = v.object({
	name: v.string(),
	location: v.string(),
});

export const ManifestJSONSchema = v.array(ManifestBookmarkSchema);

export type ManifestBookmark = v.InferOutput<typeof ManifestBookmarkSchema>;
export type ManifestJSON = v.InferOutput<typeof ManifestJSONSchema>;

export type ResolvedBookmark = { name: string; url: string };
