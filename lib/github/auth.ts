import * as v from "valibot";
import { validateEnvVars } from "../env";
import {
	type AuthData,
	getAuthData,
	removeAuthData,
	saveAuthData,
} from "../storage";
import {
	AccessTokenErrorResponseSchema,
	AccessTokenResponseSchema,
	DeviceCodeResponseSchema,
} from "./schemas";

const { GITHUB_CLIENT_ID } = validateEnvVars();

type AuthResult = {
	accessToken: string;
	refreshToken?: string;
	expiresIn?: number;
	refreshTokenExpiresIn?: number;
};

export const requestDeviceCode = async () => {
	const response = await fetch("https://github.com/login/device/code", {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			client_id: GITHUB_CLIENT_ID,
			scope: "repo",
		}),
	});

	if (!response.ok) {
		throw new Error(
			`Failed to request device code: ${response.status} ${response.statusText}`,
		);
	}

	const raw: unknown = await response.json();
	return v.parse(DeviceCodeResponseSchema, raw);
};

export const pollForToken = async (
	deviceCode: string,
	interval: number,
): Promise<AuthResult> => {
	let pollInterval = interval * 1000;

	const poll = async (): Promise<AuthResult> => {
		const response = await fetch(
			"https://github.com/login/oauth/access_token",
			{
				method: "POST",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					client_id: GITHUB_CLIENT_ID,
					device_code: deviceCode,
					grant_type: "urn:ietf:params:oauth:grant-type:device_code",
				}),
			},
		);

		if (!response.ok) {
			throw new Error(
				`Failed to poll for token: ${response.status} ${response.statusText}`,
			);
		}

		const raw: unknown = await response.json();

		const errorResult = v.safeParse(AccessTokenErrorResponseSchema, raw);
		if (errorResult.success) {
			switch (errorResult.output.error) {
				case "authorization_pending":
					await new Promise((resolve) => setTimeout(resolve, pollInterval));
					return poll();

				case "slow_down":
					pollInterval += 5000;
					await new Promise((resolve) => setTimeout(resolve, pollInterval));
					return poll();

				case "expired_token":
					throw new Error(
						"Device code expired. Please restart the authentication flow.",
					);

				case "access_denied":
					throw new Error(
						"User cancelled the authorization or access was denied.",
					);

				default:
					throw new Error(
						`Authentication error: ${errorResult.output.error} - ${errorResult.output.error_description || "Unknown error"}`,
					);
			}
		}

		const result = v.parse(AccessTokenResponseSchema, raw);
		return {
			accessToken: result.access_token,
			refreshToken: result.refresh_token,
			expiresIn: result.expires_in,
			refreshTokenExpiresIn: result.refresh_token_expires_in,
		};
	};

	return poll();
};

const buildAuthData = (
	accessToken: string,
	refreshToken: string | undefined,
	expiresIn: number | undefined,
	refreshTokenExpiresIn: number | undefined,
): AuthData => {
	const data: AuthData = { accessToken };
	if (
		refreshToken &&
		expiresIn !== undefined &&
		refreshTokenExpiresIn !== undefined
	) {
		const now = Date.now();
		data.refreshToken = refreshToken;
		data.expiresAt = now + expiresIn * 1000;
		data.refreshTokenExpiresAt = now + refreshTokenExpiresIn * 1000;
	}
	return data;
};

export const startDeviceFlow = async (
	onUserCode: (code: string, verificationUri: string) => void,
): Promise<string> => {
	const deviceResponse = await requestDeviceCode();
	onUserCode(deviceResponse.user_code, deviceResponse.verification_uri);
	const authResult = await pollForToken(
		deviceResponse.device_code,
		deviceResponse.interval,
	);
	await saveAuthData(
		buildAuthData(
			authResult.accessToken,
			authResult.refreshToken,
			authResult.expiresIn,
			authResult.refreshTokenExpiresIn,
		),
	);
	return authResult.accessToken;
};

export const refreshAccessToken = async (): Promise<string | null> => {
	const authData = await getAuthData();
	if (!authData?.refreshToken || !authData.refreshTokenExpiresAt) return null;

	if (Date.now() > authData.refreshTokenExpiresAt) {
		await removeAuthData();
		return null;
	}

	const response = await fetch("https://github.com/login/oauth/access_token", {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			client_id: GITHUB_CLIENT_ID,
			grant_type: "refresh_token",
			refresh_token: authData.refreshToken,
		}),
	});

	if (!response.ok) {
		await removeAuthData();
		return null;
	}

	const raw: unknown = await response.json();

	const errorResult = v.safeParse(AccessTokenErrorResponseSchema, raw);
	if (errorResult.success) {
		await removeAuthData();
		return null;
	}

	const result = v.safeParse(AccessTokenResponseSchema, raw);
	if (!result.success) {
		await removeAuthData();
		return null;
	}

	const { access_token, refresh_token, expires_in, refresh_token_expires_in } =
		result.output;
	await saveAuthData(
		buildAuthData(
			access_token,
			refresh_token,
			expires_in,
			refresh_token_expires_in,
		),
	);
	return access_token;
};

export const isAuthenticated = async (): Promise<boolean> => {
	const authData = await getAuthData();
	return authData !== null;
};

const BUFFER_MS = 5 * 60 * 1000; // 5 minutes

export const getValidToken = async (): Promise<string | null> => {
	const authData = await getAuthData();
	if (!authData) return null;

	if (!authData.expiresAt) return authData.accessToken; // Classic OAuth app — no expiry

	if (Date.now() < authData.expiresAt - BUFFER_MS) {
		return authData.accessToken; // Still valid
	}

	return await refreshAccessToken();
};
