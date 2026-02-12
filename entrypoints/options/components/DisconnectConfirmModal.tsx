import { Dialog } from "@ark-ui/react";
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
}: Props) => (
	<Dialog.Root
		open={open}
		onOpenChange={(details) => !details.open && onClose()}
	>
		<Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50" />
		<Dialog.Positioner className="fixed inset-0 z-50 flex items-center justify-center">
			<Dialog.Content className="w-full max-w-sm rounded-md border border-zinc-800 bg-zinc-950 p-6">
				<Dialog.Title className="mb-2 text-sm font-semibold text-zinc-100 tracking-tight">
					Disconnect this connection?
				</Dialog.Title>
				<Dialog.Description className="text-sm text-zinc-400">
					This will remove the connection and sync data for{" "}
					<span className="text-zinc-100">{repoFullName}</span>. This action
					cannot be undone.
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
							onClick={onConfirm}
						>
							Disconnect
						</Button>
					</Dialog.CloseTrigger>
				</div>
			</Dialog.Content>
		</Dialog.Positioner>
	</Dialog.Root>
);
