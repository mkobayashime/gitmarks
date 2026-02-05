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
		className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
	>
		{syncing ? (
			<span className="inline-flex items-center gap-1.5">
				<span className="inline-block h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
				Syncing…
			</span>
		) : (
			"Pull"
		)}
	</button>
);
