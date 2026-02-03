export const validateEnvVars = () => {
	const env = import.meta.env;

	if (
		"WXT_GITHUB_APP_CLIENT_ID" in env &&
		typeof env.WXT_GITHUB_APP_CLIENT_ID === "string"
	) {
		return {
			GITHUB_CLIENT_ID: env.WXT_GITHUB_APP_CLIENT_ID,
		};
	}

	throw new Error("Missing some of required env vars.");
};
