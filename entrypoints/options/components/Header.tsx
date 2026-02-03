import type { GitHubUser } from "../../../lib/types/user.ts";
import type { AuthState } from "../hooks/useAuth.ts";

type Props = {
	state: AuthState;
	user: GitHubUser | null;
	onSignIn: () => void;
	onSignOut: () => void;
};

export const Header = ({ state, user, onSignIn, onSignOut }: Props) => (
	<header className="sticky top-0 z-10 flex items-center justify-between bg-gray-900 px-6 py-3 shadow">
		<span className="text-lg font-semibold text-white">GitMarks</span>

		<div className="flex items-center gap-3">
			{state === "authenticated" && user ? (
				<>
					<div className="flex items-center gap-2">
						<img
							src={user.avatar_url}
							alt={user.login}
							className="h-7 w-7 rounded-full"
						/>
						<span className="text-sm text-gray-200">{user.login}</span>
					</div>
					<button
						type="button"
						onClick={onSignOut}
						className="rounded px-3 py-1 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
					>
						Sign out
					</button>
				</>
			) : (
				<button
					type="button"
					onClick={onSignIn}
					className="rounded bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-500"
				>
					Sign in
				</button>
			)}
		</div>
	</header>
);
