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
		className="rounded bg-indigo-600 px-4 py-1.5 text-sm text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
	>
		{syncing ? (
			<span className="inline-flex items-center gap-1.5">
				<span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
				Syncing…
			</span>
		) : (
			"Pull"
		)}
	</button>
);
