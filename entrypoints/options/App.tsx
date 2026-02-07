import { useEffect, useState } from "react";
import {
	autoResolveOrphanConfigs,
	cleanupDeletedConnections,
} from "@/lib/storage/orphan-configs.ts";
import type { Connection } from "@/lib/types/connection";
import { AddConnectionModal } from "./components/AddConnectionModal.tsx";
import { ConnectionList } from "./components/ConnectionList.tsx";
import { Header } from "./components/Header.tsx";
import { LoginModal } from "./components/LoginModal.tsx";
import { useAuth } from "./hooks/useAuth.ts";
import { useConnections } from "./hooks/useConnections.ts";
import { useRepositories } from "./hooks/useRepositories.ts";
import { useSync } from "./hooks/useSync.ts";
import { type Toast, useToast } from "./hooks/useToast.ts";

const SYNC_KEY = "sync:gitmarks_connections";

const toastStyles = {
	success: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
	error: "bg-red-500/10 border-red-500/25 text-red-400",
	info: "bg-zinc-800 border-zinc-700 text-zinc-200",
} as const;

const ToastList = ({
	toasts,
	onRemove,
}: {
	toasts: Toast[];
	onRemove: (id: string) => void;
}) => (
	<div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
		{toasts.map((t) => (
			<div
				key={t.id}
				className={`flex items-center gap-3 rounded-md border px-4 py-2.5 text-sm ${toastStyles[t.type]}`}
			>
				<span>{t.message}</span>
				<button
					type="button"
					onClick={() => onRemove(t.id)}
					className="ml-auto cursor-pointer text-zinc-500 transition-colors hover:text-zinc-400"
				>
					×
				</button>
			</div>
		))}
	</div>
);

const App = () => {
	const {
		state: authState,
		user,
		deviceFlow,
		error: authError,
		signIn,
		cancelSignIn,
		signOut,
	} = useAuth();
	const {
		connections,
		refresh: refreshConnections,
		add,
		update,
		remove,
	} = useConnections();
	const { repos, loading: reposLoading } = useRepositories(
		authState === "authenticated",
	);
	const { toasts, add: addToast, remove: removeToast } = useToast();
	const { syncingIds, pull } = useSync(() => void refreshConnections());

	const [loginOpen, setLoginOpen] = useState(false);
	const [addOpen, setAddOpen] = useState(false);

	const authenticated = authState === "authenticated";

	const handleSignIn = () => {
		setLoginOpen(true);
		void signIn();
	};

	const handleLoginClose = () => {
		cancelSignIn();
		setLoginOpen(false);
	};

	// Auto-close login modal once authenticated
	useEffect(() => {
		if (loginOpen && authState === "authenticated") {
			setLoginOpen(false);
		}
	}, [loginOpen, authState]);

	useEffect(() => {
		const initializeStorage = async () => {
			await cleanupDeletedConnections();
			await autoResolveOrphanConfigs();
			await refreshConnections();
		};

		void initializeStorage();

		const handleStorageChange = (
			changes: Record<string, { oldValue?: unknown; newValue?: unknown }>,
			areaName: string,
		) => {
			if (areaName === "sync" && SYNC_KEY in changes) {
				void (async () => {
					await cleanupDeletedConnections();
					const resolvedCount = await autoResolveOrphanConfigs();
					if (resolvedCount > 0) {
						await refreshConnections();
					}
				})();
			}
		};

		browser.storage.onChanged.addListener(handleStorageChange);
		return () => browser.storage.onChanged.removeListener(handleStorageChange);
	}, [refreshConnections]);

	const handleAddClick = () => {
		if (!authenticated) {
			handleSignIn();
			return;
		}
		setAddOpen(true);
	};

	const handleAddConnection = async (connection: (typeof connections)[0]) => {
		await add(connection);
		setAddOpen(false);
		addToast("Connection added", "success");

		await pull(connection);
	};

	const handleSignOut = () => void signOut();

	const handleUpdate = (id: string, updates: Partial<Connection>) =>
		update(id, updates);

	const handleRemove = (id: string) => remove(id);

	return (
		<div className="min-h-screen bg-zinc-950">
			<Header
				state={authState}
				user={user}
				onSignIn={handleSignIn}
				onSignOut={handleSignOut}
			/>

			<main className="mx-auto max-w-xl px-4 py-6">
				<ConnectionList
					connections={connections}
					syncingIds={syncingIds}
					authenticated={authenticated}
					onUpdate={handleUpdate}
					onRemove={handleRemove}
					onPull={pull}
					onSignIn={handleSignIn}
					onAddClick={handleAddClick}
					onToast={addToast}
				/>
			</main>

			<LoginModal
				open={loginOpen}
				deviceFlow={deviceFlow}
				error={authError}
				onCancel={handleLoginClose}
			/>

			<AddConnectionModal
				open={addOpen}
				repos={repos}
				reposLoading={reposLoading}
				existingConnections={connections}
				onAdd={(conn) => void handleAddConnection(conn)}
				onClose={() => setAddOpen(false)}
			/>

			<ToastList toasts={toasts} onRemove={removeToast} />
		</div>
	);
};

export default App;
