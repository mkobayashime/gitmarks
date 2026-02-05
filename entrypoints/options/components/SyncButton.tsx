import { SyncIcon } from "@primer/octicons-react";

type Props = {
	syncing: boolean;
	disabled: boolean;
	onPull: () => void;
};

export const SyncButton = ({ syncing, disabled, onPull }: Props) => (
	<button
		type="button"
		onClick={onPull}
		disabled={disabled || syncing}
		className="cursor-pointer rounded-md bg-pink-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-40"
	>
		{syncing ? (
			<span className="inline-flex items-center gap-1.5">
				<span className="inline-block h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
				Syncing…
			</span>
		) : (
			<div className="flex items-center gap-2">
				<SyncIcon />
				Sync
			</div>
		)}
	</button>
);
