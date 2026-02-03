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
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
			<div className="w-full max-w-md rounded-lg bg-gray-900 p-6 shadow-xl">
				<h2 className="mb-4 text-lg font-semibold text-white">
					Sign in with GitHub
				</h2>

				{error ? (
					<p className="mb-4 text-sm text-red-400">{error}</p>
				) : deviceFlow ? (
					<>
						<p className="mb-2 text-sm text-gray-300">
							Enter this code at{" "}
							<span className="font-mono text-gray-100">github.com/device</span>
						</p>

						<div className="my-4 rounded-lg bg-gray-800 px-4 py-3 text-center">
							<span className="text-2xl font-bold tracking-widest text-white">
								{deviceFlow.userCode}
							</span>
						</div>

						<a
							href={deviceFlow.verificationUri}
							target="_blank"
							rel="noopener noreferrer"
							className="mb-4 inline-block text-sm text-indigo-400 hover:underline"
						>
							Open github.com/device
						</a>

						<p className="text-sm italic text-gray-500">
							── Waiting for authorization… ──
						</p>
					</>
				) : (
					<p className="text-sm text-gray-400">Starting authentication…</p>
				)}

				<div className="mt-6 flex justify-end">
					<button
						type="button"
						onClick={onCancel}
						className="rounded px-4 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
};
