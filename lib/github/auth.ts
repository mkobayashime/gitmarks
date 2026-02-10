import * as v from "valibot";
import { validateEnvVars } from "../env";
import { getToken, saveToken } from "../storage";
import {
	AccessTokenErrorResponseSchema,
	AccessTokenResponseSchema,
	DeviceCodeResponseSchema,
} from "./schemas";

const { GITHUB_CLIENT_ID } = validateEnvVars();

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
): Promise<string> => {
	let pollInterval = interval * 1000; // Convert to milliseconds

	const poll = async (): Promise<string> => {
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
					// Continue polling
					await new Promise((resolve) => setTimeout(resolve, pollInterval));
					return poll();

				case "slow_down":
					// Increase interval by 5 seconds and continue polling
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

		const successResult = v.parse(AccessTokenResponseSchema, raw);
		return successResult.access_token;
	};

	return poll();
};

export const startDeviceFlow = async (
	onUserCode: (code: string, verificationUri: string) => void,
): Promise<string> => {
	const deviceResponse = await requestDeviceCode();
	onUserCode(deviceResponse.user_code, deviceResponse.verification_uri);
	const accessToken = await pollForToken(
		deviceResponse.device_code,
		deviceResponse.interval,
	);
	await saveToken(accessToken);
	return accessToken;
};

export const isAuthenticated = async (): Promise<boolean> => {
	const token = await getToken();
	return token !== null;
};
