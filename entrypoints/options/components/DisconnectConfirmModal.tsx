type Props = {
	open: boolean;
	repoFullName: string;
	onConfirm: () => void;
	onClose: () => void;
};

export const DisconnectConfirmModal = ({
	open,
	repoFullName,
	onConfirm,
	onClose,
}: Props) => {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-sm rounded-md border border-zinc-700 bg-zinc-900 p-6">
				<h2 className="mb-2 text-sm font-semibold text-zinc-100 tracking-tight">
					Disconnect this connection?
				</h2>
				<p className="text-sm text-zinc-400">
					This will remove the connection and sync data for{" "}
					<span className="text-zinc-100">{repoFullName}</span>. This action
					cannot be undone.
				</p>

				<div className="mt-6 flex items-center justify-between">
					<button
						type="button"
						onClick={onClose}
						className="cursor-pointer rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-700"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={onConfirm}
						className="cursor-pointer rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
					>
						Disconnect
					</button>
				</div>
			</div>
		</div>
	);
};
