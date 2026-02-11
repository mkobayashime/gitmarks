import { useCallback, useEffect, useState } from "react";
import { fetchUser } from "../../../lib/github/api.ts";
import { validateAndSaveToken } from "../../../lib/github/auth.ts";
import { getAuthData, removeAuthData } from "../../../lib/storage/index.ts";
import { getUser, removeUser, saveUser } from "../../../lib/storage/user.ts";
import type { GitHubUser } from "../../../lib/types/user.ts";

export type AuthState = "idle" | "authenticated";

export const useAuth = () => {
	const [state, setState] = useState<AuthState>("idle");
	const [user, setUser] = useState<GitHubUser | null>(null);
	const [error, setError] = useState<string | null>(null);

	// On mount: restore cached auth state
	useEffect(() => {
		const restore = async () => {
			const authData = await getAuthData();
			if (!authData) return;

			const cached = await getUser();
			if (cached) {
				setUser(cached);
				setState("authenticated");
				return;
			}

			// Auth data exists but no cached user — fetch from GitHub
			try {
				const fetched = await fetchUser(authData.accessToken);
				await saveUser(fetched);
				setUser(fetched);
				setState("authenticated");
			} catch {
				// Token likely invalid
				await removeAuthData();
			}
		};

		void restore();
	}, []);

	const signIn = useCallback(async (token: string) => {
		setError(null);

		try {
			const fetched = await validateAndSaveToken(token);
			setUser(fetched);
			setState("authenticated");
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Authentication failed";
			setError(message);
			throw err;
		}
	}, []);

	const signOut = useCallback(async () => {
		await removeAuthData();
		await removeUser();
		setUser(null);
		setState("idle");
		setError(null);
	}, []);

	return { state, user, error, signIn, signOut };
};
