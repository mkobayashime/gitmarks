import { useCallback, useEffect, useState } from "react";
import { fetchRepoContents, fetchUserRepos } from "@/lib/github/api";
import { isAuthenticated, startDeviceFlow } from "@/lib/github/auth";
import type { RepoContent, Repository } from "@/lib/github/types";
import { getToken, removeToken } from "@/lib/storage";

type AuthState = "idle" | "pending" | "authenticated";

const App = () => {
	const [authState, setAuthState] = useState<AuthState>("idle");
	const [userCode, setUserCode] = useState<string>("");
	const [verificationUri, setVerificationUri] = useState<string>("");
	const [repos, setRepos] = useState<Repository[]>([]);
	const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
	const [contents, setContents] = useState<RepoContent[]>([]);
	const [error, setError] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(false);

	const loadRepos = useCallback(async () => {
		try {
			setLoading(true);
			setError("");
			const token = await getToken();
			if (token) {
				const repos = await fetchUserRepos(token);
				setRepos(repos);
			}
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to load repositories",
			);
		} finally {
			setLoading(false);
		}
	}, []);

	// Check for existing token on mount
	useEffect(() => {
		const checkAuth = async () => {
			const authenticated = await isAuthenticated();
			if (authenticated) {
				setAuthState("authenticated");
				await loadRepos();
			}
		};
		void checkAuth();
	}, [loadRepos]);

	const handleLogin = async () => {
		try {
			setAuthState("pending");
			setError("");

			await startDeviceFlow((code, uri) => {
				setUserCode(code);
				setVerificationUri(uri);
			});

			setAuthState("authenticated");
			await loadRepos();
		} catch (err) {
			setAuthState("idle");
			setError(err instanceof Error ? err.message : "Authentication failed");
		}
	};

	const handleLogout = async () => {
		await removeToken();
		setAuthState("idle");
		setRepos([]);
		setSelectedRepo(null);
		setContents([]);
		setUserCode("");
		setVerificationUri("");
	};

	const handleSelectRepo = async (repo: Repository) => {
		try {
			setLoading(true);
			setError("");
			setSelectedRepo(repo);
			const token = await getToken();
			if (token) {
				const contents = await fetchRepoContents(
					token,
					repo.owner.login,
					repo.name,
				);
				setContents(contents);
			}
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to load repository contents",
			);
		} finally {
			setLoading(false);
		}
	};

	const openVerificationUrl = () => {
		if (verificationUri) {
			void browser.tabs.create({ url: verificationUri });
		}
	};

	// Render idle state
	if (authState === "idle") {
		return (
			<div className="container">
				<h1>GitMarks</h1>
				<p>Connect your GitHub account to sync repositories to bookmarks</p>
				{error && <div className="error">{error}</div>}
				<button
					type="button"
					onClick={() => {
						void handleLogin();
					}}
				>
					Login with GitHub
				</button>
			</div>
		);
	}

	// Render pending state (waiting for authorization)
	if (authState === "pending") {
		return (
			<div className="container">
				<h1>Authorize GitMarks</h1>
				<div className="auth-flow">
					<p>Copy this code:</p>
					<div className="user-code">{userCode}</div>
					<p>Then click the button below to open GitHub and enter the code:</p>
					<button type="button" onClick={openVerificationUrl}>
						Open GitHub Authorization
					</button>
					<p className="waiting">Waiting for authorization...</p>
				</div>
			</div>
		);
	}

	// Render authenticated state
	return (
		<div className="container">
			<div className="header">
				<h1>GitMarks</h1>
				<button
					type="button"
					onClick={() => {
						void handleLogout();
					}}
				>
					Logout
				</button>
			</div>

			{error && <div className="error">{error}</div>}

			<div className="content">
				<div className="repos-panel">
					<h2>Your Repositories</h2>
					{loading && !selectedRepo && <p>Loading...</p>}
					<div className="repos-list">
						{repos.map((repo) => (
							<button
								key={repo.id}
								type="button"
								className={`repo-item ${selectedRepo?.id === repo.id ? "selected" : ""}`}
								onClick={() => {
									void handleSelectRepo(repo);
								}}
							>
								<div className="repo-name">{repo.full_name}</div>
								{repo.description && (
									<div className="repo-description">{repo.description}</div>
								)}
							</button>
						))}
					</div>
				</div>

				<div className="contents-panel">
					<h2>Repository Contents</h2>
					{selectedRepo ? (
						<>
							<div className="selected-repo-info">
								<strong>{selectedRepo.full_name}</strong>
								<a
									href={selectedRepo.html_url}
									target="_blank"
									rel="noreferrer"
								>
									View on GitHub
								</a>
							</div>
							{loading ? (
								<p>Loading...</p>
							) : (
								<div className="contents-list">
									{contents.length === 0 ? (
										<p>No files found in repository root</p>
									) : (
										contents.map((item) => (
											<div key={item.sha} className="content-item">
												<span className="content-type">[{item.type}]</span>
												<span className="content-name">{item.name}</span>
												<span className="content-size">
													{item.type === "file"
														? `${Math.round(item.size / 1024)}KB`
														: ""}
												</span>
											</div>
										))
									)}
								</div>
							)}
						</>
					) : (
						<p>Select a repository to view its contents</p>
					)}
				</div>
			</div>
		</div>
	);
};

export default App;
