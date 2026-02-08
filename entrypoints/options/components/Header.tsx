import type { GitHubUser } from "../../../lib/types/user.ts";
import type { AuthState } from "../hooks/useAuth.ts";
import { Button } from "./Button";

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
					<Button kind="ghost" size="sm" onClick={onSignOut}>
						Sign out
					</Button>
				</>
			) : (
				<Button kind="primary" onClick={onSignIn}>
					Sign in
				</Button>
			)}
		</div>
	</header>
);
