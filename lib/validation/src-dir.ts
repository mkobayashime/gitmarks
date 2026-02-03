/**
 * Validate srcDir value.
 * "/" is a valid value (repo root). Empty string is not.
 */
export const validateSrcDir = (srcDir: string): string | null => {
	if (srcDir.trim() === "") {
		return "srcDir is required";
	}
	return null;
};
