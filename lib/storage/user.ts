import type { GitHubUser } from "../types/user.ts";

const USER_KEY = "local:gitmarks_user";

export const getUser = async (): Promise<GitHubUser | null> => {
	return await storage.getItem<GitHubUser>(USER_KEY);
};

export const saveUser = async (user: GitHubUser): Promise<void> => {
	await storage.setItem(USER_KEY, user);
};

export const removeUser = async (): Promise<void> => {
	await storage.removeItem(USER_KEY);
};
