import { getAuthData, saveAuthData } from "../storage";
import { saveUser } from "../storage/user";
import type { GitHubUser } from "../types/user";
import { fetchUser } from "./api";

export const validateAndSaveToken = async (
	token: string,
): Promise<GitHubUser> => {
	const user = await fetchUser(token);
	await saveAuthData({ accessToken: token });
	await saveUser(user);

	return user;
};

export const isAuthenticated = async (): Promise<boolean> => {
	const authData = await getAuthData();
	return authData !== null;
};

export const getValidToken = async (): Promise<string | null> => {
	const authData = await getAuthData();
	if (!authData) return null;
	return authData.accessToken;
};
