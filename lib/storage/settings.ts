import * as v from "valibot";

const SYNC_SETTINGS_KEY = "sync:gitmarks_settings";

const SettingsSchema = v.object({
	syncIntervalMinutes: v.pipe(v.optional(v.number(), 60), v.minValue(20)),
});

export type Settings = v.InferOutput<typeof SettingsSchema>;

export const getSettings = async (): Promise<Settings> => {
	const result = await browser.storage.sync.get(SYNC_SETTINGS_KEY);
	const raw = result[SYNC_SETTINGS_KEY] ?? {};
	const parsed = v.safeParse(SettingsSchema, raw);
	return parsed.success ? parsed.output : { syncIntervalMinutes: 20 };
};

export const updateSettings = async (
	settings: Partial<Settings>,
): Promise<void> => {
	const current = await getSettings();
	const updated = { ...current, ...settings };

	const clamped: Settings = {
		syncIntervalMinutes: Math.max(20, updated.syncIntervalMinutes),
	};

	await browser.storage.sync.set({ [SYNC_SETTINGS_KEY]: clamped });
};
