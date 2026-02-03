import { validateEnvVars } from "../env";
import { getToken, saveToken } from "../storage";
import type {
	AccessTokenErrorResponse,
	AccessTokenResponse,
	DeviceCodeResponse,
} from "./types";

const { GITHUB_CLIENT_ID } = validateEnvVars();

/**
 * Step 1: Request device and user codes from GitHub
 */
export const requestDeviceCode = async (): Promise<DeviceCodeResponse> => {
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

	return (await response.json()) as DeviceCodeResponse;
};

/**
 * Step 2: Poll for access token
 */
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

		const data = (await response.json()) as
			| AccessTokenResponse
			| AccessTokenErrorResponse;

		if ("error" in data) {
			switch (data.error) {
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
						`Authentication error: ${data.error} - ${data.error_description || "Unknown error"}`,
					);
			}
		}

		return data.access_token;
	};

	return poll();
};

/**
 * Combined Device Flow authentication
 * @param onUserCode Callback to display user code and verification URL
 * @returns Access token
 */
export const startDeviceFlow = async (
	onUserCode: (code: string, verificationUri: string) => void,
): Promise<string> => {
	// Request device code
	const deviceResponse = await requestDeviceCode();

	// Display user code to the user
	onUserCode(deviceResponse.user_code, deviceResponse.verification_uri);

	// Poll for access token
	const accessToken = await pollForToken(
		deviceResponse.device_code,
		deviceResponse.interval,
	);

	// Save token to storage
	await saveToken(accessToken);

	return accessToken;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
	const token = await getToken();
	return token !== null;
};
