import { Button } from "./Button";

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
					<Button kind="secondary" onClick={onClose}>
						Cancel
					</Button>
					<Button kind="secondary" dangerous onClick={onConfirm}>
						Disconnect
					</Button>
				</div>
			</div>
		</div>
	);
};
