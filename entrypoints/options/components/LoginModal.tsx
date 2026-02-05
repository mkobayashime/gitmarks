import type { DeviceFlowInfo } from "../hooks/useAuth.ts";

type Props = {
	open: boolean;
	deviceFlow: DeviceFlowInfo | null;
	error: string | null;
	onCancel: () => void;
};

export const LoginModal = ({ open, deviceFlow, error, onCancel }: Props) => {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-md rounded-md border border-zinc-800 bg-zinc-950 p-6">
				<h2 className="mb-4 text-sm font-semibold text-zinc-100 tracking-tight">
					Sign in with GitHub
				</h2>

				{error ? (
					<div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2.5">
						<p className="text-sm text-red-400">{error}</p>
					</div>
				) : deviceFlow ? (
					<>
						<p className="mb-3 text-sm text-zinc-400">
							Enter this code at{" "}
							<span className="font-mono text-zinc-100">github.com/device</span>
						</p>

						<div className="mb-3 rounded-md border border-zinc-700 bg-zinc-900 p-2 text-center">
							<span className="font-mono text-base font-semibold tracking-widest text-zinc-100">
								{deviceFlow.userCode}
							</span>
						</div>

						<a
							href={deviceFlow.verificationUri}
							target="_blank"
							rel="noopener noreferrer"
							className="w-full flex justify-center rounded-md bg-indigo-600 p-2 text-sm font-medium text-white hover:bg-indigo-500"
						>
							Open github.com/device →
						</a>

						<p className="mt-3 text-xs text-zinc-600">
							Waiting for authorization…
						</p>
					</>
				) : (
					<p className="text-xs text-zinc-500">Starting authentication…</p>
				)}

				<div className="mt-6 flex justify-end">
					<button
						type="button"
						onClick={onCancel}
						className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-400"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
};
