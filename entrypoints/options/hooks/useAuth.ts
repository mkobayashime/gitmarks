import { useCallback, useEffect, useRef, useState } from "react";
import { fetchUser } from "../../../lib/github/api.ts";
import { startDeviceFlow } from "../../../lib/github/auth.ts";
import { getToken, removeToken } from "../../../lib/storage/index.ts";
import { getUser, removeUser, saveUser } from "../../../lib/storage/user.ts";
import type { GitHubUser } from "../../../lib/types/user.ts";

export type AuthState = "idle" | "pending" | "authenticated";

export type DeviceFlowInfo = {
	userCode: string;
	verificationUri: string;
};

export const useAuth = () => {
	const [state, setState] = useState<AuthState>("idle");
	const [user, setUser] = useState<GitHubUser | null>(null);
	const [deviceFlow, setDeviceFlow] = useState<DeviceFlowInfo | null>(null);
	const [error, setError] = useState<string | null>(null);
	const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });

	// On mount: restore cached auth state
	useEffect(() => {
		const restore = async () => {
			const token = await getToken();
			if (!token) return;

			const cached = await getUser();
			if (cached) {
				setUser(cached);
				setState("authenticated");
				return;
			}

			// Token exists but no cached user — fetch from GitHub
			try {
				const fetched = await fetchUser(token);
				await saveUser(fetched);
				setUser(fetched);
				setState("authenticated");
			} catch {
				// Token likely expired
				await removeToken();
			}
		};

		void restore();
	}, []);

	const signIn = useCallback(async () => {
		setError(null);
		setState("pending");
		cancelRef.current = { cancelled: false };

		try {
			await startDeviceFlow((code, uri) => {
				setDeviceFlow({ userCode: code, verificationUri: uri });
			});

			if (cancelRef.current.cancelled) return;

			// Auth succeeded — fetch user
			const token = await getToken();
			if (!token) throw new Error("Token not saved");

			if (cancelRef.current.cancelled) return;
			const fetched = await fetchUser(token);

			if (cancelRef.current.cancelled) return;
			await saveUser(fetched);
			setUser(fetched);
			setDeviceFlow(null);
			setState("authenticated");
		} catch (err) {
			if (cancelRef.current.cancelled) return;
			setError(err instanceof Error ? err.message : "Authentication failed");
			setDeviceFlow(null);
			setState("idle");
		}
	}, []);

	const cancelSignIn = useCallback(() => {
		cancelRef.current.cancelled = true;
		setDeviceFlow(null);
		setState("idle");
		setError(null);
	}, []);

	const signOut = useCallback(async () => {
		await removeToken();
		await removeUser();
		setUser(null);
		setState("idle");
		setError(null);
	}, []);

	return { state, user, deviceFlow, error, signIn, cancelSignIn, signOut };
};
