type Props = {
	error: string | null;
	onRetry?: () => void;
};

export const ErrorSection = ({ error, onRetry }: Props) => {
	if (!error) return null;

	return (
		<div className="mt-3 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2.5">
			<div className="flex items-start justify-between gap-2">
				<span className="text-sm text-red-400">{error}</span>
				{onRetry && (
					<button
						type="button"
						onClick={onRetry}
						className="cursor-pointer shrink-0 text-sm font-medium text-pink-400 transition-colors hover:text-pink-300"
					>
						Retry
					</button>
				)}
			</div>
		</div>
	);
};
