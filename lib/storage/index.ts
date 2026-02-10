const AUTH_DATA_KEY = "local:github_auth_data";

export type AuthData = {
	accessToken: string;
	refreshToken?: string;
	expiresAt?: number;
	refreshTokenExpiresAt?: number;
};

export const saveAuthData = async (data: AuthData): Promise<void> => {
	await storage.setItem(AUTH_DATA_KEY, data);
};

export const getAuthData = async (): Promise<AuthData | null> => {
	return await storage.getItem<AuthData>(AUTH_DATA_KEY);
};

export const removeAuthData = async (): Promise<void> => {
	await storage.removeItem(AUTH_DATA_KEY);
};
