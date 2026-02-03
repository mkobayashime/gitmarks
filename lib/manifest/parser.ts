import * as v from "valibot";
import { fetchFileContent } from "../github/api.ts";
import {
	ManifestJSONSchema,
	type ResolvedBookmark,
} from "../types/manifest.ts";

const isUrl = (value: string): boolean => {
	try {
		new URL(value);
		return true;
	} catch {
		return false;
	}
};

/**
 * Resolve a relative path (e.g. "./foo.js") relative to srcDir.
 * srcDir "/" -> "foo.js", srcDir "/src" -> "src/foo.js"
 */
const resolveRelativePath = (srcDir: string, relativePath: string): string => {
	const stripped = relativePath.replace(/^\.\//, "");
	const base =
		srcDir === "/" ? "" : srcDir.replace(/^\//, "").replace(/\/$/, "");
	return base ? `${base}/${stripped}` : stripped;
};

/**
 * Parse and resolve a manifest.json content string into bookmarks.
 * - URLs are used as-is
 * - Relative paths are fetched and wrapped as javascript: bookmarklets
 * - Entries referencing missing files are silently excluded
 */
export const parseManifest = async (
	manifestContent: string,
	srcDir: string,
	token: string,
	owner: string,
	repo: string,
): Promise<ResolvedBookmark[]> => {
	const raw: unknown = JSON.parse(manifestContent);
	const entries = v.parse(ManifestJSONSchema, raw);

	const resolved: ResolvedBookmark[] = [];

	for (const entry of entries) {
		if (isUrl(entry.location)) {
			resolved.push({ name: entry.name, url: entry.location });
		} else {
			// Relative path — fetch file content and wrap as bookmarklet
			const filePath = resolveRelativePath(srcDir, entry.location);
			const content = await fetchFileContent(token, owner, repo, filePath);
			if (content === null) continue; // File not found, skip
			resolved.push({ name: entry.name, url: `javascript:${content}` });
		}
	}

	return resolved;
};
