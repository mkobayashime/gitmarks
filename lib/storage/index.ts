const ACCESS_TOKEN_KEY = "local:github_access_token";

export const saveToken = async (token: string): Promise<void> => {
	await storage.setItem(ACCESS_TOKEN_KEY, token);
};

export const getToken = async (): Promise<string | null> => {
	return await storage.getItem<string>(ACCESS_TOKEN_KEY);
};

export const removeToken = async (): Promise<void> => {
	await storage.removeItem(ACCESS_TOKEN_KEY);
};
