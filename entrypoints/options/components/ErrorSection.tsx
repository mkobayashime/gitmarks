type Props = {
	error: string | null;
	onRetry?: () => void;
};

export const ErrorSection = ({ error, onRetry }: Props) => {
	if (!error) return null;

	return (
		<div className="mt-3 border-t border-red-800 pt-2">
			<p className="text-xs font-medium text-red-400">Errors</p>
			<div className="flex items-start gap-2 mt-1">
				<span className="text-red-300 text-sm">⚠ {error}</span>
				{onRetry && (
					<button
						type="button"
						onClick={onRetry}
						className="text-xs text-indigo-400 hover:underline shrink-0"
					>
						Retry
					</button>
				)}
			</div>
		</div>
	);
};
