import type { GitHubUser } from "../../../lib/types/user.ts";
import type { AuthState } from "../hooks/useAuth.ts";

type Props = {
	state: AuthState;
	user: GitHubUser | null;
	onSignIn: () => void;
	onSignOut: () => void;
};

export const Header = ({ state, user, onSignIn, onSignOut }: Props) => (
	<header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6 py-3">
		<div className="flex items-center gap-2">
			<img src="/icon.svg" className="h-8" aria-hidden />
			<span className="text-xl font-semibold text-zinc-100 tracking-tight">
				GitMarks
			</span>
		</div>

		<div className="flex items-center gap-2">
			{state === "authenticated" && user ? (
				<>
					<div className="flex items-center gap-2">
						<img
							src={user.avatar_url}
							alt={user.login}
							className="h-6 w-6 rounded-full"
						/>
						<span className="text-xs text-zinc-400">{user.login}</span>
					</div>
					<button
						type="button"
						onClick={onSignOut}
						className="rounded-md px-2.5 py-1 text-sm text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
					>
						Sign out
					</button>
				</>
			) : (
				<button
					type="button"
					onClick={onSignIn}
					className="rounded-md bg-pink-500 px-3 py-1 text-sm font-medium text-white hover:bg-pink-600"
				>
					Sign in
				</button>
			)}
		</div>
	</header>
);
