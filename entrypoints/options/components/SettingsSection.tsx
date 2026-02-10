import { NumberInput } from "@ark-ui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@primer/octicons-react";
import { useEffect, useState } from "react";
import {
	getSettings,
	type Settings,
	updateSettings,
} from "../../../lib/storage/settings.ts";

type Props = {
	onToast: (message: string, type: "success" | "error") => void;
};

export const SettingsSection = ({ onToast }: Props) => {
	const [settings, setSettings] = useState<Settings>({
		syncIntervalMinutes: 60,
	});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadSettings = async () => {
			const s = await getSettings();
			setSettings(s);
			setLoading(false);
		};
		void loadSettings();
	}, []);

	const handleIntervalChange = async (value: number) => {
		const clamped = Math.max(20, value);
		try {
			await updateSettings({ syncIntervalMinutes: clamped });
			setSettings({ syncIntervalMinutes: clamped });
			onToast("Settings saved", "success");
		} catch {
			onToast("Failed to save settings", "error");
		}
	};

	if (loading) return null;

	return (
		<section className="p-4 border border-zinc-800 rounded-md bg-zinc-900">
			<label htmlFor="sync-interval" className="block text-xs text-zinc-100">
				Sync interval
			</label>
			<p className="text-xs text-zinc-500">in minutes, minimum 20</p>
			<NumberInput.Root
				id="sync-interval"
				value={settings.syncIntervalMinutes.toString()}
				onValueChange={(details) => {
					void handleIntervalChange(Number(details.value));
				}}
				min={20}
				step={10}
				className="flex items-center h-8 gap-1 mt-2"
			>
				<NumberInput.Input className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-sm text-zinc-100 transition-colors focus:border-pink-500 focus:outline-none" />
				<NumberInput.Control className="flex flex-col gap-1 h-full">
					<NumberInput.IncrementTrigger className="cursor-pointer flex justify-center items-center grow-1 w-6 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-100">
						<ChevronUpIcon size={8} />
					</NumberInput.IncrementTrigger>
					<NumberInput.DecrementTrigger className="cursor-pointer flex justify-center items-center grow-1 w-6 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-100">
						<ChevronDownIcon size={8} />
					</NumberInput.DecrementTrigger>
				</NumberInput.Control>
			</NumberInput.Root>
		</section>
	);
};
