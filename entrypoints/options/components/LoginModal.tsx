import { ArrowRightIcon } from "@primer/octicons-react";
import { useState } from "react";
import { Button } from "./Button";

type Props = {
	open: boolean;
	error: string | null;
	loading: boolean;
	onSubmit: (token: string) => void;
	onCancel: () => void;
};

const FINE_GRAINED_PAT_PREFIX = "github_pat_";

export const LoginModal = ({
	open,
	error,
	loading,
	onSubmit,
	onCancel,
}: Props) => {
	const [token, setToken] = useState("");
	const [validationError, setValidationError] = useState<string | null>(null);

	if (!open) return null;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setValidationError(null);

		const trimmed = token.trim();
		if (!trimmed) {
			setValidationError("Please enter a token");
			return;
		}

		if (!trimmed.startsWith(FINE_GRAINED_PAT_PREFIX)) {
			setValidationError(
				"Please enter a Fine-grained PAT (token starting with github_pat_)",
			);
			return;
		}

		onSubmit(trimmed);
	};

	const handleCancel = () => {
		setToken("");
		setValidationError(null);
		onCancel();
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-md rounded-md space-y-6 border border-zinc-800 bg-zinc-950 p-6">
				<h2 className="text-base font-semibold text-zinc-100 tracking-tight">
					Sign in with GitHub
				</h2>

				<div className="space-y-2">
					<p className="font-medium text-zinc-300">
						A Fine-grained personal access token is required
					</p>
					<div className="mb-4 rounded-md bg-zinc-950 text-xs text-zinc-400 space-y-2">
						<ol className="list-decimal list-inside space-y-1 pl-1">
							<li>
								<span className="text-zinc-300 mr-1">Repository access:</span>
								Select repositories you want to sync
							</li>
							<li>
								<span className="text-zinc-300 mr-1">
									Repository permissions:
								</span>
								<span className="text-pink-400">Contents: Read-only</span>
							</li>
						</ol>
					</div>

					<a
						href="https://github.com/settings/personal-access-tokens/new"
						target="_blank"
						rel="noopener noreferrer"
					>
						<Button
							kind="secondary"
							trailingIcon={<ArrowRightIcon />}
							className="w-full"
							tabIndex={-1}
						>
							Generate a new token on GitHub
						</Button>
					</a>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label
							htmlFor="pat-input"
							className="block text-xs text-zinc-400 mb-1.5"
						>
							Token
						</label>
						<input
							id="pat-input"
							type="password"
							value={token}
							onChange={(e) => setToken(e.target.value)}
							placeholder="github_pat_..."
							className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none font-mono"
							disabled={loading}
						/>
					</div>

					{(error || validationError) && (
						<div className="mb-4 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2.5">
							<p className="text-sm text-red-400">{validationError || error}</p>
						</div>
					)}

					<div className="flex justify-center gap-2">
						<Button
							kind="secondary"
							onClick={handleCancel}
							disabled={loading}
							className="flex-1 basis-full"
						>
							Cancel
						</Button>
						<Button
							kind="primary"
							type="submit"
							disabled={loading}
							className="flex-1 basis-full"
						>
							{loading ? "Validating..." : "Sign in"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
};
