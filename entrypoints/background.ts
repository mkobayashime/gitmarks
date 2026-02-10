import { getSettings } from "@/lib/storage/settings.ts";
import { syncAllConnections } from "@/lib/sync/sync-all.ts";

const SYNC_ALARM_NAME = "gitmarks-sync";

export default defineBackground(() => {
	const initAlarm = async () => {
		const settings = await getSettings();
		await browser.alarms.create(SYNC_ALARM_NAME, {
			periodInMinutes: settings.syncIntervalMinutes,
		});
	};

	browser.runtime.onInstalled.addListener(() => {
		void initAlarm();
	});

	browser.storage.onChanged.addListener((changes, areaName) => {
		if (areaName === "sync" && "sync:gitmarks_settings" in changes) {
			void initAlarm();
		}
	});

	browser.alarms.onAlarm.addListener((alarm) => {
		if (alarm.name === SYNC_ALARM_NAME) {
			void syncAllConnections();
		}
	});
});
