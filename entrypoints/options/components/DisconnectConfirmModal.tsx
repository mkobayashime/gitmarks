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
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
			<div className="w-full max-w-sm rounded-lg bg-gray-900 p-6 shadow-xl">
				<h2 className="mb-3 text-lg font-semibold text-white">
					Disconnect this connection?
				</h2>
				<p className="text-sm text-gray-300">
					This will remove the connection and sync data for{" "}
					<span className="font-mono text-gray-100">{repoFullName}</span>. This
					action cannot be undone.
				</p>

				<div className="mt-6 flex justify-between">
					<button
						type="button"
						onClick={onClose}
						className="rounded px-4 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={onConfirm}
						className="rounded bg-red-600 px-4 py-1.5 text-sm text-white hover:bg-red-500"
					>
						Disconnect
					</button>
				</div>
			</div>
		</div>
	);
};
