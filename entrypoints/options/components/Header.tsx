import { Dialog } from "@ark-ui/react";
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
					<Dialog.Root>
						<Dialog.Trigger asChild>
							<Button kind="ghost" size="sm">
								Sign out
							</Button>
						</Dialog.Trigger>
						<Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50" />
						<Dialog.Positioner className="fixed inset-0 z-50 flex items-center justify-center">
							<Dialog.Content className="w-full max-w-sm rounded-md border border-zinc-800 bg-zinc-950 p-6">
								<Dialog.Title className="mb-2 text-sm font-semibold text-zinc-100 tracking-tight">
									Sign out?
								</Dialog.Title>
								<Dialog.Description className="text-sm text-zinc-400">
									Syncing will stop until you sign in again.
								</Dialog.Description>
								<div className="mt-6 flex items-center justify-between gap-2">
									<Dialog.CloseTrigger asChild>
										<Button kind="secondary" className="flex-1 basis-full">
											Cancel
										</Button>
									</Dialog.CloseTrigger>
									<Dialog.CloseTrigger asChild>
										<Button
											kind="secondary"
											className="flex-1 basis-full"
											dangerous
											onClick={onSignOut}
										>
											Sign out
										</Button>
									</Dialog.CloseTrigger>
								</div>
							</Dialog.Content>
						</Dialog.Positioner>
					</Dialog.Root>
				</>
			) : (
				<Button kind="primary" onClick={onSignIn}>
					Sign in
				</Button>
			)}
		</div>
	</header>
);
